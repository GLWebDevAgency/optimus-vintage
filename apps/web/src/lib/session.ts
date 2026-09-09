"use client";

import Dexie from "dexie";
import { del } from "idb-keyval";
import { authClient } from "@/lib/auth-client";
import { PERSIST_KEY } from "@/lib/query/client";

/** Bases locales et caches propres à un compte : effacés à la déconnexion (appareil partagé). */
const LOCAL_DATABASES = ["chine-outbox", "chine-pending-photos"] as const;
const LOCAL_CACHES = ["chine-api-v1", "chine-images"] as const;

/** Efface tout ce que l'appareil garde du compte : requêtes persistées, caches du service worker, files hors ligne. */
export async function clearDeviceData(): Promise<void> {
  const tasks: Promise<unknown>[] = [del(PERSIST_KEY).catch(() => undefined)];
  if (typeof caches !== "undefined") {
    tasks.push(...LOCAL_CACHES.map((name) => caches.delete(name).catch(() => false)));
  }
  if (typeof indexedDB !== "undefined") {
    tasks.push(...LOCAL_DATABASES.map((name) => Dexie.delete(name).catch(() => undefined)));
  }
  await Promise.all(tasks);
}

/**
 * Déconnexion complète : session révoquée côté serveur, données locales effacées, puis
 * rechargement complet vers l'écran de connexion (aucun état React ne survit).
 */
export async function signOutEverywhere(): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    await clearDeviceData();
    window.location.assign("/auth/connexion");
  }
}
