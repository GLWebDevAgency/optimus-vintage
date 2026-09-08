/**
 * Client HTTP isomorphe (navigateur, Node, React Native) : une méthode par route,
 * réponses validées par Zod, erreurs typées `ApiClientError`. Aucune dépendance React.
 */
import type { z } from "zod";
import { ApiError, ok } from "./common";
import type { ApiErrorCode } from "./enums";
import { toSearchParams } from "./queries";
import {
  API_PREFIX,
  buildPath,
  type PathParams,
  type RouteDef,
  type Routes,
  routes,
} from "./routes";

export class ApiClientError extends Error {
  override readonly name = "ApiClientError";
  constructor(
    /** Code métier (`NOT_FOUND`, `QUOTA_EXCEEDED`…) ou transport (`NETWORK`, `INTERNAL`). */
    readonly code: ApiErrorCode | (string & {}),
    message: string,
    /** Statut HTTP ; 0 si la requête n'est jamais partie. */
    readonly status: number,
    readonly details?: Record<string, unknown>,
    readonly route?: string,
  ) {
    super(message);
  }
  is(code: ApiErrorCode): boolean {
    return this.code === code;
  }
}

export interface ApiClientOptions {
  /** Origine du serveur, ex. `https://chine.app` ou `""` pour le même domaine. */
  readonly baseUrl: string;
  /** Préfixe des routes ; `/api/v1` par défaut. */
  readonly prefix?: string;
  /** Implémentation `fetch` (injection pour tests, Node, Expo). */
  readonly fetch?: typeof globalThis.fetch;
  /** En-têtes dynamiques (jeton de session, langue). */
  readonly getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Délai maximal par requête (ms). Aucun par défaut. */
  readonly timeoutMs?: number;
}

type HasKeys<T> = keyof T extends never ? false : true;

type ParamsInput<R extends RouteDef> =
  HasKeys<PathParams<R["path"]>> extends true
    ? { params: PathParams<R["path"]> }
    : { params?: never };
type QueryInput<R extends RouteDef> = R["query"] extends z.ZodType
  ? { query?: z.input<R["query"]> }
  : { query?: never };
type BodyInput<R extends RouteDef> = R["body"] extends z.ZodType
  ? { body: z.input<R["body"]> }
  : { body?: never };

export type RouteInput<R extends RouteDef> = ParamsInput<R> &
  QueryInput<R> &
  BodyInput<R> & { signal?: AbortSignal };
export type RouteOutput<R extends RouteDef> = z.output<R["response"]>;

type RequiresInput<R extends RouteDef> =
  HasKeys<PathParams<R["path"]>> extends true ? true : R["body"] extends z.ZodType ? true : false;

export type RouteMethod<R extends RouteDef> =
  RequiresInput<R> extends true
    ? (input: RouteInput<R>) => Promise<RouteOutput<R>>
    : (input?: RouteInput<R>) => Promise<RouteOutput<R>>;

export type ApiClient = { readonly [K in keyof Routes]: RouteMethod<Routes[K]> } & {
  /** Appel générique pour une route hors table (ou un test). */
  readonly call: <R extends RouteDef>(route: R, input?: RouteInput<R>) => Promise<RouteOutput<R>>;
};

const isJsonResponse = (res: Response): boolean =>
  (res.headers.get("content-type") ?? "").includes("application/json");

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const prefix = options.prefix ?? API_PREFIX;
  const base = options.baseUrl.replace(/\/+$/, "");

  async function call<R extends RouteDef>(
    route: R,
    input?: RouteInput<R>,
  ): Promise<RouteOutput<R>> {
    const params = (input?.params ?? {}) as PathParams<R["path"]>;
    const path = buildPath(route.path, params);
    const search = toSearchParams(input?.query as Record<string, unknown> | undefined).toString();
    const url = `${base}${prefix}${path}${search ? `?${search}` : ""}`;
    const label = `${route.method} ${route.path}`;

    const headers: Record<string, string> = {
      accept: "application/json",
      ...(await options.getHeaders?.()),
    };
    let body: string | undefined;
    if (route.body && input?.body !== undefined) {
      const parsed = route.body.safeParse(input.body);
      if (!parsed.success) {
        throw new ApiClientError(
          "VALIDATION_FAILED",
          "Requête invalide",
          0,
          { issues: parsed.error.issues },
          label,
        );
      }
      body = JSON.stringify(parsed.data);
      headers["content-type"] = "application/json";
    }

    const controller = options.timeoutMs ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), options.timeoutMs) : undefined;
    if (controller && input?.signal) {
      input.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: route.method,
        headers,
        ...(body !== undefined ? { body } : {}),
        ...(controller
          ? { signal: controller.signal }
          : input?.signal
            ? { signal: input.signal }
            : {}),
        credentials: "include",
      });
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      throw new ApiClientError(
        aborted ? "TIMEOUT" : "NETWORK",
        aborted ? "Délai dépassé" : "Impossible de joindre le serveur",
        0,
        { cause: e instanceof Error ? e.message : String(e) },
        label,
      );
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }

    if (!res.ok) {
      let payload: unknown;
      if (isJsonResponse(res)) payload = await res.json().catch(() => undefined);
      const parsed = ApiError.safeParse(payload);
      if (parsed.success) {
        const { code, message, details } = parsed.data.error;
        throw new ApiClientError(code, message, res.status, details, label);
      }
      const fallback: Record<number, ApiErrorCode> = {
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        429: "RATE_LIMITED",
      };
      throw new ApiClientError(
        fallback[res.status] ?? "INTERNAL",
        `Erreur HTTP ${res.status}`,
        res.status,
        undefined,
        label,
      );
    }

    if (res.status === 204) return undefined as RouteOutput<R>;
    const json: unknown = await res.json();
    const envelope = ok(route.response).safeParse(json);
    if (!envelope.success) {
      throw new ApiClientError(
        "INTERNAL",
        "Réponse du serveur inattendue",
        res.status,
        { issues: envelope.error.issues },
        label,
      );
    }
    return envelope.data.data as RouteOutput<R>;
  }

  const methods = Object.fromEntries(
    (Object.keys(routes) as (keyof Routes)[]).map((name) => [
      name,
      (input?: RouteInput<RouteDef>) => call(routes[name], input),
    ]),
  ) as unknown as { [K in keyof Routes]: RouteMethod<Routes[K]> };

  return { ...methods, call };
}
