import { ChangeItemStatus, RefundSale } from "@chine/application";
import { routes } from "@chine/contract";
import { asSaleId } from "@chine/domain";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { loadSale } from "@/lib/api/sales";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Rembourser une vente après retour : la pièce passe RETOURNÉE, ou revient en stock si `restock`. */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.refundSale.body);
    const scope = scopeOf(ctx);
    const result = await new RefundSale(deps).execute({
      ...scope,
      saleId: asSaleId(ctx.params.id),
    });
    if (!result.ok) return fail(result.error);
    if (body.restock) {
      const restocked = await new ChangeItemStatus(deps).execute({
        ...scope,
        itemId: result.value.item.id,
        action: "RESTOCK",
      });
      if (!restocked.ok) return fail(restocked.error);
    }
    const dto = await loadSale(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("POST /sales/:id/refund", routes.refundSale.response, dto);
  },
  { limit: { key: "sales:lifecycle", max: 60, windowSeconds: 60 } },
);
