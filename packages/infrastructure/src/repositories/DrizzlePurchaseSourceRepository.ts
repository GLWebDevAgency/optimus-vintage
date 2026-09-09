import {
  asSourceId,
  asWorkspaceId,
  PurchaseSource,
  type PurchaseSourceProps,
  type SourceId,
  type WorkspaceId,
} from "@chine/domain";
import { and, count, desc, eq, gte, ilike, ne, or, sql } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type PurchaseSourceRow, purchaseSources } from "../db/schema.js";
import type { PurchaseSourceRepository, SourceFilter } from "../ports.js";
import { compact, isoDate, likePattern, money, orNull, orUndefined, page } from "./mapping.js";

export function purchaseSourceToDomain(row: PurchaseSourceRow): PurchaseSource {
  const props = compact<PurchaseSourceProps>({
    id: asSourceId(row.id),
    workspaceId: asWorkspaceId(row.workspaceId),
    kind: row.kind,
    name: row.name,
    supplierName: orUndefined(row.supplierName),
    supplierKind: row.supplierKind,
    purchasedAt: isoDate(row.purchasedAt),
    goodsCost: money(row.goodsCostMinor, row.currency),
    extraCosts: money(row.extraCostsMinor, row.currency),
    announcedQuantity: orUndefined(row.announcedQuantity),
    receivedQuantity: orUndefined(row.receivedQuantity),
    weightKg: orUndefined(row.weightKg),
    location: orUndefined(row.location),
    allocationPolicy: row.allocationPolicy,
    notes: orUndefined(row.notes),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
  return PurchaseSource.rehydrate(props);
}

export function purchaseSourceToRow(source: PurchaseSource) {
  const p = source.toProps();
  return {
    id: p.id as string,
    workspaceId: p.workspaceId as string,
    kind: p.kind,
    name: p.name,
    supplierName: orNull(p.supplierName),
    supplierKind: p.supplierKind,
    purchasedAt: p.purchasedAt,
    goodsCostMinor: p.goodsCost.minor,
    extraCostsMinor: p.extraCosts.minor,
    currency: p.goodsCost.currency,
    announcedQuantity: orNull(p.announcedQuantity),
    receivedQuantity: orNull(p.receivedQuantity),
    weightKg: orNull(p.weightKg),
    location: p.location ? { ...p.location } : null,
    allocationPolicy: p.allocationPolicy,
    notes: orNull(p.notes),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class DrizzlePurchaseSourceRepository implements PurchaseSourceRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(workspaceId: WorkspaceId, id: SourceId): Promise<PurchaseSource | undefined> {
    const row = await this.db.query.purchaseSources.findFirst({
      where: and(eq(purchaseSources.workspaceId, workspaceId), eq(purchaseSources.id, id)),
    });
    return row ? purchaseSourceToDomain(row) : undefined;
  }

  async list(
    workspaceId: WorkspaceId,
    filter: SourceFilter = {},
  ): Promise<readonly PurchaseSource[]> {
    const { limit, offset } = page(filter.limit, filter.offset);
    const conditions = [eq(purchaseSources.workspaceId, workspaceId)];
    if (filter.kind) conditions.push(eq(purchaseSources.kind, filter.kind));
    if (filter.search?.trim()) {
      const pattern = likePattern(filter.search);
      const clause = or(
        ilike(purchaseSources.name, pattern),
        ilike(purchaseSources.supplierName, pattern),
        ilike(purchaseSources.notes, pattern),
      );
      if (clause) conditions.push(clause);
    }
    const rows = await this.db
      .select()
      .from(purchaseSources)
      .where(and(...conditions))
      .orderBy(desc(purchaseSources.purchasedAt), desc(purchaseSources.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(purchaseSourceToDomain);
  }

  async countCreatedSince(workspaceId: WorkspaceId, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(purchaseSources)
      .where(
        and(
          eq(purchaseSources.workspaceId, workspaceId),
          ne(purchaseSources.kind, "UNIT"),
          gte(purchaseSources.createdAt, since),
        ),
      );
    return row?.n ?? 0;
  }

  async save(source: PurchaseSource): Promise<void> {
    const { id, workspaceId, createdAt, ...rest } = purchaseSourceToRow(source);
    await this.db
      .insert(purchaseSources)
      .values({ id, workspaceId, createdAt, ...rest })
      .onConflictDoUpdate({
        target: purchaseSources.id,
        set: rest,
        // Cloisonnement : on ne réécrit jamais une ligne d'un autre espace.
        setWhere: sql`${purchaseSources.workspaceId} = excluded."workspace_id"`,
      });
  }

  async delete(workspaceId: WorkspaceId, id: SourceId): Promise<void> {
    await this.db
      .delete(purchaseSources)
      .where(and(eq(purchaseSources.workspaceId, workspaceId), eq(purchaseSources.id, id)));
  }
}
