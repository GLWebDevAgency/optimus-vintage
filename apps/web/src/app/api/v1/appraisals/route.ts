import { AppraiseImage } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId } from "@chine/domain";
import { scopeOf } from "@/lib/api/loaders";
import { mapAppraisal } from "@/lib/api/mappers";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Expertiser une photo : identification, fourchette de prix, conseil d'achat (quota mensuel). */
export const POST = withAuth(
  async (req, ctx) => {
    const body = await parseBody(req, routes.appraiseImage.body);
    const result = await new AppraiseImage(ctx.deps).execute({
      ...scopeOf(ctx),
      imageBase64: body.imageBase64,
      mimeType: body.mimeType,
      hints: body.hints,
      wantListingCopy: body.wantListingCopy,
      itemId: body.itemId ? asItemId(body.itemId) : undefined,
    });
    return sendResult(result, {
      route: "POST /appraisals",
      schema: routes.appraiseImage.response,
      status: 201,
      map: (out) => mapAppraisal(out.appraisal, out.usage),
    });
  },
  { limit: { key: "appraisals:create", max: 20, windowSeconds: 60 } },
);
