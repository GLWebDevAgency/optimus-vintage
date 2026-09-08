import {
  type DomainError,
  type ItemStatus,
  ok,
  type Result,
  SELLABLE,
  type SourceId,
} from "@chine/domain";
import type { ItemDto } from "../dto.js";
import { toItemDto } from "../mappers/index.js";
import type { AppDependencies, ItemFilter } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { addDays } from "../shared/dates.js";
import { omitUndefined } from "../shared/objects.js";
import type { Query } from "./query.js";

export interface ListItemsQuery extends WorkspaceScoped {
  readonly status?: readonly ItemStatus[];
  readonly sourceId?: SourceId;
  readonly search?: string;
  /** Uniquement le stock dormant (vendable et plus vieux que le seuil). */
  readonly dormantOnly?: boolean;
  readonly dormantThresholdDays?: number;
  readonly sort?: ItemFilter["sort"];
  readonly limit?: number;
  readonly offset?: number;
}
export interface ListItemsOutput {
  readonly items: readonly ItemDto[];
  readonly total: number;
}

export class ListItems implements Query<ListItemsQuery, ListItemsOutput> {
  constructor(
    private readonly deps: Pick<AppDependencies, "workspaces" | "items" | "clock" | "photos">,
  ) {}

  async execute(q: ListItemsQuery): Promise<Result<ListItemsOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const now = this.deps.clock.now();
    const threshold = q.dormantThresholdDays ?? 30;
    const status = q.dormantOnly
      ? (q.status ?? [...SELLABLE]).filter((s) => SELLABLE.has(s))
      : q.status;
    const filter: ItemFilter = omitUndefined({
      status,
      sourceId: q.sourceId,
      search: q.search,
      sort: q.sort,
      dormantSince: q.dormantOnly ? addDays(now, -threshold) : undefined,
    });
    const [items, total] = await Promise.all([
      this.deps.items.list(
        ws.value.id,
        omitUndefined({ ...filter, limit: q.limit, offset: q.offset }),
      ),
      this.deps.items.count(ws.value.id, filter),
    ]);
    const ctx = {
      now,
      publicUrl: (k: string) => this.deps.photos.publicUrl(k),
      dormantThresholdDays: threshold,
    };
    return ok({ items: items.map((i) => toItemDto(i, ctx)), total });
  }
}
