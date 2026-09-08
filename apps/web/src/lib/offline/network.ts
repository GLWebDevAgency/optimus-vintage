"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const getSnapshot = (): boolean => navigator.onLine;
const getServerSnapshot = (): boolean => true;

/** `true` quand le navigateur se croit en ligne (au rendu serveur : toujours `true`). */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const isOnline = (): boolean => (typeof navigator === "undefined" ? true : navigator.onLine);
