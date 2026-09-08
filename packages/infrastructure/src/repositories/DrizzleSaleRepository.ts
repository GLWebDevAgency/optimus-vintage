import {
  asItemId,
  asSaleId,
  asSourceId,
  asWorkspaceId,
  type ItemId,
  Sale,
  type SaleId,
  type SaleProps,
  type SourceId,
  type WorkspaceId,
} from "@chine/domain";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type SaleRow, sales } from "../db/schema.js";
import type { SaleFilter, SaleRepository } from "../ports.js";
import { compact, isoDate, money, orNull, orUndefined, page } from "./mapping.js";

export function saleToDomain(row: SaleRow): Sale {
  const c = row.currency;
  const props = compact<SaleProps>({
    id: asSaleId(row.id),
    workspaceId: asWorkspaceId(row.workspaceId),
    itemId: asItemId(row.itemId),
    sourceId: asSourceId(row.sourceId),
    platform: row.platform,
    grossPrice: money(row.grossPriceMinor, c),
    platformFees: money(row.platformFeesMinor, c),
    shippingCost: money(row.shippingCostMinor, c),
    packagingCost: money(row.packagingCostMinor, c),
    otherCosts: money(row.otherCostsMinor, c),
    acquisitionCost: money(row.acquisitionCostMinor, c),
    soldAt: isoDate(row.soldAt),
    status: row.status,
    buyer: orUndefined(row.buyer),
    notes: orUndefined(row.notes),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    refundedAt: orUndefined(row.refundedAt),
  });
  return Sale.rehydrate(props);
}

export function saleToRow(sale: Sale) {
  const p = sale.toProps();
  return {
    id: p.id as string,
    workspaceId: p.workspaceId as string,
    itemId: p.itemId as string,
    sourceId: p.sourceId as string,
    platform: p.platform,
    grossPriceMinor: p.grossPrice.minor,
    platformFeesMinor: p.platformFees.minor,
    shippingCostMinor: p.shippingCost.minor,
    packagingCostMinor: p.packagingCost.minor,
    otherCostsMinor: p.otherCosts.minor,
    acquisitionCostMinor: p.acquisitionCost.minor,
    currency: p.grossPrice.currency,
    soldAt: p.soldAt,
    status: p.status,
    buyer: orNull(p.buyer),
    notes: orNull(p.notes),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    refundedAt: orNull(p.refundedAt),
  };
}

export class DrizzleSaleRepository implements SaleRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(workspaceId: WorkspaceId, id: SaleId): Promise<Sale | undefined> {
    const row = await this.db.query.sales.findFirst({
      where: and(eq(sales.workspaceId, workspaceId), eq(sales.id, id)),
    });
    return row ? saleToDomain(row) : undefined;
  }

  async byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Sale[]> {
    const rows = await this.db
      .select()
      .from(sales)
      .where(and(eq(sales.workspaceId, workspaceId), eq(sales.itemId, itemId)))
      .orderBy(desc(sales.soldAt), desc(sales.createdAt));
    return rows.map(saleToDomain);
  }

  async bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Sale[]> {
    const rows = await this.db
      .select()
      .from(sales)
      .where(and(eq(sales.workspaceId, workspaceId), eq(sales.sourceId, sourceId)))
      .orderBy(asc(sales.soldAt), asc(sales.createdAt));
    return rows.map(saleToDomain);
  }

  async list(workspaceId: WorkspaceId, filter: SaleFilter = {}): Promise<readonly Sale[]> {
    const { limit, offset } = page(filter.limit, filter.offset);
    const conditions: SQL[] = [eq(sales.workspaceId, workspaceId)];
    if (filter.from) conditions.push(gte(sales.soldAt, filter.from));
    if (filter.to) conditions.push(lte(sales.soldAt, filter.to));
    if (filter.sourceId) conditions.push(eq(sales.sourceId, filter.sourceId));
    if (filter.itemId) conditions.push(eq(sales.itemId, filter.itemId));
    if (filter.platform) conditions.push(eq(sales.platform, filter.platform));
    const rows = await this.db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.soldAt), desc(sales.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(saleToDomain);
  }

  async save(sale: Sale): Promise<void> {
    const { id, workspaceId, createdAt, ...rest } = saleToRow(sale);
    await this.db
      .insert(sales)
      .values({ id, workspaceId, createdAt, ...rest })
      .onConflictDoUpdate({ target: sales.id, set: rest });
  }
}
