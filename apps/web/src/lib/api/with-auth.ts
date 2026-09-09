import { IDEMPOTENCY_KEY_PATTERN, rateLimitKey, UuidV7Generator } from "@chine/infrastructure";
import type { NextRequest } from "next/server";
import { getAuth, type Session } from "@/lib/auth";
import { type Container, getContainer } from "@/lib/container";
import { describeError, type Logger, log } from "@/lib/log";
import { clientIp, isSameOriginRequest, MUTATING_METHODS } from "./request";
import { ApiFailure, fail, forbidden, rateLimited, unauthorized } from "./respond";
import { resolveWorkspaceId } from "./workspace";

/** Contexte d'une requête authentifiée. */
export interface AuthContext<P = Record<string, never>> {
  readonly userId: string;
  readonly workspaceId: string;
  readonly session: Session;
  readonly deps: Container;
  /** Paramètres dynamiques de la route (Next 16 : `params` est une promesse, déjà résolue ici). */
  readonly params: P;
  readonly requestId: string;
  readonly log: Logger;
}

/** Contexte d'une requête publique (santé, webhooks, lecture de photos). */
export interface PublicContext<P = Record<string, never>> {
  readonly deps: Container;
  readonly params: P;
  readonly requestId: string;
  readonly log: Logger;
  readonly ip: string;
}

export interface RateLimitOption {
  /** Nom stable de la limite (`items:create`) ; la clé finale ajoute l'espace ou l'IP. */
  readonly key: string;
  readonly max: number;
  readonly windowSeconds: number;
}

export interface RouteOptions {
  /** Limite de débit par espace de travail (ou par IP pour les routes publiques). */
  readonly limit?: RateLimitOption;
  /** Nom lisible pour les journaux ; défaut : méthode + chemin. */
  readonly name?: string;
  /** Désactive le contrôle d'origine (webhooks signés). Défaut : actif sur les mutations. */
  readonly csrf?: boolean;
}

type RouteContext<P> = { params: Promise<P> };
type AuthedHandler<P> = (req: NextRequest, ctx: AuthContext<P>) => Promise<Response> | Response;
type PublicHandler<P> = (req: NextRequest, ctx: PublicContext<P>) => Promise<Response> | Response;
export type RouteHandler<P> = (req: NextRequest, ctx?: RouteContext<P>) => Promise<Response>;

const ids = new UuidV7Generator();
export const REQUEST_ID_HEADER = "X-Request-Id";
/** Clé d'idempotence envoyée par la file hors ligne : même clé → même réponse, une seule écriture. */
export const IDEMPOTENCY_HEADER = "x-outbox-id";
const REPLAY_HEADER = "X-Idempotent-Replay";

/**
 * Exécute une mutation sous clé d'idempotence quand le client en fournit une (UUID) :
 * réponse mémorisée rejouée à l'identique, doublon simultané refusé (409), échec serveur libéré.
 */
async function withIdempotency(
  req: NextRequest,
  deps: Container,
  workspaceId: string,
  run: () => Promise<Response>,
): Promise<Response> {
  const key = req.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!key || !MUTATING_METHODS.has(req.method)) return run();
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) return run();
  const path = new URL(req.url).pathname;
  const begun = await deps.idempotency.begin(workspaceId, key, req.method, path);
  if (begun.state === "replay") {
    return new Response(JSON.stringify(begun.body), {
      status: begun.status,
      headers: { "content-type": "application/json", [REPLAY_HEADER]: "true" },
    });
  }
  if (begun.state === "in-flight") {
    return fail(new ApiFailure("CONFLICT", "La même requête est déjà en cours de traitement."));
  }
  let res: Response;
  try {
    res = await run();
  } catch (e) {
    await deps.idempotency.abandon(workspaceId, key).catch(() => undefined);
    throw e;
  }
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (res.status >= 500 || !isJson) {
    await deps.idempotency.abandon(workspaceId, key).catch(() => undefined);
    return res;
  }
  const body: unknown = await res
    .clone()
    .json()
    .catch(() => null);
  await deps.idempotency.complete(workspaceId, key, res.status, body).catch(() => undefined);
  return res;
}

/** Résolution de session, remplaçable dans les tests. */
export type SessionResolver = (req: NextRequest) => Promise<Session | null>;
const defaultResolver: SessionResolver = async (req) =>
  (await getAuth()).api.getSession({ headers: req.headers });
let sessionResolver: SessionResolver = defaultResolver;

export function setSessionResolverForTests(resolver: SessionResolver | undefined): void {
  sessionResolver = resolver ?? defaultResolver;
}

function withRequestId(res: Response, requestId: string): Response {
  if (!res.headers.has(REQUEST_ID_HEADER)) {
    try {
      res.headers.set(REQUEST_ID_HEADER, requestId);
    } catch {
      // En-têtes immuables (réponse construite ailleurs) : on la recopie.
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: [...res.headers.entries(), [REQUEST_ID_HEADER, requestId]],
      });
    }
  }
  return res;
}

async function applyLimit(
  deps: Container,
  limit: RateLimitOption | undefined,
  identity: string,
): Promise<Response | undefined> {
  if (!limit) return undefined;
  const decision = await deps.rateLimiter.hit(
    rateLimitKey("api", limit.key, identity),
    limit.max,
    limit.windowSeconds,
  );
  if (decision.allowed) return undefined;
  const retryAfter = Math.max(1, Math.ceil((decision.resetAt.getTime() - Date.now()) / 1000));
  return fail(rateLimited(retryAfter), { headers: { "Retry-After": String(retryAfter) } });
}

interface Timing {
  readonly startedAt: number;
  readonly requestId: string;
  readonly route: string;
  readonly method: string;
}

function begin(req: NextRequest, options: RouteOptions): Timing {
  const url = new URL(req.url);
  return {
    startedAt: performance.now(),
    requestId: ids.next(),
    route: options.name ?? url.pathname,
    method: req.method,
  };
}

function finish(t: Timing, res: Response, userId?: string): Response {
  const durationMs = Math.round(performance.now() - t.startedAt);
  const fields = {
    requestId: t.requestId,
    method: t.method,
    route: t.route,
    status: res.status,
    durationMs,
    ...(userId ? { userId } : {}),
  };
  if (res.status >= 500) log.error("requête", fields);
  else if (res.status >= 400) log.warn("requête", fields);
  else log.info("requête", fields);
  return withRequestId(res, t.requestId);
}

/** Convertit une exception en réponse ; seules les erreurs serveur (5xx) sont journalisées en détail. */
function failAndLog(t: Timing, error: unknown): Response {
  const res = fail(error);
  if (res.status >= 500) {
    log.error("exception dans le handler", {
      requestId: t.requestId,
      route: t.route,
      ...describeError(error),
    });
  }
  return res;
}

/**
 * Enveloppe un route handler authentifié : session Better Auth (401 sinon), contrôle d'origine
 * sur les mutations (403), espace de travail résolu, limite de débit optionnelle (429 + Retry-After),
 * `X-Request-Id` sur chaque réponse, journal structuré, exceptions converties en `{ error }`.
 *
 * @example
 * export const GET = withAuth(async (_req, { workspaceId }) => ok({ workspaceId }));
 */
export function withAuth<P = Record<string, never>>(
  handler: AuthedHandler<P>,
  options: RouteOptions = {},
): RouteHandler<P> {
  return async (req, ctx) => {
    const t = begin(req, options);
    let userId: string | undefined;
    try {
      if (options.csrf !== false && MUTATING_METHODS.has(req.method) && !isSameOriginRequest(req)) {
        return finish(t, fail(forbidden("Origine de la requête refusée.")));
      }
      const session = await sessionResolver(req);
      if (!session) return finish(t, fail(unauthorized()));
      const uid = session.user.id;
      userId = uid;
      const deps = await getContainer();
      const workspaceId = await resolveWorkspaceId(deps, uid);
      const limited = await applyLimit(deps, options.limit, workspaceId);
      if (limited) return finish(t, limited, userId);
      const params = ctx ? await ctx.params : ({} as P);
      const res = await withIdempotency(req, deps, workspaceId, () =>
        Promise.resolve(
          handler(req, {
            userId: uid,
            workspaceId,
            session,
            deps,
            params,
            requestId: t.requestId,
            log: log.child({ requestId: t.requestId, route: t.route, userId: uid }),
          }),
        ),
      );
      return finish(t, res, userId);
    } catch (error) {
      return finish(t, failAndLog(t, error), userId);
    }
  };
}

/**
 * Enveloppe un route handler public : pas de session, limite de débit par IP,
 * mêmes journaux et même `X-Request-Id`.
 */
export function withPublic<P = Record<string, never>>(
  handler: PublicHandler<P>,
  options: RouteOptions = {},
): RouteHandler<P> {
  return async (req, ctx) => {
    const t = begin(req, options);
    try {
      if (options.csrf === true && MUTATING_METHODS.has(req.method) && !isSameOriginRequest(req)) {
        return finish(t, fail(forbidden("Origine de la requête refusée.")));
      }
      const deps = await getContainer();
      const ip = clientIp(req);
      const limited = await applyLimit(deps, options.limit, `ip:${ip}`);
      if (limited) return finish(t, limited);
      const params = ctx ? await ctx.params : ({} as P);
      const res = await handler(req, {
        deps,
        params,
        ip,
        requestId: t.requestId,
        log: log.child({ requestId: t.requestId, route: t.route }),
      });
      return finish(t, res);
    } catch (error) {
      return finish(t, failAndLog(t, error));
    }
  };
}
