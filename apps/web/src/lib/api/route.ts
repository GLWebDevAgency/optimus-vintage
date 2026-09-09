import { searchParamsToObject } from "@chine/contract";
import type { DomainError, Result } from "@chine/domain";
import type { NextRequest } from "next/server";
import type { z } from "zod";
import { log } from "@/lib/log";
import { created, fail, ok, payloadTooLarge, validationFailed } from "./respond";

/**
 * Aides de validation pour les handlers : lecture du corps et de la query avec les schémas du
 * contrat (`safeParse` → 400 VALIDATION_FAILED), et envoi d'un `Result` de la couche application
 * validé contre le schéma de réponse hors production (dérive contrat ↔ serveur détectée en test).
 */

/** Taille maximale d'un corps JSON ordinaire (les photos passent par l'upload direct). */
export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

/**
 * Corps JSON validé par un schéma ; lève `ZodError` (→ 400), `ApiFailure` si le JSON est illisible
 * ou si le corps dépasse `maxBytes` (→ 413, vérifié sur Content-Length puis sur le texte lu).
 */
export async function parseBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<z.output<S>> {
  let raw: unknown;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw payloadTooLarge(maxBytes);
  const text = await req.text();
  if (text.length > maxBytes) throw payloadTooLarge(maxBytes);
  if (text.trim() === "") raw = {};
  else {
    try {
      raw = JSON.parse(text);
    } catch {
      throw validationFailed("Corps JSON illisible.");
    }
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

/** Query string validée par un schéma (clés répétées → tableaux). */
export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.output<S> {
  const parsed = schema.safeParse(searchParamsToObject(new URL(req.url).searchParams));
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

export class ContractDriftError extends Error {
  override readonly name = "ContractDriftError";
  constructor(
    readonly route: string,
    readonly issues: readonly z.core.$ZodIssue[],
  ) {
    super(
      `La réponse de ${route} ne respecte pas le contrat :\n${issues
        .map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`)
        .join("\n")}`,
    );
  }
}

/**
 * Vérifie hors production qu'un DTO sortant respecte le schéma du contrat. En production la
 * vérification est ignorée (coût nul, aucune réponse bloquée par un simple écart de forme).
 */
export function assertContract<S extends z.ZodType>(route: string, schema: S, dto: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  const parsed = schema.safeParse(dto);
  if (parsed.success) return;
  const error = new ContractDriftError(route, parsed.error.issues);
  log.error("dérive de contrat", { route, issues: parsed.error.issues.length });
  throw error;
}

export interface SendOptions<S extends z.ZodType, T> {
  readonly route: string;
  readonly schema: S;
  /** Conversion de la sortie du cas d'usage vers le DTO du contrat. */
  readonly map: (value: T) => z.input<S> | Promise<z.input<S>>;
  readonly status?: 200 | 201;
  readonly headers?: HeadersInit;
}

/** Envoie un `Result` : `ok` → `{ data }` (200/201), `err` → `{ error }` selon le code. */
export async function sendResult<S extends z.ZodType, T>(
  result: Result<T, DomainError>,
  options: SendOptions<S, T>,
): Promise<Response> {
  if (!result.ok) return fail(result.error);
  const dto = await options.map(result.value);
  assertContract(options.route, options.schema, dto);
  const init = options.headers ? { headers: options.headers } : undefined;
  return options.status === 201 ? created(dto, init) : ok(dto, init);
}

/** Envoie un DTO déjà calculé, validé contre le contrat hors production. */
export function sendDto<S extends z.ZodType>(
  route: string,
  schema: S,
  dto: z.input<S>,
  init?: ResponseInit & { status?: 200 | 201 },
): Response {
  assertContract(route, schema, dto);
  return init?.status === 201 ? created(dto, init) : ok(dto, init);
}
