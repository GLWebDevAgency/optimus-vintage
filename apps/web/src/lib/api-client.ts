"use client";

import type { ApiError, ApiOk } from "@/lib/api/respond";

/** Erreur HTTP typée renvoyée par `apiFetch` (le `status` est lu par la politique de retry). */
export class ApiClientError extends Error {
  override readonly name = "ApiClientError";
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Lecture `/api/v1/*` avec enveloppe `{ data }` dépliée.
 * TODO(lead): remplacer par le client isomorphe de `@chine/contract` quand il sera publié.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  const json = (await res.json().catch(() => null)) as ApiOk<T> | ApiError | null;
  if (!res.ok || !json || "error" in json) {
    const err = json && "error" in json ? json.error : undefined;
    throw new ApiClientError(
      res.status,
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `HTTP ${res.status}`,
      err?.details,
    );
  }
  return json.data;
}
