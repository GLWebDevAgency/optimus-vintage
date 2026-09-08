import { isSafeKey, LocalPhotoStorage } from "@chine/infrastructure";
import sharp from "sharp";
import { detectImage, MAX_UPLOAD_BYTES } from "@/lib/api/photos";
import { absoluteUrl, publicOrigin } from "@/lib/api/request";
import {
  fail,
  notFound,
  ok,
  payloadTooLarge,
  unsupportedMediaType,
  validationFailed,
} from "@/lib/api/respond";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Plus grand côté après redimensionnement. */
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 82;

/**
 * Réception d'une photo en stockage local (driver `local` uniquement ; 404 sinon, car R2 reçoit
 * les fichiers directement). La clé doit appartenir à l'espace courant. Le fichier est vérifié
 * par sa signature binaire, puis normalisé : orientation appliquée, métadonnées (EXIF, GPS)
 * retirées, 2048 px max, WebP qualité 82.
 */
export const PUT = withAuth<{ key: string[] }>(
  async (req, ctx) => {
    const { deps } = ctx;
    if (!(deps.photos instanceof LocalPhotoStorage)) return fail(notFound("Route"));
    const key = ctx.params.key.join("/");
    if (!isSafeKey(key) || !key.startsWith(`${ctx.workspaceId}/`) || !key.endsWith(".webp")) {
      return fail(validationFailed("Clé d'upload invalide.", { key }));
    }

    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES) return fail(payloadTooLarge(MAX_UPLOAD_BYTES));
    const input = new Uint8Array(await req.arrayBuffer());
    if (input.byteLength === 0) return fail(validationFailed("Fichier vide."));
    if (input.byteLength > MAX_UPLOAD_BYTES) return fail(payloadTooLarge(MAX_UPLOAD_BYTES));
    if (!detectImage(input)) {
      return fail(unsupportedMediaType("Image attendue : JPEG, PNG ou WebP."));
    }

    let output: { data: Buffer; info: { width: number; height: number } };
    try {
      output = await sharp(input, { failOn: "error", limitInputPixels: 80_000_000 })
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });
    } catch {
      return fail(unsupportedMediaType("Image illisible ou corrompue."));
    }

    await deps.photos.put(key, new Uint8Array(output.data), "image/webp");
    ctx.log.info("photo stockée", {
      bytesIn: input.byteLength,
      bytesOut: output.data.byteLength,
      width: output.info.width,
      height: output.info.height,
    });
    return ok({
      key,
      url: absoluteUrl(deps.photos.publicUrl(key), publicOrigin(req)),
      width: output.info.width,
      height: output.info.height,
      bytes: output.data.byteLength,
    });
  },
  { limit: { key: "photos:upload", max: 60, windowSeconds: 60 } },
);
