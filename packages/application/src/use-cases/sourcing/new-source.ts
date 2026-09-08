import {
  type AllocationPolicy,
  asSourceId,
  type DomainError,
  type IsoDate,
  type Money,
  ok,
  PurchaseSource,
  type Result,
  type SourceKind,
  type SourceLocation,
  type SupplierKind,
  toIsoDate,
  type Workspace,
} from "@chine/domain";
import type { AppDependencies, TransactionalRepositories } from "../../ports/index.js";
import { startOfMonth } from "../../shared/dates.js";
import { omitUndefined } from "../../shared/objects.js";
import { ensureQuota } from "../../shared/quotas.js";

export interface NewSourceInput {
  readonly kind: SourceKind;
  readonly name: string;
  readonly supplierName?: string;
  readonly supplierKind: SupplierKind;
  readonly purchasedAt?: IsoDate;
  readonly goodsCost: Money;
  readonly extraCosts?: Money;
  readonly announcedQuantity?: number;
  readonly weightKg?: number;
  readonly location?: SourceLocation;
  readonly allocationPolicy?: AllocationPolicy;
  readonly notes?: string;
}

/** Crée et sauvegarde une source dans la transaction courante, quota mensuel compris. */
export async function createSourceInTx(
  repos: TransactionalRepositories,
  deps: Pick<AppDependencies, "ids" | "clock">,
  ws: Workspace,
  input: NewSourceInput,
): Promise<Result<PurchaseSource, DomainError>> {
  const now = deps.clock.now();
  // Les achats unitaires (mode Chiner) ne consomment pas le quota de sources :
  // c'est le quota de pièces qui les limite. Un reseller en brocante n'a pas à compter ses sources.
  if (input.kind !== "UNIT") {
    const used = await repos.sources.countCreatedSince(ws.id, startOfMonth(now));
    const quota = ensureQuota(ws.plan, "sourcesPerMonth", used);
    if (!quota.ok) return quota;
  }
  const created = PurchaseSource.create({
    ...omitUndefined({
      supplierName: input.supplierName,
      announcedQuantity: input.announcedQuantity,
      weightKg: input.weightKg,
      location: input.location,
      allocationPolicy: input.allocationPolicy,
      notes: input.notes,
    }),
    id: asSourceId(deps.ids.next()),
    workspaceId: ws.id,
    kind: input.kind,
    name: input.name.trim(),
    supplierKind: input.supplierKind,
    purchasedAt: input.purchasedAt ?? toIsoDate(now),
    goodsCost: input.goodsCost,
    extraCosts: input.extraCosts ?? input.goodsCost.subtract(input.goodsCost),
    now,
  });
  if (!created.ok) return created;
  await repos.sources.save(created.value);
  return ok(created.value);
}
