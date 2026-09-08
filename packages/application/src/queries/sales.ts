import { type DomainError, err, type Item, ok, type Result, type SaleId } from "@chine/domain";
import type { ItemDto, SaleDto, SaleListEntryDto, SourceDto } from "../dto.js";
import { NotFound } from "../errors.js";
import { toItemDto, toSaleDto, toSaleListEntryDto, toSourceDto } from "../mappers/index.js";
import type { AppDependencies, SaleFilter } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { omitUndefined } from "../shared/objects.js";
import type { Query } from "./query.js";

type Deps = Pick<
  AppDependencies,
  "workspaces" | "sales" | "items" | "sources" | "clock" | "photos"
>;

export interface ListSalesQuery extends WorkspaceScoped, SaleFilter {}
export interface ListSalesOutput {
  readonly sales: readonly SaleListEntryDto[];
}

/** Ventes avec leur économie (net, marge, ROI) et la pièce vendue. */
export class ListSales implements Query<ListSalesQuery, ListSalesOutput> {
  constructor(private readonly deps: Deps) {}

  async execute(q: ListSalesQuery): Promise<Result<ListSalesOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const filter: SaleFilter = omitUndefined({
      from: q.from,
      to: q.to,
      sourceId: q.sourceId,
      itemId: q.itemId,
      platform: q.platform,
      limit: q.limit,
      offset: q.offset,
    });
    const sales = await this.deps.sales.list(ws.value.id, filter);
    const items = new Map<string, Item>();
    for (const s of sales) {
      if (items.has(s.itemId)) continue;
      const item = await this.deps.items.byId(ws.value.id, s.itemId);
      if (item) items.set(s.itemId, item);
    }
    const publicUrl = (k: string) => this.deps.photos.publicUrl(k);
    return ok({ sales: sales.map((s) => toSaleListEntryDto(s, items.get(s.itemId), publicUrl)) });
  }
}

export interface GetSaleQuery extends WorkspaceScoped {
  readonly saleId: SaleId;
}
export interface GetSaleOutput {
  readonly sale: SaleDto;
  readonly item: ItemDto | null;
  readonly source: SourceDto | null;
}

export class GetSale implements Query<GetSaleQuery, GetSaleOutput> {
  constructor(private readonly deps: Deps) {}

  async execute(q: GetSaleQuery): Promise<Result<GetSaleOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const sale = await this.deps.sales.byId(ws.value.id, q.saleId);
    if (!sale) return err(new NotFound("Sale", q.saleId));
    const [item, source] = await Promise.all([
      this.deps.items.byId(ws.value.id, sale.itemId),
      this.deps.sources.byId(ws.value.id, sale.sourceId),
    ]);
    return ok({
      sale: toSaleDto(sale),
      item: item
        ? toItemDto(item, {
            now: this.deps.clock.now(),
            publicUrl: (k) => this.deps.photos.publicUrl(k),
          })
        : null,
      source: source ? toSourceDto(source) : null,
    });
  }
}
