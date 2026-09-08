"use client";

import type { CreateItemQuickCaptureCommand } from "@chine/contract";
import { liveQuery } from "dexie";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getOutboxDb, type OutboxEntry } from "@/lib/offline/outbox";
import { type PendingPhoto, usePendingPhotos } from "@/lib/offline/pending-photos";

/* ────────────────────────────── Entrées de l'outbox ────────────────────────────── */

const listeners = new Set<() => void>();
let entries: readonly OutboxEntry[] = [];
let sub: { unsubscribe(): void } | undefined;
const EMPTY: readonly OutboxEntry[] = [];

function ensure(): void {
  if (sub || typeof indexedDB === "undefined") return;
  sub = liveQuery(() => getOutboxDb().outbox.orderBy("createdAt").toArray()).subscribe({
    next: (rows) => {
      entries = rows;
      for (const l of listeners) l();
    },
    error: () => {
      entries = [];
      for (const l of listeners) l();
    },
  });
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  ensure();
  return () => {
    listeners.delete(l);
  };
}

/** Toutes les mutations en file (lecture seule, mise à jour en direct). */
export function useOutboxEntries(): readonly OutboxEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => EMPTY,
  );
}

/** Vrai si une mutation attend sur ce chemin (« Sync plus tard » sur une pièce, une vente). */
export function usePendingPath(path: string | undefined): boolean {
  const all = useOutboxEntries();
  return useMemo(
    () => Boolean(path) && all.some((e) => e.path.startsWith(path ?? "")),
    [all, path],
  );
}

/* ────────────────────────────── Captures en attente ────────────────────────────── */

export type PendingCaptureStage = "photo" | "queued" | "failed";

export interface PendingCapture {
  readonly clientId: string;
  readonly createdAt: number;
  readonly command: Omit<CreateItemQuickCaptureCommand, "photoKeys">;
  readonly photoUrl?: string;
  readonly stage: PendingCaptureStage;
  readonly error?: string;
}

function isItemCreate(e: OutboxEntry): boolean {
  return e.method === "POST" && e.path === "/items";
}

/**
 * Pièces capturées hors ligne, pas encore créées côté serveur : photo en attente d'upload,
 * puis commande en file dans l'outbox. Affichées en tête du stock avec « Sync plus tard ».
 */
export function usePendingCaptures(): readonly PendingCapture[] {
  const photos = usePendingPhotos();
  const outbox = useOutboxEntries();
  const [urls, setUrls] = useState<Record<string, string>>({});

  // URLs d'objet pour les vignettes : créées à chaque changement de la liste, révoquées ensuite.
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const p of photos) next[p.id] = URL.createObjectURL(p.blob);
    setUrls(next);
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url);
    };
  }, [photos]);

  return useMemo(() => {
    const fromPhotos: PendingCapture[] = photos.map((p: PendingPhoto) => ({
      clientId: p.id,
      createdAt: p.createdAt,
      command: p.command,
      ...(urls[p.id] ? { photoUrl: urls[p.id] } : {}),
      stage: p.status === "failed" ? "failed" : "photo",
      ...(p.lastError ? { error: p.lastError } : {}),
    }));
    const known = new Set(fromPhotos.map((p) => p.clientId));
    const fromOutbox: PendingCapture[] = outbox
      .filter((e) => isItemCreate(e) && !known.has(e.id))
      .map((e) => ({
        clientId: e.id,
        createdAt: e.createdAt,
        command: (e.body ?? {}) as Omit<CreateItemQuickCaptureCommand, "photoKeys">,
        stage: e.status === "failed" ? "failed" : "queued",
        ...(e.lastError ? { error: e.lastError } : {}),
      }));
    return [...fromPhotos, ...fromOutbox].sort((a, b) => b.createdAt - a.createdAt);
  }, [photos, outbox, urls]);
}
