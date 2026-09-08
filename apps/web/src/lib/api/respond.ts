import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { describeError, log } from "@/lib/log";

/**
 * Enveloppes JSON de l'API /api/v1 :
 *   succès → { data }
 *   erreur → { error: { code, message, details? } }
 */
export interface ApiErrorShape {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export type ApiError = { error: ApiErrorShape };
export type ApiOk<T> = { data: T };

/** Codes d'erreur (domaine, application, transport) → statut HTTP. Tout code inconnu retombe sur 500. */
export const ERROR_STATUS: Readonly<Record<string, number>> = {
  VALIDATION_FAILED: 400,
  CURRENCY_MISMATCH: 400,
  NEGATIVE_COST: 400,
  NEGATIVE_PRICE: 400,
  TITLE_REQUIRED: 400,
  NAME_REQUIRED: 400,
  QUANTITY_REQUIRED: 400,
  UNIT_QUANTITY: 400,
  INVALID_SKU: 400,
  INVALID_FEES: 400,
  UNAUTHORIZED: 401,
  QUOTA_EXCEEDED: 402,
  FEATURE_LOCKED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  INVARIANT_VIOLATION: 409,
  NOT_RECEIVABLE: 409,
  PHOTO_LIMIT: 409,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  APPRAISAL_FAILED: 502,
  BILLING_UNAVAILABLE: 503,
  SERVICE_UNAVAILABLE: 503,
};

export function statusFor(code: string): number {
  return ERROR_STATUS[code] ?? 500;
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ data }, { ...init, status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

function isErrorShape(value: unknown): value is ApiErrorShape {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

/**
 * Convertit n'importe quelle erreur en réponse JSON.
 * - `DomainError` (@chine/domain) et tout objet `{ code, message, details }` → statut selon le code.
 * - `ZodError` → 400 VALIDATION_FAILED avec l'arbre d'erreurs.
 * - Le reste → 500, message générique (on ne fuit jamais une stack).
 */
export function fail(error: unknown, init?: ResponseInit): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Données invalides.",
          details: z.treeifyError(error),
        },
      },
      { ...init, status: 400 },
    );
  }
  if (isErrorShape(error)) {
    const status = statusFor(error.code);
    // Un code inconnu (500) ne fuit ni message ni détails ; un 502/503 attendu garde son message.
    const masked = status === 500;
    if (masked) log.error("erreur métier non mappée", { code: error.code, status });
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: masked ? "Erreur interne." : error.message,
          ...(error.details !== undefined && !masked ? { details: error.details } : {}),
        },
      },
      { ...init, status },
    );
  }
  log.error("erreur non gérée", describeError(error));
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erreur interne." } },
    { ...init, status: 500 },
  );
}

/** Raccourci pour lever une erreur API typée depuis un handler. */
export class ApiFailure extends Error implements ApiErrorShape {
  override readonly name = "ApiFailure";
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Ressource") => new ApiFailure("NOT_FOUND", `${what} introuvable.`);
export const forbidden = (message = "Accès refusé.") => new ApiFailure("FORBIDDEN", message);
export const unauthorized = (message = "Connexion requise.") =>
  new ApiFailure("UNAUTHORIZED", message);
export const validationFailed = (message: string, details?: unknown) =>
  new ApiFailure("VALIDATION_FAILED", message, details);
export const payloadTooLarge = (maxBytes: number) =>
  new ApiFailure("PAYLOAD_TOO_LARGE", "Fichier trop volumineux.", { maxBytes });
export const unsupportedMediaType = (message = "Format non pris en charge.") =>
  new ApiFailure("UNSUPPORTED_MEDIA_TYPE", message);
export const rateLimited = (retryAfterSeconds: number) =>
  new ApiFailure("RATE_LIMITED", "Trop de requêtes. Réessaie dans un instant.", {
    retryAfterSeconds,
  });
export const serviceUnavailable = (message: string) =>
  new ApiFailure("SERVICE_UNAVAILABLE", message);
