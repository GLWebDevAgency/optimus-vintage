import { ReorderItemPhotos } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId, asPhotoId } from "@chine/domain";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Réordonner les photos d'une pièce (la première devient la couverture). */
export const PUT = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.reorderItemPhotos.body);
    const scope = scopeOf(ctx);
    const result = await new ReorderItemPhotos(deps).execute({
      ...scope,
      itemId: asItemId(ctx.params.id),
      photoIds: body.photoIds.map(asPhotoId),
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadItem(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("PUT /items/:id/photos/order", routes.reorderItemPhotos.response, dto);
  },
  { limit: { key: "items:photos", max: 240, windowSeconds: 60 } },
);
