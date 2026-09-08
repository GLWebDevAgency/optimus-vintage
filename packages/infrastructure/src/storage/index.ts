import type { PhotoStorage } from "../ports.js";
import { LocalPhotoStorage } from "./LocalPhotoStorage.js";
import { R2PhotoStorage } from "./R2PhotoStorage.js";

export {
  assertSafeKey,
  extensionFor,
  InvalidPhotoKey,
  isSafeKey,
  mimeTypeFor,
  newPhotoKey,
  UnsupportedMimeType,
} from "./keys.js";
export { LocalPhotoStorage, type LocalPhotoStorageOptions } from "./LocalPhotoStorage.js";
export { R2PhotoStorage, type R2PhotoStorageOptions } from "./R2PhotoStorage.js";

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key]?.trim() || undefined;

export type StorageDriver = "auto" | "r2" | "local";

/** R2 est utilisable si toutes ses variables sont renseignées. */
export function r2OptionsFromEnv(env: Env) {
  const accountId = read(env, "R2_ACCOUNT_ID");
  const accessKeyId = read(env, "R2_ACCESS_KEY_ID");
  const secretAccessKey = read(env, "R2_SECRET_ACCESS_KEY");
  const bucket = read(env, "R2_BUCKET");
  const publicBaseUrl = read(env, "R2_PUBLIC_BASE_URL");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) return undefined;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

/** `STORAGE_DRIVER=auto|r2|local` — `auto` choisit R2 si configuré, sinon local. */
export function createPhotoStorage(env: Env = process.env): PhotoStorage {
  const driver = (read(env, "STORAGE_DRIVER") ?? "auto") as StorageDriver;
  const r2 = r2OptionsFromEnv(env);
  if (driver === "r2" || (driver === "auto" && r2)) {
    if (!r2) throw new Error("STORAGE_DRIVER=r2 mais la configuration R2 est incomplète");
    return new R2PhotoStorage(r2);
  }
  return new LocalPhotoStorage({ dataDir: read(env, "CHINE_DATA_DIR") });
}
