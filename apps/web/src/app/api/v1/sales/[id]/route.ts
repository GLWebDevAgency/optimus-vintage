import { UpdateSale } from "@chine/application";
import { routes } from "@chine/contract";
import { asSaleId } from "@chine/domain";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { loadSale } from "@/lib/api/sales";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

type Params = { id: string };

/** `null` efface le champ (voir `sources/[id]`). */
const clearable = <T>(v: T | null | undefined): T | undefined => v as T | undefined;

/** Détail d'une vente. */
export const GET = withAuth<Params>(async (req, ctx) => {
  const dto = await loadSale(ctx.deps, scopeOf(ctx), ctx.params.id, mapContextFor(req));
  return sendDto("GET /sales/:id", routes.getSale.response, dto);
});

/** Corriger une vente (montants, date, acheteur, notes). */
export const PATCH = withAuth<Params>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.updateSale.body);
    const scope = scopeOf(ctx);
    const result = await new UpdateSale(deps).execute({
      ...scope,
      saleId: asSaleId(ctx.params.id),
      platform: body.platform,
      grossPrice: body.grossPrice,
      platformFees: body.platformFees,
      shippingCost: body.shippingCost,
      packagingCost: body.packagingCost,
      otherCosts: body.otherCosts,
      soldAt: body.soldAt,
      buyer: clearable(body.buyer),
      notes: clearable(body.notes),
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadSale(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("PATCH /sales/:id", routes.updateSale.response, dto);
  },
  { limit: { key: "sales:update", max: 120, windowSeconds: 60 } },
);
