import { DeletePurchaseSource, UpdatePurchaseSource } from "@chine/application";
import { routes } from "@chine/contract";
import { asSourceId } from "@chine/domain";
import { loadSource, scopeOf } from "@/lib/api/loaders";
import { parseBody, sendDto, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

type Params = { id: string };

/**
 * `null` dans le corps efface le champ : la valeur traverse le cas d'usage telle quelle et
 * l'agrégat l'interprète comme une absence (persistée `NULL`, relue `undefined`).
 */
const clearable = <T>(v: T | null | undefined): T | undefined => v as T | undefined;

/** Détail d'une source : performance, pièces, ventes. */
export const GET = withAuth<Params>(async (_req, ctx) => {
  const dto = await loadSource(ctx.deps, scopeOf(ctx), ctx.params.id);
  return sendDto("GET /sources/:id", routes.getSource.response, dto);
});

/** Modifier une source. */
export const PATCH = withAuth<Params>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.updateSource.body);
    const scope = scopeOf(ctx);
    const result = await new UpdatePurchaseSource(deps).execute({
      ...scope,
      sourceId: asSourceId(ctx.params.id),
      name: body.name,
      supplierName: clearable(body.supplierName),
      supplierKind: body.supplierKind,
      purchasedAt: body.purchasedAt,
      goodsCost: body.goodsCost,
      extraCosts: body.extraCosts,
      announcedQuantity: clearable(body.announcedQuantity),
      weightKg: clearable(body.weightKg),
      location: clearable(body.location),
      notes: clearable(body.notes),
      allocationPolicy: body.allocationPolicy,
    });
    return sendResult(result, {
      route: "PATCH /sources/:id",
      schema: routes.updateSource.response,
      map: (out) => loadSource(deps, scope, out.source.id),
    });
  },
  { limit: { key: "sources:update", max: 120, windowSeconds: 60 } },
);

/** Supprimer une source vide (409 si elle porte encore des pièces). */
export const DELETE = withAuth<Params>(
  async (_req, ctx) => {
    const result = await new DeletePurchaseSource(ctx.deps).execute({
      ...scopeOf(ctx),
      sourceId: asSourceId(ctx.params.id),
    });
    return sendResult(result, {
      route: "DELETE /sources/:id",
      schema: routes.deleteSource.response,
      map: (out) => ({ id: out.sourceId, deleted: true as const }),
    });
  },
  { limit: { key: "sources:delete", max: 60, windowSeconds: 60 } },
);
