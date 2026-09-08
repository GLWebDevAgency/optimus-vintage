/**
 * Stockage local des photos (dev, tests, auto-hébergement) : fichiers sous
 * `${CHINE_DATA_DIR}/uploads/<key>`. L'application web sert et reçoit les fichiers via
 * `/api/v1/photos/...` — ce stockage ne fait que lire/écrire sur disque.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkspaceId } from "@chine/domain";
import type { PhotoStorage } from "../ports.js";
import { assertSafeKey, mimeTypeFor, newPhotoKey } from "./keys.js";

export interface LocalPhotoStorageOptions {
  /** Dossier de données ; les fichiers vont dans `<dataDir>/uploads`. */
  readonly dataDir?: string | undefined;
  /** Préfixe des routes HTTP servies par l'app web (défaut `/api/v1/photos`). */
  readonly routePrefix?: string | undefined;
}

export class LocalPhotoStorage implements PhotoStorage {
  readonly root: string;
  private readonly routePrefix: string;

  constructor(options: LocalPhotoStorageOptions = {}) {
    this.root = path.resolve(options.dataDir ?? ".data", "uploads");
    this.routePrefix = (options.routePrefix ?? "/api/v1/photos").replace(/\/+$/, "");
  }

  async createUploadTarget(workspaceId: WorkspaceId, mimeType: string) {
    const key = newPhotoKey(workspaceId, mimeType);
    return {
      key,
      uploadUrl: `${this.routePrefix}/upload/${key}`,
      method: "PUT" as const,
      headers: { "Content-Type": mimeType },
    };
  }

  private pathFor(key: string): string {
    assertSafeKey(key);
    return path.join(this.root, ...key.split("/"));
  }

  async put(key: string, bytes: Uint8Array, _mimeType: string): Promise<void> {
    const file = this.pathFor(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  /** Lecture pour la route de service (`undefined` si absent). */
  async read(key: string): Promise<{ bytes: Uint8Array; mimeType: string } | undefined> {
    const file = this.pathFor(key);
    try {
      const bytes = await readFile(file);
      return { bytes: new Uint8Array(bytes), mimeType: mimeTypeFor(key) };
    } catch (e) {
      if (isNotFound(e)) return undefined;
      throw e;
    }
  }

  publicUrl(key: string): string {
    assertSafeKey(key);
    return `${this.routePrefix}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}

const isNotFound = (e: unknown): boolean =>
  typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT";
