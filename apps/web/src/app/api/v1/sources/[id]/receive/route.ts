import { ReceivePurchaseSource } from "@chine/application";
import { routes } from "@chine/contract";
import { asSourceId } from "@chine/domain";
import { loadSource, scopeOf } from "@/lib/api/loaders";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Réceptionner un lot : quantité réellement reçue (taux de casse recalculé). */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.receiveSource.body);
    const scope = scopeOf(ctx);
    const result = await new ReceivePurchaseSource(deps).execute({
      ...scope,
      sourceId: asSourceId(ctx.params.id),
      receivedQuantity: body.receivedQuantity,
    });
    return sendResult(result, {
      route: "POST /sources/:id/receive",
      schema: routes.receiveSource.response,
      map: (out) => loadSource(deps, scope, out.source.id),
    });
  },
  { limit: { key: "sources:receive", max: 60, windowSeconds: 60 } },
);
