/**
 * Stockage Cloudflare R2 (API S3) : upload direct navigateur → R2 via URL pré-signée,
 * lecture publique via le domaine configuré (`R2_PUBLIC_BASE_URL`).
 */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { WorkspaceId } from "@chine/domain";
import type { PhotoStorage } from "../ports.js";
import { assertSafeKey, newPhotoKey } from "./keys.js";

export interface R2PhotoStorageOptions {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
  /** Domaine public du bucket (ex. `https://photos.chine.app`), sans slash final. */
  readonly publicBaseUrl: string;
  /** Durée de validité de l'URL d'upload, en secondes (défaut 10 min). */
  readonly uploadTtlSeconds?: number | undefined;
  /** Endpoint S3 (défaut : `https://<accountId>.r2.cloudflarestorage.com`). */
  readonly endpoint?: string | undefined;
  /** Client injecté (tests). */
  readonly client?: S3Client | undefined;
}

export class R2PhotoStorage implements PhotoStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly uploadTtl: number;

  constructor(options: R2PhotoStorageOptions) {
    this.bucket = options.bucket;
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
    this.uploadTtl = options.uploadTtlSeconds ?? 600;
    const config: S3ClientConfig = {
      region: "auto",
      endpoint: options.endpoint ?? `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
      forcePathStyle: true,
    };
    this.client = options.client ?? new S3Client(config);
  }

  async createUploadTarget(workspaceId: WorkspaceId, mimeType: string) {
    const key = newPhotoKey(workspaceId, mimeType);
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: this.uploadTtl });
    return { key, uploadUrl, method: "PUT" as const, headers: { "Content-Type": mimeType } };
  }

  async put(key: string, bytes: Uint8Array, mimeType: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: mimeType }),
    );
  }

  publicUrl(key: string): string {
    assertSafeKey(key);
    return `${this.publicBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
