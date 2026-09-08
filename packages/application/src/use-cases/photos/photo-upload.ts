import { type DomainError, err, ok, type Result } from "@chine/domain";
import { ValidationFailed } from "../../errors.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import type { UseCase } from "../use-case.js";

export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoMimeType = (typeof PHOTO_MIME_TYPES)[number];
const EXTENSIONS: Record<PhotoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
/** Taille maximale d'une photo téléversée côté serveur (10 Mo). */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const isPhotoMime = (m: string): m is PhotoMimeType =>
  (PHOTO_MIME_TYPES as readonly string[]).includes(m);

export interface PrepareUploadCommand extends WorkspaceScoped {
  readonly mimeType: string;
}
export interface PrepareUploadOutput {
  readonly key: string;
  readonly uploadUrl: string;
  readonly method: "PUT" | "POST";
  readonly headers: Record<string, string>;
  readonly publicUrl: string;
}

/** Prépare un upload direct (URL signée) depuis le navigateur ou le mobile. */
export class PrepareUpload implements UseCase<PrepareUploadCommand, PrepareUploadOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "workspaces" | "photos">) {}
  async execute(cmd: PrepareUploadCommand): Promise<Result<PrepareUploadOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, cmd);
    if (!ws.ok) return ws;
    if (!isPhotoMime(cmd.mimeType))
      return err(
        new ValidationFailed("Format d'image non pris en charge", { mimeType: cmd.mimeType }),
      );
    const target = await this.deps.photos.createUploadTarget(ws.value.id, cmd.mimeType);
    return ok({
      key: target.key,
      uploadUrl: target.uploadUrl,
      method: target.method,
      headers: target.headers ?? {},
      publicUrl: this.deps.photos.publicUrl(target.key),
    });
  }
}

export interface UploadPhotoBytesCommand extends WorkspaceScoped {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}
export interface UploadPhotoBytesOutput {
  readonly key: string;
  readonly publicUrl: string;
}

/** Upload côté serveur (mode local ou repli quand l'upload direct est indisponible). */
export class UploadPhotoBytes implements UseCase<UploadPhotoBytesCommand, UploadPhotoBytesOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "workspaces" | "photos" | "ids">) {}
  async execute(
    cmd: UploadPhotoBytesCommand,
  ): Promise<Result<UploadPhotoBytesOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, cmd);
    if (!ws.ok) return ws;
    if (!isPhotoMime(cmd.mimeType))
      return err(
        new ValidationFailed("Format d'image non pris en charge", { mimeType: cmd.mimeType }),
      );
    if (cmd.bytes.byteLength === 0) return err(new ValidationFailed("Fichier vide"));
    if (cmd.bytes.byteLength > MAX_PHOTO_BYTES)
      return err(new ValidationFailed("Fichier trop volumineux", { max: MAX_PHOTO_BYTES }));
    const key = `${ws.value.id}/${this.deps.ids.next()}.${EXTENSIONS[cmd.mimeType]}`;
    await this.deps.photos.put(key, cmd.bytes, cmd.mimeType);
    return ok({ key, publicUrl: this.deps.photos.publicUrl(key) });
  }
}
