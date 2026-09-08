import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

/** Méthodes qui modifient l'état : soumises au contrôle d'origine (CSRF). */
export const MUTATING_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Adresse IP du client, pour les limites anonymes. Derrière un proxy de confiance
 * (Vercel, Cloudflare) les en-têtes standard sont renseignés ; sinon `unknown`.
 */
export function clientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return (
    first ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.trim() ||
    "unknown"
  );
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
