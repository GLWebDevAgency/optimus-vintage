import {
  type Appraisal,
  type AppraisalId,
  type ItemId,
  Listing,
  type ListingId,
  type ListingProps,
  Sale,
  type SaleId,
  type SaleProps,
  type SourceId,
  type WorkspaceId,
} from "@chine/domain";
import type {
  AppraisalRepository,
  ListingRepository,
  SaleFilter,
  SaleRepository,
} from "../ports/index.js";
import { InMemoryTable, paginate } from "./table.js";

export class InMemoryListingRepository
  extends InMemoryTable<ListingId, ListingProps>
  implements ListingRepository
{
  async byId(workspaceId: WorkspaceId, id: ListingId): Promise<Listing | undefined> {
    const p = this.rows.get(id);
    return p && p.workspaceId === workspaceId ? Listing.rehydrate(p) : undefined;
  }
  async byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Listing[]> {
    return this.values()
      .filter((l) => l.workspaceId === workspaceId && l.itemId === itemId)
      .map((p) => Listing.rehydrate(p));
  }
  async save(listing: Listing): Promise<void> {
    this.rows.set(listing.id, listing.toProps());
  }
}

/** Tri : date de vente décroissante, puis création décroissante. */
export class InMemorySaleRepository
  extends InMemoryTable<SaleId, SaleProps>
  implements SaleRepository
{
  #ofWorkspace(workspaceId: WorkspaceId): SaleProps[] {
    return this.values()
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) =>
        a.soldAt === b.soldAt
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.soldAt < b.soldAt
            ? 1
            : -1,
      );
  }
  async byId(workspaceId: WorkspaceId, id: SaleId): Promise<Sale | undefined> {
    const p = this.rows.get(id);
    return p && p.workspaceId === workspaceId ? Sale.rehydrate(p) : undefined;
  }
  async byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Sale[]> {
    return this.#ofWorkspace(workspaceId)
      .filter((s) => s.itemId === itemId)
      .map((p) => Sale.rehydrate(p));
  }
  async bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Sale[]> {
    return this.#ofWorkspace(workspaceId)
      .filter((s) => s.sourceId === sourceId)
      .map((p) => Sale.rehydrate(p));
  }
  async list(workspaceId: WorkspaceId, filter: SaleFilter = {}): Promise<readonly Sale[]> {
    const rows = this.#ofWorkspace(workspaceId)
      .filter((s) => (filter.from ? s.soldAt >= filter.from : true))
      .filter((s) => (filter.to ? s.soldAt <= filter.to : true))
      .filter((s) => (filter.sourceId ? s.sourceId === filter.sourceId : true))
      .filter((s) => (filter.itemId ? s.itemId === filter.itemId : true))
      .filter((s) => (filter.platform ? s.platform === filter.platform : true));
    return paginate(rows, filter.limit, filter.offset).map((p) => Sale.rehydrate(p));
  }
  async save(sale: Sale): Promise<void> {
    this.rows.set(sale.id, sale.toProps());
  }
}

export class InMemoryAppraisalRepository
  extends InMemoryTable<AppraisalId, Appraisal>
  implements AppraisalRepository
{
  async byId(workspaceId: WorkspaceId, id: AppraisalId): Promise<Appraisal | undefined> {
    const a = this.rows.get(id);
    return a && a.workspaceId === workspaceId ? a : undefined;
  }
  async save(appraisal: Appraisal): Promise<void> {
    this.rows.set(appraisal.id, appraisal);
  }
  async creditsSince(workspaceId: WorkspaceId, since: Date): Promise<number> {
    return this.values()
      .filter((a) => a.workspaceId === workspaceId && a.createdAt.getTime() >= since.getTime())
      .reduce((sum, a) => sum + a.credits, 0);
  }
  async latestForItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<Appraisal | undefined> {
    return this.values()
      .filter((a) => a.workspaceId === workspaceId && a.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
}
