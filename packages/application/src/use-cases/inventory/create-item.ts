import {
  type AppraisalId,
  asItemId,
  asPhotoId,
  type Category,
  type Condition,
  type DomainError,
  type Era,
  err,
  formatSku,
  type Gender,
  type IsoDate,
  Item,
  type Measurements,
  Money,
  ok,
  type PhotoRef,
  type PurchaseSource,
  type Result,
  type SourceId,
  type SourceLocation,
  type SupplierKind,
  toIsoDate,
  type Workspace,
} from "@chine/domain";
import type { ItemDto, SourceDto } from "../../dto.js";
import { NotFound, ValidationFailed } from "../../errors.js";
import { toItemDto, toSourceDto } from "../../mappers/index.js";
import type { AppDependencies, TransactionalRepositories } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { ensureQuota } from "../../shared/quotas.js";
import { transact } from "../../shared/transaction.js";
import { countSellableItems } from "../shared/counts.js";
import { createSourceInTx } from "../sourcing/new-source.js";
import type { UseCase } from "../use-case.js";
import { type ItemPrefill, prefillFromAppraisal } from "./appraisal-prefill.js";

/** « Chiner » : une pièce trouvée en brocante crée sa source unitaire à la volée. */
export interface QuickCaptureInput {
  readonly pricePaid: MoneyInput;
  readonly extraCosts?: MoneyInput;
  readonly supplierKind?: SupplierKind;
  readonly supplierName?: string;
  readonly location?: SourceLocation;
  readonly purchasedAt?: IsoDate;
}
export interface PhotoInput {
  readonly key: string;
  readonly width?: number;
  readonly height?: number;
  readonly blurhash?: string;
}
export interface CreateItemCommand extends WorkspaceScoped {
  readonly sourceId?: SourceId;
  readonly quickCapture?: QuickCaptureInput;
  /** Expertise à utiliser pour préremplir (les champs explicites priment). */
  readonly appraisalId?: AppraisalId;
  readonly title?: string;
  readonly brand?: string;
  readonly category?: Category;
  readonly gender?: Gender;
  readonly size?: string;
  readonly condition?: Condition;
  readonly era?: Era;
  readonly colors?: readonly string[];
  readonly materials?: readonly string[];
  readonly measurements?: Measurements;
  readonly acquisitionCost?: MoneyInput;
  readonly retailPrice?: MoneyInput;
  readonly targetPrice?: MoneyInput;
  readonly photos?: readonly PhotoInput[];
  readonly bin?: string;
  readonly notes?: string;
}
export interface CreateItemOutput {
  readonly item: ItemDto;
  readonly source: SourceDto;
}

export class CreateItem implements UseCase<CreateItemCommand, CreateItemOutput> {
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "photos">,
  ) {}

  execute(cmd: CreateItemCommand): Promise<Result<CreateItemOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const money = readMoney(ws.value, {
        acquisitionCost: cmd.acquisitionCost,
        retailPrice: cmd.retailPrice,
        targetPrice: cmd.targetPrice,
        pricePaid: cmd.quickCapture?.pricePaid,
        quickExtraCosts: cmd.quickCapture?.extraCosts,
      });
      if (!money.ok) return money;

      let prefill: ItemPrefill = {};
      const appraisal = cmd.appraisalId
        ? await repos.appraisals.byId(ws.value.id, cmd.appraisalId)
        : undefined;
      if (cmd.appraisalId && !appraisal) return err(new NotFound("Appraisal", cmd.appraisalId));
      if (appraisal) prefill = prefillFromAppraisal(appraisal, ws.value.currency);

      const title = cmd.title?.trim() || prefill.title || "Pièce sans titre";
      const source = await this.resolveSource(
        repos,
        ws.value,
        cmd,
        title,
        money.value.pricePaid,
        money.value.quickExtraCosts,
      );
      if (!source.ok) return source;

      const used = await countSellableItems(repos.items, ws.value.id);
      const quota = ensureQuota(ws.value.plan, "items", used);
      if (!quota.ok) return quota;

      const now = this.deps.clock.now();
      const sku = formatSku(ws.value.skuPrefix, await repos.skuSequence.next(ws.value.id));
      const photos: PhotoRef[] = (cmd.photos ?? []).map((p) => ({
        ...omitUndefined(p),
        id: asPhotoId(this.deps.ids.next()),
      }));
      const created = Item.create({
        ...omitUndefined({
          brand: cmd.brand ?? prefill.brand,
          gender: cmd.gender,
          size: cmd.size ?? prefill.size,
          era: cmd.era ?? prefill.era,
          measurements: cmd.measurements,
          retailPrice: money.value.retailPrice ?? prefill.retailPrice,
          targetPrice: money.value.targetPrice ?? prefill.targetPrice,
          bin: cmd.bin,
          notes: cmd.notes,
        }),
        id: asItemId(this.deps.ids.next()),
        workspaceId: ws.value.id,
        sourceId: source.value.id,
        sku,
        title,
        category: cmd.category ?? prefill.category ?? "OTHER",
        condition: cmd.condition ?? prefill.condition ?? "GOOD",
        colors: cmd.colors ?? prefill.colors ?? [],
        materials: cmd.materials ?? prefill.materials ?? [],
        acquisitionCost: money.value.acquisitionCost ?? defaultCost(source.value),
        photos,
        now,
      });
      if (!created.ok) return created;
      await repos.items.save(created.value);
      if (appraisal && !appraisal.itemId)
        await repos.appraisals.save({ ...appraisal, itemId: created.value.id });
      events.collect(created.value, source.value);
      const ctx = { now, publicUrl: (k: string) => this.deps.photos.publicUrl(k) };
      return ok({ item: toItemDto(created.value, ctx), source: toSourceDto(source.value) });
    });
  }

  private async resolveSource(
    repos: TransactionalRepositories,
    ws: Workspace,
    cmd: CreateItemCommand,
    title: string,
    pricePaid: Money | undefined,
    extra: Money | undefined,
  ): Promise<Result<PurchaseSource, DomainError>> {
    if (cmd.sourceId) {
      const source = await repos.sources.byId(ws.id, cmd.sourceId);
      return source ? ok(source) : err(new NotFound("PurchaseSource", cmd.sourceId));
    }
    if (!cmd.quickCapture || !pricePaid)
      return err(
        new ValidationFailed(
          "Une source (sourceId) ou une capture rapide (quickCapture) est requise",
        ),
      );
    const q = cmd.quickCapture;
    return createSourceInTx(repos, this.deps, ws, {
      ...omitUndefined({ supplierName: q.supplierName, location: q.location, extraCosts: extra }),
      kind: "UNIT",
      name: title,
      supplierKind: q.supplierKind ?? "FLEA_MARKET",
      purchasedAt: q.purchasedAt ?? toIsoDate(this.deps.clock.now()),
      goodsCost: pricePaid,
    });
  }
}

/** Coût par défaut d'une pièce : tout l'achat pour un unitaire, sinon le coût unitaire moyen. */
const defaultCost = (source: PurchaseSource): Money =>
  source.kind === "UNIT"
    ? source.totalInvestment
    : (source.averageUnitCost ?? Money.zero(source.currency));
