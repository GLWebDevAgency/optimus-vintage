import { RemoveItemPhoto } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId, asPhotoId } from "@chine/domain";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Retirer une photo d'une pièce et la supprimer du stockage. */
export const DELETE = withAuth<{ id: string; photoId: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const scope = scopeOf(ctx);
    const result = await new RemoveItemPhoto(deps).execute({
      ...scope,
      itemId: asItemId(ctx.params.id),
      photoId: asPhotoId(ctx.params.photoId),
      deleteFromStorage: true,
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadItem(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("DELETE /items/:id/photos/:photoId", routes.removeItemPhoto.response, dto);
  },
  { limit: { key: "items:photos", max: 240, windowSeconds: 60 } },
);
