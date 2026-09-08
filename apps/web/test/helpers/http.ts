import { NextRequest } from "next/server";
import type { RouteHandler } from "@/lib/api/with-auth";

export const ORIGIN = "http://localhost:3000";

export interface RequestOptions {
  readonly body?: unknown;
  readonly rawBody?: string | Uint8Array;
  readonly headers?: Record<string, string>;
  /** Simule une requête venant d'un autre site (contrôle CSRF). */
  readonly crossSite?: boolean;
}

/** Requête `NextRequest` de même origine, corps JSON sérialisé (ou brut). */
export function request(method: string, path: string, options: RequestOptions = {}): NextRequest {
  const headers: Record<string, string> = {
    accept: "application/json",
    origin: options.crossSite ? "https://evil.example" : ORIGIN,
    "sec-fetch-site": options.crossSite ? "cross-site" : "same-origin",
    ...options.headers,
  };
  let body: BodyInit | undefined;
  if (options.rawBody !== undefined) {
    body =
      typeof options.rawBody === "string"
        ? options.rawBody
        : (new Uint8Array(options.rawBody).buffer as ArrayBuffer);
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }
  return new NextRequest(`${ORIGIN}${path}`, { method, headers, body });
}

export interface CallResult<T = unknown> {
  readonly status: number;
  readonly headers: Headers;
  readonly json: T;
  readonly data: T extends { data: infer D } ? D : unknown;
  readonly error: { code: string; message: string; details?: unknown } | undefined;
}

/** Appelle un handler exporté par une route avec ses paramètres dynamiques, et décode la réponse. */
export async function call<P = Record<string, never>, T = unknown>(
  handler: RouteHandler<P>,
  req: NextRequest,
  params?: P,
): Promise<CallResult<T>> {
  const res = await handler(req, params ? { params: Promise.resolve(params) } : undefined);
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  const record = (json ?? {}) as { data?: unknown; error?: CallResult["error"] };
  return {
    status: res.status,
    headers: res.headers,
    json: json as T,
    data: record.data as CallResult<T>["data"],
    error: record.error,
  };
}

/** Raccourci : `api(handler, "POST", "/api/v1/items", { body })`. */
export async function api<T = unknown, P = Record<string, never>>(
  handler: RouteHandler<P>,
  method: string,
  path: string,
  options: RequestOptions & { params?: P } = {},
): Promise<CallResult<T>> {
  const { params, ...rest } = options;
  return call<P, T>(handler, request(method, path, rest), params);
}

export const eur = (minor: number) => ({ minor, currency: "EUR" as const });
