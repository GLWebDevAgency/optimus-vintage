import { OpenBillingPortal } from "@chine/application";
import { routes } from "@chine/contract";
import { BILLING_UNAVAILABLE_MESSAGE } from "@/lib/api/billing";
import { scopeOf } from "@/lib/api/loaders";
import { publicOrigin } from "@/lib/api/request";
import { fail, validationFailed } from "@/lib/api/respond";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Ouvrir le portail de facturation Stripe (503 si Stripe n'est pas configuré, 503 sans abonnement). */
export const POST = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.openBillingPortal.body);
    if (!deps.stripe) {
      return fail({ code: "BILLING_UNAVAILABLE", message: BILLING_UNAVAILABLE_MESSAGE });
    }
    if (new URL(body.returnUrl).origin !== publicOrigin(req)) {
      return fail(validationFailed("L'URL de retour doit être sur ce site.", { field: "returnUrl" }));
    }
    const result = await new OpenBillingPortal(deps).execute({
      ...scopeOf(ctx),
      returnUrl: body.returnUrl,
    });
    return sendResult(result, {
      route: "POST /billing/portal",
      schema: routes.openBillingPortal.response,
      status: 201,
      map: (out) => ({ url: out.url }),
    });
  },
  { limit: { key: "billing:portal", max: 10, windowSeconds: 60 } },
);
