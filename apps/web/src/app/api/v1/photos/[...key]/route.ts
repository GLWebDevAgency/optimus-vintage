import { isSafeKey, LocalPhotoStorage } from "@chine/infrastructure";
import { contentTypeFor } from "@/lib/api/photos";
import { fail, notFound } from "@/lib/api/respond";
import { withPublic } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/**
 * Lecture d'une photo en stockage local. Les clés sont opaques (UUID v7 par espace) et les
 * fichiers immuables : cache public d'un an. 404 pour toute autre configuration de stockage.
 */
export const GET = withPublic<{ key: string[] }>(
  async (_req, ctx) => {
    const { deps } = ctx;
    if (!(deps.photos instanceof LocalPhotoStorage)) return fail(notFound("Photo"));
    const key = ctx.params.key.join("/");
    if (!isSafeKey(key)) return fail(notFound("Photo"));
    const file = await deps.photos.read(key);
    if (!file) return fail(notFound("Photo"));
    const body = new Uint8Array(file.bytes).buffer as ArrayBuffer;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(key),
        "Content-Length": String(file.bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  },
  { limit: { key: "photos:read", max: 600, windowSeconds: 60 } },
);
