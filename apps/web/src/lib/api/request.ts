import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

/** Méthodes qui modifient l'état : soumises au contrôle d'origine (CSRF). */
export const MUTATING_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** En-tête interne posé par le proxy Next après résolution : la seule valeur de confiance. */
export const CLIENT_IP_HEADER = "x-chine-client-ip";

const IPV4 = /^(\d{1,3})(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;
export const isValidIp = (v: string): boolean =>
  (IPV4.test(v) && v.split(".").every((n) => Number(n) <= 255)) ||
  (v.includes(":") && IPV6.test(v));

/**
 * Adresse IP du client derrière la chaîne de proxys.
 * - `cf-connecting-ip` si Cloudflare est devant (il ne peut pas être forgé par le client) ;
 * - sinon le **dernier** saut de `X-Forwarded-For`, celui qu'ajoute le bord Railway : les sauts
 *   précédents sont fournis par le client et donc falsifiables ;
 * - `x-real-ip` en dernier recours ; `unknown` sans en-tête.
 */
export function resolveClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf && isValidIp(cf)) return cf;
  const hops = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  const last = hops.at(-1);
  if (last && isValidIp(last)) return last;
  const real = headers.get("x-real-ip")?.trim();
  if (real && isValidIp(real)) return real;
  return "unknown";
}

/** IP du client pour les limites anonymes : l'en-tête interne du proxy d'abord, puis la résolution. */
export function clientIp(req: Request): string {
  const internal = req.headers.get(CLIENT_IP_HEADER)?.trim();
  if (internal && isValidIp(internal)) return internal;
  return resolveClientIp(req.headers);
}

/**
 * Origine publique de l'app pour construire des URL absolues (photos, uploads).
 * En production : `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` ; sinon l'origine de la requête
 * (utile pour tester sur téléphone via l'IP locale).
 */
export function publicOrigin(req: Request): string {
  const env = getEnv();
  if (env.isProduction && env.appOrigin) return env.appOrigin;
  return new URL(req.url).origin;
}

/** Rend une URL absolue si elle est relative au site (`/api/v1/photos/…`). */
export function absoluteUrl(url: string, origin: string): string {
  return url.startsWith("/") ? `${origin}${url}` : url;
}

/**
 * Contrôle CSRF pour les mutations : la requête doit venir de la même origine.
 * - `Sec-Fetch-Site` (navigateurs modernes) : `same-origin` ou `none` (navigation directe) acceptés.
 * - Sinon, `Origin` doit correspondre à l'hôte de la requête ou à l'origine publique configurée.
 * - Sans aucun des deux en-têtes (clients non-navigateur), on accepte : la session est portée
 *   par un cookie `SameSite=Lax`, que ces clients n'envoient pas automatiquement.
 */
export function isSameOriginRequest(req: NextRequest | Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set<string>();
  allowed.add(new URL(req.url).origin);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  if (host) allowed.add(`${proto}://${host}`);
  const configured = getEnv().appOrigin;
  if (configured) allowed.add(configured);
  return allowed.has(origin);
}
