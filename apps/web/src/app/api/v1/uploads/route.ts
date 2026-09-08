import { PrepareUpload } from "@chine/application";
import { routes } from "@chine/contract";
import { LocalPhotoStorage, R2PhotoStorage } from "@chine/infrastructure";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { mapUploadTarget } from "@/lib/api/mappers";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Durée de validité d'une URL pré-signée R2 (alignée sur `R2PhotoStorage`). */
const R2_UPLOAD_TTL_SECONDS = 600;

/**
 * Obtenir une cible d'upload direct pour une photo.
 * - R2 : URL pré-signée (PUT vers R2, `Content-Type` imposé), valable 10 min.
 * - Local : URL `/api/v1/photos/upload/<clé>` servie par cette app, qui normalise l'image
 *   (orientation, EXIF retiré, 2048 px max, WebP) — la clé porte donc l'extension `.webp`
 *   quel que soit le format envoyé.
 */
export const POST = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.prepareUpload.body);
    const local = deps.photos instanceof LocalPhotoStorage;
    const result = await new PrepareUpload(deps).execute({
      ...scopeOf(ctx),
      mimeType: local ? "image/webp" : body.mimeType,
    });
    const expiresAt =
      deps.photos instanceof R2PhotoStorage
        ? new Date(deps.clock.now().getTime() + R2_UPLOAD_TTL_SECONDS * 1000).toISOString()
        : undefined;
    const mapCtx = mapContextFor(req);
    return sendResult(result, {
      route: "POST /uploads",
      schema: routes.prepareUpload.response,
      status: 201,
      map: (target) =>
        mapUploadTarget(
          local ? { ...target, headers: { "Content-Type": body.mimeType } } : target,
          mapCtx,
          expiresAt,
        ),
    });
  },
  { limit: { key: "uploads:prepare", max: 120, windowSeconds: 60 } },
);
