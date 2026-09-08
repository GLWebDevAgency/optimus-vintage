/** Clés de photos : `<workspaceId>/<uuid>.<ext>` — opaques, sûres, sans chemin relatif. */
import type { WorkspaceId } from "@chine/domain";
import { UuidV7Generator } from "../ids.js";

const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
};

const MIME_BY_EXT: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
};

export class UnsupportedMimeType extends Error {
  override readonly name = "UnsupportedMimeType";
  constructor(readonly mimeType: string) {
    super(`Type d'image non pris en charge : ${mimeType}`);
  }
}

export const extensionFor = (mimeType: string): string | undefined =>
  EXTENSIONS[mimeType.toLowerCase().split(";")[0]?.trim() ?? ""];

export const mimeTypeFor = (key: string): string =>
  MIME_BY_EXT[key.slice(key.lastIndexOf(".") + 1).toLowerCase()] ?? "application/octet-stream";

const ids = new UuidV7Generator();

export function newPhotoKey(workspaceId: WorkspaceId, mimeType: string): string {
  const ext = extensionFor(mimeType);
  if (!ext) throw new UnsupportedMimeType(mimeType);
  return `${workspaceId}/${ids.next()}.${ext}`;
}

const SAFE_KEY = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/;

/** Une clé valide ne contient ni `..`, ni chemin absolu, ni caractère exotique. */
export const isSafeKey = (key: string): boolean =>
  SAFE_KEY.test(key) && !key.split("/").some((seg) => seg === "." || seg === "..");

export class InvalidPhotoKey extends Error {
  override readonly name = "InvalidPhotoKey";
  constructor(readonly key: string) {
    super(`Clé de photo invalide : ${key}`);
  }
}

export function assertSafeKey(key: string): void {
  if (!isSafeKey(key)) throw new InvalidPhotoKey(key);
}
