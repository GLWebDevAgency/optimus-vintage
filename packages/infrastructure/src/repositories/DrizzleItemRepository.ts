import {
  asItemId,
  asSourceId,
  asWorkspaceId,
  Item,
  type ItemId,
  type ItemProps,
  SELLABLE,
  type SourceId,
  type WorkspaceId,
} from "@chine/domain";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type ItemRow, items } from "../db/schema.js";
import type { ItemFilter, ItemRepository } from "../ports.js";
import {
  compact,
  likePattern,
  minorOrNull,
  money,
  moneyOrUndefined,
  mutable,
  orNull,
  orUndefined,
  page,
} from "./mapping.js";

export function itemToDomain(row: ItemRow): Item {
  const props = compact<ItemProps>({
    id: asItemId(row.id),
    workspaceId: asWorkspaceId(row.workspaceId),
    sourceId: asSourceId(row.sourceId),
    sku: row.sku,
    title: row.title,
    brand: orUndefined(row.brand),
    category: row.category,
    gender: orUndefined(row.gender),
    size: orUndefined(row.size),
    condition: row.condition,
    era: orUndefined(row.era),
    colors: row.colors,
    materials: row.materials,
    measurements: orUndefined(row.measurements),
    acquisitionCost: money(row.acquisitionCostMinor, row.currency),
    retailPrice: moneyOrUndefined(row.retailPriceMinor, row.currency),
    targetPrice: moneyOrUndefined(row.targetPriceMinor, row.currency),
    status: row.status,
    photos: row.photos,
    bin: orUndefined(row.bin),
    notes: orUndefined(row.notes),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    listedAt: orUndefined(row.listedAt),
    soldAt: orUndefined(row.soldAt),
  });
  return Item.rehydrate(props);
}

export function itemToRow(item: Item) {
  const p = item.toProps();
  return {
    id: p.id as string,
    workspaceId: p.workspaceId as string,
    sourceId: p.sourceId as string,
    sku: p.sku,
    title: p.title,
    brand: orNull(p.brand),
    category: p.category,
    gender: orNull(p.gender),
    size: orNull(p.size),
    condition: p.condition,
    era: orNull(p.era),
    colors: mutable(p.colors),
    materials: mutable(p.materials),
    measurements: p.measurements ? { ...p.measurements } : null,
    acquisitionCostMinor: p.acquisitionCost.minor,
    retailPriceMinor: minorOrNull(p.retailPrice),
    targetPriceMinor: minorOrNull(p.targetPrice),
    currency: p.acquisitionCost.currency,
    status: p.status,
    photos: p.photos.map((ph) => ({ ...ph })),
    bin: orNull(p.bin),
    notes: orNull(p.notes),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    listedAt: orNull(p.listedAt),
    soldAt: orNull(p.soldAt),
  };
}

const SELLABLE_STATUSES = [...SELLABLE];

function whereFor(workspaceId: WorkspaceId, filter: ItemFilter): SQL {
  const conditions: SQL[] = [eq(items.workspaceId, workspaceId)];
  if (filter.status && filter.status.length > 0)
    conditions.push(inArray(items.status, mutable(filter.status)));
  if (filter.sourceId) conditions.push(eq(items.sourceId, filter.sourceId));
  if (filter.search?.trim()) {
    const pattern = likePattern(filter.search);
    const clause = or(
      ilike(items.title, pattern),
      ilike(items.brand, pattern),
      ilike(items.sku, pattern),
    );
    if (clause) conditions.push(clause);
  }
  if (filter.dormantSince) {
    // Stock dormant : pièce encore vendable, entrée en stock avant la date seuil.
    conditions.push(
      inArray(items.status, SELLABLE_STATUSES),
      lte(items.createdAt, filter.dormantSince),
    );
  }
  return and(...conditions) ?? sql`true`;
}

function orderFor(sort: ItemFilter["sort"]): SQL[] {
  switch (sort) {
    case "oldest":
      return [asc(items.createdAt), asc(items.sku)];
    case "cost_desc":
      return [desc(items.acquisitionCostMinor), desc(items.createdAt)];
    case "cost_asc":
      return [asc(items.acquisitionCostMinor), desc(items.createdAt)];
    case "title":
      return [asc(items.title), asc(items.sku)];
    default:
      return [desc(items.createdAt), desc(items.sku)];
  }
}

export class DrizzleItemRepository implements ItemRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(workspaceId: WorkspaceId, id: ItemId): Promise<Item | undefined> {
    const row = await this.db.query.items.findFirst({
      where: and(eq(items.workspaceId, workspaceId), eq(items.id, id)),
    });
    return row ? itemToDomain(row) : undefined;
  }

  async bySku(workspaceId: WorkspaceId, sku: string): Promise<Item | undefined> {
    const row = await this.db.query.items.findFirst({
      where: and(eq(items.workspaceId, workspaceId), eq(items.sku, sku.trim().toUpperCase())),
    });
    return row ? itemToDomain(row) : undefined;
  }

  async list(workspaceId: WorkspaceId, filter: ItemFilter = {}): Promise<readonly Item[]> {
    const { limit, offset } = page(filter.limit, filter.offset);
    const rows = await this.db
      .select()
      .from(items)
      .where(whereFor(workspaceId, filter))
      .orderBy(...orderFor(filter.sort))
      .limit(limit)
      .offset(offset);
    return rows.map(itemToDomain);
  }

  async bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Item[]> {
    const rows = await this.db
      .select()
      .from(items)
      .where(and(eq(items.workspaceId, workspaceId), eq(items.sourceId, sourceId)))
      .orderBy(asc(items.sku));
    return rows.map(itemToDomain);
  }

  async count(workspaceId: WorkspaceId, filter: ItemFilter = {}): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(items)
      .where(whereFor(workspaceId, filter));
    return row?.n ?? 0;
  }

  async save(item: Item): Promise<void> {
    await this.saveMany([item]);
  }

  async saveMany(list: readonly Item[]): Promise<void> {
    if (list.length === 0) return;
    const rows = list.map(itemToRow);
    await this.db
      .insert(items)
      .values(rows)
      .onConflictDoUpdate({
        target: items.id,
        set: UPSERT_SET,
        setWhere: sql`${items.workspaceId} = excluded."workspace_id"`,
      });
  }

  async delete(workspaceId: WorkspaceId, id: ItemId): Promise<void> {
    await this.db.delete(items).where(and(eq(items.workspaceId, workspaceId), eq(items.id, id)));
  }

  // ── Idempotence des captures hors ligne (hors port applicatif) ──────────

  /** Pièce déjà créée pour cet identifiant client (synchronisation rejouée). */
  async byClientId(workspaceId: WorkspaceId, clientId: string): Promise<Item | undefined> {
    const row = await this.db.query.items.findFirst({
      where: and(eq(items.workspaceId, workspaceId), eq(items.clientId, clientId)),
    });
    return row ? itemToDomain(row) : undefined;
  }

  /**
   * Rattache l'identifiant client à une pièce fraîchement créée. Lève `ClientIdConflict`
   * si un autre enregistrement porte déjà cet identifiant (course entre deux rejeux).
   */
  async setClientId(workspaceId: WorkspaceId, id: ItemId, clientId: string): Promise<void> {
    try {
      await this.db
        .update(items)
        .set({ clientId })
        .where(and(eq(items.workspaceId, workspaceId), eq(items.id, id)));
    } catch (e) {
      if (isUniqueViolation(e)) throw new ClientIdConflict(clientId);
      throw e;
    }
  }
}

export class ClientIdConflict extends Error {
  override readonly name = "ClientIdConflict";
  constructor(readonly clientId: string) {
    super(`Une pièce porte déjà l'identifiant client ${clientId}`);
  }
}

/** Code SQLSTATE 23505 (contrainte d'unicité), remonté tel quel par pg et PGlite. */
const isUniqueViolation = (e: unknown): boolean =>
  typeof e === "object" &&
  e !== null &&
  (("code" in e && e.code === "23505") ||
    ("cause" in e && isUniqueViolation((e as { cause: unknown }).cause)));

/**
 * Colonnes réécrites en cas de conflit : tout sauf l'identité, la date de création et
 * `client_id`, qui n'appartient pas au modèle de domaine et ne doit jamais être effacé.
 */
const UPSERT_SET = Object.fromEntries(
  Object.entries(getTableColumns(items))
    .filter(([key]) => !["id", "workspaceId", "createdAt", "clientId"].includes(key))
    .map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]),
);
