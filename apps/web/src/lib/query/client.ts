"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Client TanStack Query : lecture hors ligne d'abord, cache conservé une semaine (persisté en IndexedDB). */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: WEEK,
        networkMode: "offlineFirst",
        retry: (failureCount, error) => {
          // Pas de retry sur les 4xx renvoyés par notre API.
          const status = (error as { status?: number } | null)?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
}

/** Persister IndexedDB (idb-keyval) — `undefined` hors navigateur ou sans IndexedDB. */
export function makePersistOptions(): Omit<PersistQueryClientOptions, "queryClient"> | undefined {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return undefined;
  const persister = createAsyncStoragePersister({
    key: "chine.query-cache",
    throttleTime: 1000,
    storage: {
      getItem: async (key) => (await get<string>(key)) ?? null,
      setItem: (key, value) => set(key, value),
      removeItem: (key) => del(key),
    },
  });
  return {
    persister,
    maxAge: WEEK,
    buster: "v1",
    dehydrateOptions: {
      // On ne persiste que les requêtes réussies (jamais une erreur ni un état « en cours »).
      shouldDehydrateQuery: (q) => q.state.status === "success",
    },
  };
}
