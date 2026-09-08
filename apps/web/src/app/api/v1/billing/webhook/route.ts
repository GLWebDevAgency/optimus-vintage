import { WebhookSignatureError } from "@chine/infrastructure";
import { fail, notFound, ok, validationFailed } from "@/lib/api/respond";
import { withPublic } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Stripe envoie des corps de quelques Ko ; au-delà, ce n'est pas un webhook Stripe. */
const MAX_WEBHOOK_BYTES = 1024 * 1024;

/**
 * Webhook Stripe : corps brut, signature `stripe-signature` vérifiée par la passerelle,
 * plan de l'espace synchronisé. 400 si la signature est invalide, 404 si Stripe n'est pas configuré.
 * On répond vite (Stripe réessaie sur 5xx) ; le traitement est court et idempotent.
 */
export const POST = withPublic(
  async (req, ctx) => {
    const { deps } = ctx;
    if (!deps.stripe) return fail(notFound("Route"));
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_WEBHOOK_BYTES) return fail(validationFailed("Corps trop volumineux."));
    const rawBody = await req.text();
    if (rawBody.length > MAX_WEBHOOK_BYTES) return fail(validationFailed("Corps trop volumineux."));
    try {
      const outcome = await deps.stripe.handleWebhook(rawBody, req.headers.get("stripe-signature"));
      ctx.log.info("webhook stripe", {
        type: outcome.type,
        handled: outcome.handled,
        workspaceId: outcome.workspaceId,
        plan: outcome.plan,
      });
      return ok({ received: true, type: outcome.type, handled: outcome.handled });
    } catch (e) {
      if (e instanceof WebhookSignatureError) {
        return fail(validationFailed("Signature Stripe invalide."));
      }
      if (e instanceof SyntaxError) return fail(validationFailed("Corps JSON illisible."));
      throw e;
    }
  },
  { name: "POST /billing/webhook", csrf: false },
);
