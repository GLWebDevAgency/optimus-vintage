import { StartCheckout } from "@chine/application";
import { routes } from "@chine/contract";
import { BILLING_UNAVAILABLE_MESSAGE } from "@/lib/api/billing";
import { scopeOf } from "@/lib/api/loaders";
import { publicOrigin } from "@/lib/api/request";
import { fail, serviceUnavailable, validationFailed } from "@/lib/api/respond";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Démarrer un paiement Stripe vers un plan payant ; 503 si Stripe n'est pas configuré. */
export const POST = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.startCheckout.body);
    if (!deps.stripe) {
      return fail({ code: "BILLING_UNAVAILABLE", message: BILLING_UNAVAILABLE_MESSAGE });
    }
    if (new URL(body.returnUrl).origin !== publicOrigin(req)) {
      return fail(
        validationFailed("L'URL de retour doit être sur ce site.", { field: "returnUrl" }),
      );
    }
    const result = await new StartCheckout(deps).execute({
      ...scopeOf(ctx),
      plan: body.plan,
      interval: body.interval,
      returnUrl: body.returnUrl,
    });
    if (!result.ok && result.error.code === "BILLING_UNAVAILABLE") {
      return fail(serviceUnavailable("Ce plan n'est pas disponible à la vente pour le moment."));
    }
    return sendResult(result, {
      route: "POST /billing/checkout",
      schema: routes.startCheckout.response,
      status: 201,
      map: (out) => ({ url: out.url }),
    });
  },
  { limit: { key: "billing:checkout", max: 10, windowSeconds: 60 } },
);
