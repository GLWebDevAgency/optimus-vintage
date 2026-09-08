"use client";

import type {
  ApiClient,
  CreateItemQuickCaptureCommand,
  ImageMimeType,
  UploadTargetDto,
} from "@chine/contract";
import { ApiClientError } from "@chine/contract";
import Dexie, { type EntityTable, liveQuery } from "dexie";
import { useSyncExternalStore } from "react";
import { isOnline } from "./network";
import { enqueue } from "./outbox";

/* ────────────────────────────── Modèle ────────────────────────────── */

export type PendingPhotoStatus = "pending" | "uploading" | "failed";

/** Commande de capture rapide sans ses clés de photo (ajoutées après l'upload). */
export type PendingCaptureCommand = Omit<CreateItemQuickCaptureCommand, "photoKeys"> & {
  readonly clientId: string;
};

/**
 * Capture faite hors ligne : la photo attend le réseau ici, puis la création de la pièce
 * passe par l'outbox (`POST /items`) avec la clé obtenue à l'upload.
 */
export interface PendingPhoto {
  /** `clientId` de la capture (idempotence côté serveur, id de l'entrée outbox). */
  readonly id: string;
  readonly createdAt: number;
  readonly blob: Blob;
  readonly mimeType: ImageMimeType;
  readonly byteSize: number;
  readonly command: PendingCaptureCommand;
  attempts: number;
  lastError?: string;
  status: PendingPhotoStatus;
}

class PendingPhotosDatabase extends Dexie {
  pendingPhotos!: EntityTable<PendingPhoto, "id">;

  constructor() {
    super("chine-pending-photos");
    this.version(1).stores({ pendingPhotos: "id, createdAt, status" });
  }
}

let db: PendingPhotosDatabase | undefined;
const hasIndexedDb = (): boolean => typeof indexedDB !== "undefined";

export function getPendingPhotosDb(): PendingPhotosDatabase {
  if (!hasIndexedDb()) throw new Error("IndexedDB indisponible : photos hors ligne impossibles.");
  db ??= new PendingPhotosDatabase();
  return db;
}

/* ────────────────────────────── Upload ────────────────────────────── */

export interface UploadedPhoto {
  readonly key: string;
  readonly publicUrl?: string;
}

const isSameOrigin = (url: string): boolean => {
  if (url.startsWith("/")) return true;
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
};

/** `POST /uploads` puis `PUT`/`POST` direct des octets sur l'URL signée. */
export async function uploadPhoto(
  client: ApiClient,
  blob: Blob,
  mimeType: ImageMimeType,
  signal?: AbortSignal,
): Promise<UploadedPhoto> {
  const target: UploadTargetDto = await client.prepareUpload({
    body: { mimeType, byteSize: blob.size, purpose: "item-photo" },
    signal,
  });
  let res: Response;
  try {
    res = await fetch(target.uploadUrl, {
      method: target.method,
      headers: { "content-type": mimeType, ...(target.headers ?? {}) },
      body: blob,
      signal,
      // Même origine (stockage local) : cookie de session ; hôte tiers signé (R2) : pas de cookie.
      credentials: isSameOrigin(target.uploadUrl) ? "same-origin" : "omit",
    });
  } catch (e) {
    throw new ApiClientError(
      "NETWORK",
      "Impossible d'envoyer la photo",
      0,
      { cause: e instanceof Error ? e.message : String(e) },
      `${target.method} upload`,
    );
  }
  if (!res.ok) {
    throw new ApiClientError(
      res.status >= 500 ? "INTERNAL" : "PAYLOAD_TOO_LARGE",
      `Envoi de la photo refusé (HTTP ${res.status})`,
      res.status,
      undefined,
      `${target.method} upload`,
    );
  }
  return { key: target.key, ...(target.publicUrl ? { publicUrl: target.publicUrl } : {}) };
}

/* ────────────────────────────── Statut (store) ────────────────────────────── */

const listeners = new Set<() => void>();
let snapshot: readonly PendingPhoto[] = [];
let subscription: { unsubscribe(): void } | undefined;

function emit(): void {
  for (const l of listeners) l();
}

function ensureSubscription(): void {
  if (subscription || !hasIndexedDb()) return;
  subscription = liveQuery(() =>
    getPendingPhotosDb().pendingPhotos.orderBy("createdAt").toArray(),
  ).subscribe({
    next: (rows) => {
      snapshot = rows;
      emit();
    },
    error: () => {
      snapshot = [];
      emit();
    },
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureSubscription();
  return () => {
    listeners.delete(listener);
  };
}
const EMPTY: readonly PendingPhoto[] = [];
const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

/** Photos en attente d'upload (captures hors ligne), du plus ancien au plus récent. */
export function usePendingPhotos(): readonly PendingPhoto[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ────────────────────────────── Opérations ────────────────────────────── */

export interface SavePendingCaptureInput {
  readonly command: PendingCaptureCommand;
  /** Sans photo : la création part directement dans l'outbox. */
  readonly photo?: { readonly blob: Blob; readonly mimeType: ImageMimeType };
}

/**
 * Enregistre une capture faite hors ligne. Avec photo : les octets attendent le réseau ici ;
 * sans photo : la commande est mise en file tout de suite. Retourne le `clientId`.
 */
export async function savePendingCapture(input: SavePendingCaptureInput): Promise<string> {
  const id = input.command.clientId;
  if (!input.photo) {
    await enqueue({
      id,
      method: "POST",
      path: "/items",
      body: { ...input.command, photoKeys: [] },
    });
    return id;
  }
  const entry: PendingPhoto = {
    id,
    createdAt: Date.now(),
    blob: input.photo.blob,
    mimeType: input.photo.mimeType,
    byteSize: input.photo.blob.size,
    command: input.command,
    attempts: 0,
    status: "pending",
  };
  await getPendingPhotosDb().pendingPhotos.put(entry);
  return id;
}

export async function discardPendingPhoto(id: string): Promise<void> {
  await getPendingPhotosDb().pendingPhotos.delete(id);
}

export async function retryFailedPhotos(client: ApiClient): Promise<void> {
  await getPendingPhotosDb()
    .pendingPhotos.where("status")
    .equals("failed")
    .modify((p) => {
      p.status = "pending";
      p.attempts = 0;
      delete p.lastError;
    });
  if (isOnline()) void uploadPendingPhotos(client);
}

export interface PhotoUploadResult {
  uploaded: number;
  failed: number;
  stopped: "done" | "offline" | "network" | "client-error" | "unauthorized";
}

let running: Promise<PhotoUploadResult> | undefined;

/**
 * Rejoue les photos en attente (y compris celles interrompues en plein envoi) : upload,
 * puis mise en file de `POST /items` avec la clé.
 * - erreur réseau / 5xx → on s'arrête, on réessaiera à la prochaine reconnexion ;
 * - 401 → on s'arrête (session à renouveler) ;
 * - autre 4xx → photo marquée `failed` (la commande est conservée, retentable).
 */
export function uploadPendingPhotos(client: ApiClient): Promise<PhotoUploadResult> {
  if (running) return running;
  running = doUpload(client).finally(() => {
    running = undefined;
  });
  return running;
}

async function doUpload(client: ApiClient): Promise<PhotoUploadResult> {
  const result: PhotoUploadResult = { uploaded: 0, failed: 0, stopped: "done" };
  if (!hasIndexedDb()) return result;
  if (!isOnline()) return { ...result, stopped: "offline" };
  const table = getPendingPhotosDb().pendingPhotos;
  // Une photo restée en « uploading » vient d'une page fermée ou rechargée en plein envoi :
  // l'envoi ne peut plus aboutir, on la reprend (l'upload est idempotent par `clientId`).
  const rows = (await table.orderBy("createdAt").toArray()).filter(
    (p) => p.status === "pending" || p.status === "uploading",
  );
  for (const row of rows) {
    await table.update(row.id, { status: "uploading" });
    try {
      const { key } = await uploadPhoto(client, row.blob, row.mimeType);
      await enqueue({
        id: row.id,
        method: "POST",
        path: "/items",
        body: { ...row.command, photoKeys: [key] },
      });
      await table.delete(row.id);
      result.uploaded += 1;
    } catch (e) {
      const err = e instanceof ApiClientError ? e : undefined;
      const message = err ? `${err.code} · ${err.message}` : "Erreur réseau";
      if (!err || err.status === 0 || err.status >= 500) {
        await table.update(row.id, {
          status: "pending",
          attempts: row.attempts + 1,
          lastError: message,
        });
        return { ...result, stopped: "network" };
      }
      if (err.status === 401) {
        await table.update(row.id, { status: "pending", lastError: message });
        return { ...result, stopped: "unauthorized" };
      }
      await table.update(row.id, {
        status: "failed",
        attempts: row.attempts + 1,
        lastError: message,
      });
      result.failed += 1;
    }
  }
  return result;
}

/** Branche l'upload automatique (reconnexion, retour au premier plan, montage). */
export function startPendingPhotoUploader(client: ApiClient): () => void {
  if (typeof window === "undefined" || !hasIndexedDb()) return () => {};
  ensureSubscription();
  const run = () => void uploadPendingPhotos(client);
  const onVisible = () => {
    if (document.visibilityState === "visible") run();
  };
  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", onVisible);
  run();
  return () => {
    window.removeEventListener("online", run);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
