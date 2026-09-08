import {
  computeSourcePerformance,
  type DomainError,
  err,
  ok,
  type Result,
  type SourceId,
} from "@chine/domain";
import type { ItemDto, SaleDto, SourceDto, SourcePerformanceDto } from "../dto.js";
import { NotFound } from "../errors.js";
import { toItemDto, toPerformanceDto, toSaleDto, toSourceDto } from "../mappers/index.js";
import type { AppDependencies, SourceFilter } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { omitUndefined } from "../shared/objects.js";
import type { Query } from "./query.js";

type Deps = Pick<
  AppDependencies,
  "workspaces" | "sources" | "items" | "sales" | "clock" | "photos"
>;

export interface SourceWithPerformanceDto extends SourceDto {
  readonly performance: SourcePerformanceDto;
}

export interface ListSourcesQuery extends WorkspaceScoped, SourceFilter {}
export interface ListSourcesOutput {
  readonly sources: readonly SourceWithPerformanceDto[];
}

/** Sources avec leur performance (investi / récupéré / amorti…). */
export class ListSources implements Query<ListSourcesQuery, ListSourcesOutput> {
  constructor(private readonly deps: Deps) {}

  async execute(q: ListSourcesQuery): Promise<Result<ListSourcesOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const id = ws.value.id;
    const [sources, items, sales] = await Promise.all([
      this.deps.sources.list(
        id,
        omitUndefined({ kind: q.kind, search: q.search, limit: q.limit, offset: q.offset }),
      ),
      this.deps.items.list(id),
      this.deps.sales.list(id),
    ]);
    return ok({
      sources: sources.map((s) => ({
        ...toSourceDto(s),
        performance: toPerformanceDto(
          computeSourcePerformance(s, items, sales, ws.value.targetMargin),
        ),
      })),
    });
  }
}

export interface GetSourceQuery extends WorkspaceScoped {
  readonly sourceId: SourceId;
}
export interface GetSourceOutput {
  readonly source: SourceDto;
  readonly performance: SourcePerformanceDto;
  readonly items: readonly ItemDto[];
  readonly sales: readonly SaleDto[];
}

export class GetSource implements Query<GetSourceQuery, GetSourceOutput> {
  constructor(private readonly deps: Deps) {}

  async execute(q: GetSourceQuery): Promise<Result<GetSourceOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const id = ws.value.id;
    const source = await this.deps.sources.byId(id, q.sourceId);
    if (!source) return err(new NotFound("PurchaseSource", q.sourceId));
    const [items, sales] = await Promise.all([
      this.deps.items.bySource(id, source.id),
      this.deps.sales.bySource(id, source.id),
    ]);
    const ctx = {
      now: this.deps.clock.now(),
      publicUrl: (k: string) => this.deps.photos.publicUrl(k),
    };
    return ok({
      source: toSourceDto(source),
      performance: toPerformanceDto(
        computeSourcePerformance(source, items, sales, ws.value.targetMargin),
      ),
      items: items.map((i) => toItemDto(i, ctx)),
      sales: sales.map(toSaleDto),
    });
  }
}
