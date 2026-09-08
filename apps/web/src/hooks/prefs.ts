"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Préférences locales (par appareil) : haptique, dernier prix payé, dernier lieu,
 * bannière d'installation. Stockées en `localStorage`, lues via `useSyncExternalStore`.
 */
export interface Prefs {
  readonly haptics: boolean;
  readonly lastPricePaidMinor: number | null;
  readonly lastSupplierKind: string | null;
  readonly lastLocationLabel: string | null;
  /** Horodatage de la dernière fois où l'invitation à installer a été fermée. */
  readonly installDismissedAt: number | null;
  /** Nombre de ventes enregistrées sur cet appareil (invitation à installer après la première). */
  readonly salesRecorded: number;
}

const DEFAULTS: Prefs = {
  haptics: true,
  lastPricePaidMinor: null,
  lastSupplierKind: null,
  lastLocationLabel: null,
  installDismissedAt: null,
  salesRecorded: 0,
};

const KEY = "chine.prefs";
const EVENT = "chine:prefs";
let cache: Prefs | undefined;

function read(): Prefs {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache;
}

export function getPrefs(): Prefs {
  return typeof window === "undefined" ? DEFAULTS : read();
}

export function updatePrefs(patch: Partial<Prefs>): void {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // stockage plein ou indisponible : la préférence vit le temps de la session
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      onChange();
    }
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULTS);
  const update = useCallback((patch: Partial<Prefs>) => updatePrefs(patch), []);
  return [prefs, update];
}
