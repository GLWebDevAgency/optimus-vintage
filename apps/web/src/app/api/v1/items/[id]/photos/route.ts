import { AddItemPhoto } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId } from "@chine/domain";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { assertOwnedPhotoKeys } from "@/lib/api/photos";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Rattacher une photo téléversée (clé de stockage) à une pièce. */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.addItemPhoto.body);
    assertOwnedPhotoKeys(ctx.workspaceId, [body.key]);
    const scope = scopeOf(ctx);
    const result = await new AddItemPhoto(deps).execute({
      ...scope,
      itemId: asItemId(ctx.params.id),
      key: body.key,
      width: body.width,
      height: body.height,
      blurhash: body.blurhash,
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadItem(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("POST /items/:id/photos", routes.addItemPhoto.response, dto, { status: 201 });
  },
  { limit: { key: "items:photos", max: 240, windowSeconds: 60 } },
);
