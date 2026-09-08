import { CancelSale } from "@chine/application";
import { routes } from "@chine/contract";
import { asSaleId } from "@chine/domain";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { loadSale } from "@/lib/api/sales";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Annuler une vente avant expédition : rien n'a été encaissé, la pièce revient en stock. */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    await parseBody(req, routes.cancelSale.body);
    const scope = scopeOf(ctx);
    const result = await new CancelSale(deps).execute({
      ...scope,
      saleId: asSaleId(ctx.params.id),
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadSale(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("POST /sales/:id/cancel", routes.cancelSale.response, dto);
  },
  { limit: { key: "sales:lifecycle", max: 60, windowSeconds: 60 } },
);
