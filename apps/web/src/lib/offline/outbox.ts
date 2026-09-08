"use client";

import Dexie, { type EntityTable, liveQuery } from "dexie";
import { useSyncExternalStore } from "react";
import { isOnline } from "./network";

/* ────────────────────────────── Modèle ────────────────────────────── */

export type OutboxMethod = "POST" | "PUT" | "PATCH" | "DELETE";
export type OutboxEntryStatus = "pending" | "failed";

export interface OutboxEntry {
  /** UUID généré côté client, envoyé en `X-Outbox-Id` (idempotence côté serveur). */
  readonly id: string;
  readonly createdAt: number;
  readonly method: OutboxMethod;
  /** Chemin relatif sous `/api/v1`, ex. `/items`. */
  readonly path: string;
  readonly body?: unknown;
  attempts: number;
  lastError?: string;
  status: OutboxEntryStatus;
}

export const OUTBOX_API_PREFIX = "/api/v1";

class OutboxDatabase extends Dexie {
  outbox!: EntityTable<OutboxEntry, "id">;

  constructor() {
    super("chine-outbox");
    this.version(1).stores({ outbox: "id, createdAt, status" });
  }
}

let db: OutboxDatabase | undefined;
const hasIndexedDb = (): boolean => typeof indexedDB !== "undefined";

/** Base Dexie (client uniquement). */
export function getOutboxDb(): OutboxDatabase {
  if (!hasIndexedDb()) throw new Error("IndexedDB indisponible : outbox hors navigateur.");
  db ??= new OutboxDatabase();
  return db;
}

/* ────────────────────────────── Statut (store) ────────────────────────────── */

export interface OutboxStatus {
  readonly pending: number;
  readonly failed: number;
  readonly syncing: boolean;
  readonly lastSyncedAt: number | null;
  readonly lastError: string | null;
}

const IDLE: OutboxStatus = { pending: 0, failed: 0, syncing: false, lastSyncedAt: null, lastError: null };
let status: OutboxStatus = IDLE;
const listeners = new Set<() => void>();
let countsSubscription: { unsubscribe(): void } | undefined;

function setStatus(patch: Partial<OutboxStatus>): void {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

function ensureCounts(): void {
  if (countsSubscription || !hasIndexedDb()) return;
  const d = getOutboxDb();
  countsSubscription = liveQuery(async () => {
    const [pending, failed] = await Promise.all([
      d.outbox.where("status").equals("pending").count(),
      d.outbox.where("status").equals("failed").count(),
    ]);
    return { pending, failed };
  }).subscribe({
    next: (c) => setStatus(c),
    error: (e: unknown) => setStatus({ lastError: e instanceof Error ? e.message : String(e) }),
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureCounts();
  return () => {
    listeners.delete(listener);
  };
}
const getSnapshot = (): OutboxStatus => status;
const getServerSnapshot = (): OutboxStatus => IDLE;

/** Nombre de mutations en attente, échecs, et état de synchronisation. */
export function useOutboxStatus(): OutboxStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ────────────────────────────── Opérations ────────────────────────────── */

export interface EnqueueInput {
  readonly method: OutboxMethod;
  readonly path: string;
  readonly body?: unknown;
  readonly id?: string;
}

/** Met une mutation en file. Retourne son identifiant (utilisable comme id optimiste). */
export async function enqueue(input: EnqueueInput): Promise<string> {
  const id = input.id ?? crypto.randomUUID();
  const entry: OutboxEntry = {
    id,
    createdAt: Date.now(),
    method: input.method,
    path: input.path,
    ...(input.body !== undefined ? { body: input.body } : {}),
    attempts: 0,
    status: "pending",
  };
  await getOutboxDb().outbox.add(entry);
  if (isOnline()) void replay();
  return id;
}

export async function discard(id: string): Promise<void> {
  await getOutboxDb().outbox.delete(id);
}

/** Remet en file les entrées marquées en échec. */
export async function retryFailed(): Promise<void> {
  await getOutboxDb()
    .outbox.where("status")
    .equals("failed")
    .modify((e) => {
      e.status = "pending";
      e.attempts = 0;
      delete e.lastError;
    });
  if (isOnline()) void replay();
}

export async function listEntries(): Promise<OutboxEntry[]> {
  return getOutboxDb().outbox.orderBy("createdAt").toArray();
}

export type ReplayResult = { sent: number; failed: number; stopped: "done" | "offline" | "network" | "client-error" | "unauthorized" };

let replaying: Promise<ReplayResult> | undefined;

/**
 * Rejoue la file séquentiellement (ordre de création) vers `/api/v1/*`.
 * - 2xx → entrée supprimée.
 * - 401 → on s'arrête, tout reste en attente (session à renouveler).
 * - autre 4xx → entrée marquée `failed` (réponse conservée), on s'arrête.
 * - 5xx / erreur réseau → tentative incrémentée, on s'arrête ; on réessaiera au prochain `online`.
 */
export function replay(): Promise<ReplayResult> {
  if (replaying) return replaying;
  replaying = doReplay().finally(() => {
    replaying = undefined;
  });
  return replaying;
}

async function doReplay(): Promise<ReplayResult> {
  const result: ReplayResult = { sent: 0, failed: 0, stopped: "done" };
  if (!hasIndexedDb()) return result;
  if (!isOnline()) return { ...result, stopped: "offline" };

  const table = getOutboxDb().outbox;
  const entries = (await table.orderBy("createdAt").toArray()).filter((e) => e.status === "pending");
  if (entries.length === 0) return result;

  setStatus({ syncing: true, lastError: null });
  try {
    for (const entry of entries) {
      let response: Response;
      try {
        response = await fetch(`${OUTBOX_API_PREFIX}${entry.path}`, {
          method: entry.method,
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            "x-outbox-id": entry.id,
            "x-outbox-created-at": String(entry.createdAt),
          },
          body: entry.body === undefined ? null : JSON.stringify(entry.body),
          credentials: "same-origin",
        });
      } catch (e) {
        await table.update(entry.id, {
          attempts: entry.attempts + 1,
          lastError: e instanceof Error ? e.message : "Erreur réseau",
        });
        setStatus({ lastError: "Réseau indisponible" });
        return { ...result, stopped: "network" };
      }

      if (response.ok) {
        await table.delete(entry.id);
        result.sent += 1;
        continue;
      }
      if (response.status === 401) {
        setStatus({ lastError: "Connexion requise" });
        return { ...result, stopped: "unauthorized" };
      }
      const message = await describeFailure(response);
      if (response.status >= 400 && response.status < 500) {
        await table.update(entry.id, { status: "failed", attempts: entry.attempts + 1, lastError: message });
        result.failed += 1;
        setStatus({ lastError: message });
        return { ...result, stopped: "client-error" };
      }
      await table.update(entry.id, { attempts: entry.attempts + 1, lastError: message });
      setStatus({ lastError: message });
      return { ...result, stopped: "network" };
    }
    return result;
  } finally {
    setStatus({ syncing: false, lastSyncedAt: Date.now() });
  }
}

async function describeFailure(response: Response): Promise<string> {
  try {
    const json = (await response.clone().json()) as { error?: { message?: string; code?: string } };
    if (json?.error?.message) return `${json.error.code ?? response.status} · ${json.error.message}`;
  } catch {
    // corps non JSON
  }
  return `HTTP ${response.status}`;
}

/* ────────────────────────────── Déclencheurs ────────────────────────────── */

/**
 * Branche le rejeu automatique : à la reconnexion, au retour au premier plan, et au montage.
 * Retourne la fonction de nettoyage (à appeler dans un `useEffect`).
 */
export function startOutboxAutoReplay(): () => void {
  if (typeof window === "undefined" || !hasIndexedDb()) return () => {};
  ensureCounts();
  const onOnline = () => void replay();
  const onVisible = () => {
    if (document.visibilityState === "visible") void replay();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  void replay();
  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
