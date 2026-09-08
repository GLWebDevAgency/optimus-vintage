"use client";

import { ApiClientError, createApiClient } from "@chine/contract";
import type { ApiError, ApiOk } from "@/lib/api/respond";

export { ApiClientError };

/**
 * Client typé de `@chine/contract` : une méthode par route (`api.listItems({ query })`,
 * `api.recordSale({ body })`…), corps validés avant envoi, réponses validées à la réception,
 * erreurs `ApiClientError` (`.code`, `.status`, `.details`). Même origine : `baseUrl: ""`.
 */
export const api = createApiClient({ baseUrl: "", timeoutMs: 20_000 });

/**
 * Lecture brute `/api/v1/*` avec enveloppe `{ data }` dépliée, pour les appels hors table de
 * routes (upload local d'un fichier, réponses ad hoc). Lève `ApiClientError` comme `api`.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { accept: "application/json", ...(init?.headers ?? {}) },
      credentials: "same-origin",
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new ApiClientError(
      aborted ? "TIMEOUT" : "NETWORK",
      aborted ? "Délai dépassé" : "Impossible de joindre le serveur",
      0,
      { cause: e instanceof Error ? e.message : String(e) },
      path,
    );
  }
  const json = (await res.json().catch(() => null)) as ApiOk<T> | ApiError | null;
  if (!res.ok || !json || "error" in json) {
    const err = json && "error" in json ? json.error : undefined;
    throw new ApiClientError(
      err?.code ?? "INTERNAL",
      err?.message ?? `Erreur HTTP ${res.status}`,
      res.status,
      typeof err?.details === "object" && err.details !== null
        ? (err.details as Record<string, unknown>)
        : undefined,
      path,
    );
  }
  return json.data;
}
