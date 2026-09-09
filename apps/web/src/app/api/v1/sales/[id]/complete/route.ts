import { CompletePendingSale } from "@chine/application";
import { routes } from "@chine/contract";
import { asSaleId } from "@chine/domain";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { loadSale } from "@/lib/api/sales";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Encaisser une vente en attente : la pièce passe vendue, les annonces sont clôturées. */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    await parseBody(req, routes.completeSale.body);
    const scope = scopeOf(ctx);
    const result = await new CompletePendingSale(deps).execute({
      ...scope,
      saleId: asSaleId(ctx.params.id),
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadSale(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("POST /sales/:id/complete", routes.completeSale.response, dto);
  },
  { limit: { key: "sales:lifecycle", max: 60, windowSeconds: 60 } },
);
