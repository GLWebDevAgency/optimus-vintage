import { isSafeKey } from "@chine/infrastructure";
import { validationFailed } from "./respond";

/**
 * Une clé de photo appartient à l'espace qui l'a téléversée : `<workspaceId>/<uuid>.<ext>`.
 * Toute référence à une clé d'un autre espace (ou mal formée) est refusée en 400.
 */
export function assertOwnedPhotoKeys(workspaceId: string, keys: readonly string[]): void {
  for (const key of keys) {
    if (!isSafeKey(key) || !key.startsWith(`${workspaceId}/`)) {
      throw validationFailed("Clé de photo inconnue pour cet espace.", { key });
    }
  }
}

/** Taille maximale d'une photo acceptée par l'upload local, avant traitement (15 Mo). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Signatures binaires des formats acceptés (le `Content-Type` déclaré ne fait pas foi). */
export type DetectedImage = { mimeType: "image/jpeg" | "image/png" | "image/webp" };

export function detectImage(bytes: Uint8Array): DetectedImage | undefined {
  if (bytes.length < 12) return undefined;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: "image/jpeg" };
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return { mimeType: "image/png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mimeType: "image/webp" };
  return undefined;
}

/** Type MIME servi pour une clé, d'après son extension (les fichiers stockés sont normalisés). */
export function contentTypeFor(key: string): string {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}
