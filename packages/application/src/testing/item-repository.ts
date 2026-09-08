import { Item, type ItemId, type ItemProps, type SourceId, type WorkspaceId } from "@chine/domain";
import type { ItemFilter, ItemRepository } from "../ports/index.js";
import { InMemoryTable, matchesSearch, paginate } from "./table.js";

const SORTS: Record<NonNullable<ItemFilter["sort"]>, (a: ItemProps, b: ItemProps) => number> = {
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  cost_desc: (a, b) => b.acquisitionCost.minor - a.acquisitionCost.minor,
  cost_asc: (a, b) => a.acquisitionCost.minor - b.acquisitionCost.minor,
  title: (a, b) => a.title.localeCompare(b.title, "fr"),
};

/** `dormantSince` : pièces créées à cette date ou avant (le statut vendable est filtré par l'appelant). */
export class InMemoryItemRepository
  extends InMemoryTable<ItemId, ItemProps>
  implements ItemRepository
{
  #query(workspaceId: WorkspaceId, filter: ItemFilter = {}): ItemProps[] {
    return this.values()
      .filter((i) => i.workspaceId === workspaceId)
      .filter((i) => (filter.status ? filter.status.includes(i.status) : true))
      .filter((i) => (filter.sourceId ? i.sourceId === filter.sourceId : true))
      .filter((i) =>
        filter.dormantSince ? i.createdAt.getTime() <= filter.dormantSince.getTime() : true,
      )
      .filter((i) => matchesSearch(filter.search, i.title, i.brand, i.sku, i.notes))
      .sort(SORTS[filter.sort ?? "newest"]);
  }
  async byId(workspaceId: WorkspaceId, id: ItemId): Promise<Item | undefined> {
    const p = this.rows.get(id);
    return p && p.workspaceId === workspaceId ? Item.rehydrate(p) : undefined;
  }
  async bySku(workspaceId: WorkspaceId, sku: string): Promise<Item | undefined> {
    const p = this.values().find((i) => i.workspaceId === workspaceId && i.sku === sku);
    return p ? Item.rehydrate(p) : undefined;
  }
  async list(workspaceId: WorkspaceId, filter: ItemFilter = {}): Promise<readonly Item[]> {
    return paginate(this.#query(workspaceId, filter), filter.limit, filter.offset).map((p) =>
      Item.rehydrate(p),
    );
  }
  async bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Item[]> {
    return this.#query(workspaceId, { sourceId, sort: "oldest" }).map((p) => Item.rehydrate(p));
  }
  async count(workspaceId: WorkspaceId, filter: ItemFilter = {}): Promise<number> {
    return this.#query(workspaceId, filter).length;
  }
  async save(item: Item): Promise<void> {
    this.rows.set(item.id, item.toProps());
  }
  async saveMany(items: readonly Item[]): Promise<void> {
    for (const i of items) this.rows.set(i.id, i.toProps());
  }
  async delete(workspaceId: WorkspaceId, id: ItemId): Promise<void> {
    const p = this.rows.get(id);
    if (p && p.workspaceId === workspaceId) this.rows.delete(id);
  }
}
