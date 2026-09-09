import {
  PurchaseSource,
  type PurchaseSourceProps,
  type SourceId,
  type WorkspaceId,
} from "@chine/domain";
import type { PurchaseSourceRepository, SourceFilter } from "../ports/index.js";
import { InMemoryTable, matchesSearch, paginate } from "./table.js";

/** Tri : date d'achat décroissante, puis création décroissante. */
export class InMemorySourceRepository
  extends InMemoryTable<SourceId, PurchaseSourceProps>
  implements PurchaseSourceRepository
{
  #ofWorkspace(workspaceId: WorkspaceId): PurchaseSourceProps[] {
    return this.values()
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) =>
        a.purchasedAt === b.purchasedAt
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.purchasedAt < b.purchasedAt
            ? 1
            : -1,
      );
  }
  async byId(workspaceId: WorkspaceId, id: SourceId): Promise<PurchaseSource | undefined> {
    const p = this.rows.get(id);
    return p && p.workspaceId === workspaceId ? PurchaseSource.rehydrate(p) : undefined;
  }
  async list(
    workspaceId: WorkspaceId,
    filter: SourceFilter = {},
  ): Promise<readonly PurchaseSource[]> {
    const rows = this.#ofWorkspace(workspaceId)
      .filter((s) => (filter.kind ? s.kind === filter.kind : true))
      .filter((s) => matchesSearch(filter.search, s.name, s.supplierName, s.notes));
    return paginate(rows, filter.limit, filter.offset).map((p) => PurchaseSource.rehydrate(p));
  }
  async countCreatedSince(workspaceId: WorkspaceId, since: Date): Promise<number> {
    return this.#ofWorkspace(workspaceId).filter(
      (s) => s.kind !== "UNIT" && s.createdAt.getTime() >= since.getTime(),
    ).length;
  }
  async save(source: PurchaseSource): Promise<void> {
    this.rows.set(source.id, source.toProps());
  }
  async delete(workspaceId: WorkspaceId, id: SourceId): Promise<void> {
    const p = this.rows.get(id);
    if (p && p.workspaceId === workspaceId) this.rows.delete(id);
  }
}
