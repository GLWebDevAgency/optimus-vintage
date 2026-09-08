import { CreatePurchaseSource, ListSources } from "@chine/application";
import { routes } from "@chine/contract";
import { asWorkspaceId } from "@chine/domain";
import { loadSource, scopeOf } from "@/lib/api/loaders";
import { mapSource } from "@/lib/api/mappers";
import { fail } from "@/lib/api/respond";
import { parseBody, parseQuery, sendDto, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { itemCountsBySource } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Plafond de sources lues pour filtrer et paginer en mémoire (la performance est calculée par source). */
const SOURCES_SCAN_LIMIT = 500;

/** Sources d'achat avec leur performance ; filtre `amortized` appliqué après calcul. */
export const GET = withAuth(async (req, ctx) => {
  const { deps } = ctx;
  const query = parseQuery(req, routes.listSources.query);
  const result = await new ListSources(deps).execute({
    ...scopeOf(ctx),
    kind: query.kind,
    search: query.search,
    limit: SOURCES_SCAN_LIMIT,
    offset: 0,
  });
  if (!result.ok) return fail(result.error);
  const filtered =
    query.amortized === undefined
      ? result.value.sources
      : result.value.sources.filter((s) => s.performance.isAmortized === query.amortized);
  const page = filtered.slice(query.offset, query.offset + query.limit);
  const counts = await itemCountsBySource(
    deps.database.db,
    asWorkspaceId(ctx.workspaceId),
    page.map((s) => s.id),
  );
  return sendDto("GET /sources", routes.listSources.response, {
    items: page.map((s) => mapSource(s, s.performance, counts.get(s.id) ?? 0)),
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
  });
});

/** Créer une source (lot, palette, picking, unité). */
export const POST = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.createSource.body);
    const scope = scopeOf(ctx);
    const result = await new CreatePurchaseSource(deps).execute({
      ...scope,
      kind: body.kind,
      name: body.name,
      supplierName: body.supplierName,
      supplierKind: body.supplierKind,
      purchasedAt: body.purchasedAt,
      goodsCost: body.goodsCost,
      extraCosts: body.extraCosts,
      announcedQuantity: body.announcedQuantity,
      weightKg: body.weightKg,
      location: body.location,
      allocationPolicy: body.allocationPolicy,
      notes: body.notes,
    });
    return sendResult(result, {
      route: "POST /sources",
      schema: routes.createSource.response,
      status: 201,
      map: (out) => loadSource(deps, scope, out.source.id),
    });
  },
  { limit: { key: "sources:create", max: 60, windowSeconds: 60 } },
);
