import { AppraiseImage } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId } from "@chine/domain";
import { AppraiserError } from "@chine/infrastructure";
import { scopeOf } from "@/lib/api/loaders";
import { mapAppraisal } from "@/lib/api/mappers";
import { ApiFailure, fail } from "@/lib/api/respond";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Une photo en base64 : 8 Mo d'image ≈ 11 Mo de JSON. */
const MAX_APPRAISAL_BODY_BYTES = 12 * 1024 * 1024;

/**
 * Échec du fournisseur d'IA → réponse explicite : 503 + Retry-After quand réessayer a un sens
 * (délai, quota fournisseur), 502 APPRAISAL_FAILED sinon. Rien n'est enregistré ni décompté.
 */
function appraiserFailure(e: AppraiserError): Response {
  const transient = e.code === "TIMEOUT" || e.code === "RATE_LIMITED" || e.retryable;
  const details = { provider: e.provider, reason: e.code, retryable: transient };
  if (transient) {
    return fail(
      new ApiFailure(
        "SERVICE_UNAVAILABLE",
        "L'expert IA est surchargé, réessaie dans un instant.",
        details,
      ),
      { headers: { "Retry-After": "30" } },
    );
  }
  return fail(new ApiFailure("APPRAISAL_FAILED", "L'expertise a échoué.", details));
}

/** Expertiser une photo : identification, fourchette de prix, conseil d'achat (quota mensuel). */
export const POST = withAuth(
  async (req, ctx) => {
    const body = await parseBody(req, routes.appraiseImage.body, MAX_APPRAISAL_BODY_BYTES);
    let result: Awaited<ReturnType<AppraiseImage["execute"]>>;
    try {
      result = await new AppraiseImage(ctx.deps).execute({
        ...scopeOf(ctx),
        imageBase64: body.imageBase64,
        mimeType: body.mimeType,
        hints: body.hints,
        wantListingCopy: body.wantListingCopy,
        itemId: body.itemId ? asItemId(body.itemId) : undefined,
      });
    } catch (e) {
      if (e instanceof AppraiserError) {
        ctx.log.warn("expertise IA en échec", { provider: e.provider, reason: e.code });
        return appraiserFailure(e);
      }
      throw e;
    }
    return sendResult(result, {
      route: "POST /appraisals",
      schema: routes.appraiseImage.response,
      status: 201,
      map: (out) => mapAppraisal(out.appraisal, out.usage),
    });
  },
  { limit: { key: "appraisals:create", max: 20, windowSeconds: 60 } },
);
