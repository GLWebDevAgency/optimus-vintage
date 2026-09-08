/** Paramètres de requête (query string). Tolérants aux formes `?k=a,b` et `?k=a&k=b`. */
import { z } from "zod";
import { IdDto, IsoDateDto, PaginationQuery, QueryBooleanDto, queryList } from "./common.js";
import {
  DashboardPeriodDto,
  ItemSortDto,
  ItemStatusDto,
  PlatformDto,
  SourceKindDto,
} from "./enums.js";

const Search = z.string().trim().max(80);

export const ListItemsQuery = PaginationQuery.extend({
  status: queryList(ItemStatusDto).optional(),
  sourceId: IdDto.optional(),
  search: Search.optional(),
  sort: ItemSortDto.default("newest"),
  dormantOnly: QueryBooleanDto.default(false),
});
export type ListItemsQuery = z.input<typeof ListItemsQuery>;

export const ListSalesQuery = PaginationQuery.extend({
  from: IsoDateDto.optional(),
  to: IsoDateDto.optional(),
  platform: PlatformDto.optional(),
  sourceId: IdDto.optional(),
  itemId: IdDto.optional(),
}).refine((q) => !q.from || !q.to || q.from <= q.to, {
  path: ["to"],
  message: "La date de fin précède la date de début",
});
export type ListSalesQuery = z.input<typeof ListSalesQuery>;

export const ListSourcesQuery = PaginationQuery.extend({
  kind: SourceKindDto.optional(),
  search: Search.optional(),
  amortized: QueryBooleanDto.optional(),
});
export type ListSourcesQuery = z.input<typeof ListSourcesQuery>;

export const DashboardQuery = z.object({
  period: DashboardPeriodDto.default("month"),
});
export type DashboardQuery = z.input<typeof DashboardQuery>;

/**
 * Convertit des `URLSearchParams` en objet brut pour un schéma de requête :
 * clés répétées → tableau, clé unique → chaîne.
 */
export function searchParamsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

/** Sérialise un objet de requête en `URLSearchParams` (tableaux → clés répétées, undefined ignoré). */
export function toSearchParams(query: Record<string, unknown> | undefined): URLSearchParams {
  const params = new URLSearchParams();
  if (!query) return params;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v !== undefined && v !== null) params.append(key, String(v));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}
