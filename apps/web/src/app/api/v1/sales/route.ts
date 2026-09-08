import { ListSales, RecordSale } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId, asSourceId, asWorkspaceId } from "@chine/domain";
import { isoDate, isoDateOpt } from "@/lib/api/dates";
import { attachItemSummaries, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, parseQuery, sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { countSales } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Ventes sur une période, avec l'économie de chacune et le résumé de la pièce. */
export const GET = withAuth(async (req, ctx) => {
  const { deps } = ctx;
  const query = parseQuery(req, routes.listSales.query);
  const workspaceId = asWorkspaceId(ctx.workspaceId);
  const result = await new ListSales(deps).execute({
    ...scopeOf(ctx),
    from: isoDateOpt(query.from, "from"),
    to: isoDateOpt(query.to, "to"),
    platform: query.platform,
    sourceId: query.sourceId ? asSourceId(query.sourceId) : undefined,
    itemId: query.itemId ? asItemId(query.itemId) : undefined,
    limit: query.limit,
    offset: query.offset,
  });
  if (!result.ok) return fail(result.error);
  const [items, total] = await Promise.all([
    attachItemSummaries(deps, workspaceId, result.value.sales, mapContextFor(req)),
    countSales(deps.database.db, workspaceId, {
      from: query.from,
      to: query.to,
      platform: query.platform,
      sourceId: query.sourceId,
      itemId: query.itemId,
    }),
  ]);
  return sendDto("GET /sales", routes.listSales.response, {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
  });
});

/** Enregistrer une vente : frais plateforme depuis la grille, pièce vendue, annonces clôturées. */
export const POST = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.recordSale.body);
    const workspaceId = asWorkspaceId(ctx.workspaceId);
    const result = await new RecordSale(deps).execute({
      ...scopeOf(ctx),
      itemId: asItemId(body.itemId),
      platform: body.platform,
      grossPrice: body.grossPrice,
      soldAt: isoDate(body.soldAt, "soldAt"),
      shippingCost: body.shippingCost,
      packagingCost: body.packagingCost,
      otherCosts: body.otherCosts,
      platformFeesOverride: body.platformFeesOverride,
      status: body.status,
      buyer: body.buyer,
      notes: body.notes,
    });
    if (!result.ok) return fail(result.error);
    const [dto] = await attachItemSummaries(
      deps,
      workspaceId,
      [{ ...result.value.sale, item: null }],
      mapContextFor(req),
    );
    if (!dto) throw new Error("Vente enregistrée mais absente de la réponse");
    return sendDto("POST /sales", routes.recordSale.response, dto, { status: 201 });
  },
  { limit: { key: "sales:record", max: 120, windowSeconds: 60 } },
);
