import {
  allocateCosts,
  asItemId,
  type Category,
  type Condition,
  type DomainError,
  err,
  formatSku,
  Item,
  Money,
  ok,
  type Result,
  type SourceId,
} from "@chine/domain";
import type { ItemDto } from "../../dto.js";
import { NotFound, ValidationFailed } from "../../errors.js";
import { toItemDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { ensureQuota } from "../../shared/quotas.js";
import { transact } from "../../shared/transaction.js";
import { countSellableItems } from "../shared/counts.js";
import type { UseCase } from "../use-case.js";

export interface GeneratePiecesForSourceCommand extends WorkspaceScoped {
  readonly sourceId: SourceId;
  /** Nombre de pièces à créer ; par défaut, quantité effective moins les pièces déjà saisies. */
  readonly count?: number;
  readonly category?: Category;
  readonly condition?: Condition;
  /** Un poids par pièce : active la répartition au poids (palettes). */
  readonly weightsKg?: readonly number[];
}
export interface GeneratePiecesForSourceOutput {
  readonly items: readonly ItemDto[];
}

/**
 * Détaille un lot / une palette en N pièces « Pièce n ». Le reliquat (investissement − coûts déjà
 * attribués) est réparti sur les emplacements restants : générer tout le lot somme exactement à l'investissement.
 */
export class GeneratePiecesForSource
  implements UseCase<GeneratePiecesForSourceCommand, GeneratePiecesForSourceOutput>
{
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "photos">,
  ) {}

  execute(
    cmd: GeneratePiecesForSourceCommand,
  ): Promise<Result<GeneratePiecesForSourceOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const source = await repos.sources.byId(ws.value.id, cmd.sourceId);
      if (!source) return err(new NotFound("PurchaseSource", cmd.sourceId));
      if (source.kind !== "LOT" && source.kind !== "PALLET") {
        return err(
          new ValidationFailed("Seuls les lots et palettes se détaillent en pièces", {
            kind: source.kind,
          }),
        );
      }
      const existing = await repos.items.bySource(ws.value.id, source.id);
      const count = cmd.count ?? (source.effectiveQuantity ?? 0) - existing.length;
      if (!Number.isInteger(count) || count <= 0)
        return err(new ValidationFailed("Nombre de pièces invalide", { count }));
      if (cmd.weightsKg && cmd.weightsKg.length !== count)
        return err(new ValidationFailed("Un poids par pièce est requis"));

      const used = await countSellableItems(repos.items, ws.value.id);
      const quota = ensureQuota(ws.value.plan, "items", used, count);
      if (!quota.ok) return quota;

      // Reliquat à répartir sur les emplacements restants du lot ; on n'en matérialise que `count`.
      const alreadyAllocated = existing.reduce(
        (acc, i) => acc.add(i.acquisitionCost),
        Money.zero(source.currency),
      );
      const pool = source.totalInvestment
        .subtract(alreadyAllocated)
        .max(Money.zero(source.currency));
      const slots = cmd.weightsKg
        ? count
        : Math.max(count, (source.effectiveQuantity ?? 0) - existing.length);
      const costs = allocateCosts(pool, cmd.weightsKg ? "BY_WEIGHT" : "EVEN", slots, cmd.weightsKg);

      const now = this.deps.clock.now();
      const items: Item[] = [];
      for (let i = 0; i < count; i++) {
        const sku = formatSku(ws.value.skuPrefix, await repos.skuSequence.next(ws.value.id));
        const created = Item.create({
          id: asItemId(this.deps.ids.next()),
          workspaceId: ws.value.id,
          sourceId: source.id,
          sku,
          title: `Pièce ${existing.length + i + 1}`,
          category: cmd.category ?? "OTHER",
          condition: cmd.condition ?? "GOOD",
          acquisitionCost: costs[i] ?? Money.zero(source.currency),
          now,
        });
        if (!created.ok) return created;
        items.push(created.value);
      }
      await repos.items.saveMany(items);
      events.collect(...items);
      const ctx = { now, publicUrl: (k: string) => this.deps.photos.publicUrl(k) };
      return ok({ items: items.map((i) => toItemDto(i, ctx)) });
    });
  }
}
