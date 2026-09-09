/**
 * Noyau partagé des experts IA : erreurs typées, schéma de sortie (zod → JSON Schema),
 * conversion vers le domaine et garde-fou de délai. Chaque fournisseur (Anthropic, Gemini,
 * OpenAI) s'appuie sur ce module ; le routeur ne raisonne que sur `AppraiserError`.
 */
import { AI_CREDIT_COST, type AiTokenUsage, type Currency } from "@chine/domain";
import type { AppraisalDraft } from "../ports.js";
import { parseAppraisalBody } from "./appraisal-codec.js";
import { type AppraisalOutput, AppraisalOutputSchema } from "./schema.js";

export { buildPrompt, buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from "./prompt.js";
export {
  ACTIONS,
  APPRAISAL_JSON_SCHEMA,
  type AppraisalOutput,
  AppraisalOutputSchema,
  DEMANDS,
  type JsonSchema,
  TRENDS,
  toGeminiSchema,
} from "./schema.js";

// ── Erreurs ──────────────────────────────────────────────────────────────

export type AppraiserErrorCode =
  | "NOT_CONFIGURED"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "REFUSED"
  | "INVALID_OUTPUT"
  | "UPSTREAM_ERROR";

/** Réessayable par défaut selon le code (un fournisseur peut préciser autrement). */
const DEFAULT_RETRYABLE: Readonly<Record<AppraiserErrorCode, boolean>> = {
  NOT_CONFIGURED: false,
  TIMEOUT: true,
  RATE_LIMITED: true,
  REFUSED: false,
  INVALID_OUTPUT: false,
  UPSTREAM_ERROR: false,
};

export interface AppraiserErrorOptions {
  readonly retryable?: boolean | undefined;
  /** Fournisseur à l'origine de l'erreur (`anthropic`, `gemini`, …). */
  readonly provider?: string | undefined;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
  readonly cause?: unknown;
}

export class AppraiserError extends Error {
  override readonly name = "AppraiserError";
  readonly code: AppraiserErrorCode;
  readonly retryable: boolean;
  readonly provider: string | undefined;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(code: AppraiserErrorCode, message: string, options: AppraiserErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.code = code;
    this.retryable = options.retryable ?? DEFAULT_RETRYABLE[code];
    this.provider = options.provider;
    this.details = options.details;
  }

  /** Forme sérialisable, sans secret, pour les journaux et les diagnostics. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      retryable: this.retryable,
      provider: this.provider,
      message: this.message,
      details: this.details,
    };
  }
}

export const isAppraiserError = (e: unknown): e is AppraiserError => e instanceof AppraiserError;

/** Normalise une exception quelconque en `AppraiserError` (réessayable : cause inconnue). */
export function toAppraiserError(e: unknown, provider: string): AppraiserError {
  if (isAppraiserError(e)) return e;
  const message = e instanceof Error ? e.message : String(e);
  return new AppraiserError("UPSTREAM_ERROR", `${provider} : erreur inattendue (${message})`, {
    retryable: true,
    provider,
    cause: e,
  });
}

// ── Conversion vers le domaine ───────────────────────────────────────────

/** Jetons entiers et positifs ; `null` si le fournisseur n'a rien rapporté d'exploitable. */
export function normalizeTokens(t: AiTokenUsage | null | undefined): AiTokenUsage | null {
  if (!t) return null;
  const input = Number(t.input);
  const output = Number(t.output);
  if (!Number.isFinite(input) || !Number.isFinite(output)) return null;
  return { input: Math.max(0, Math.round(input)), output: Math.max(0, Math.round(output)) };
}

export interface DraftMeta {
  readonly provider: string;
  /** Modèle réellement servi (peut différer du modèle demandé : repli côté serveur). */
  readonly model: string;
  readonly latencyMs: number;
  readonly currency: Currency;
  /** Jetons facturés (entrée / sortie) tels que rapportés par le fournisseur ; absent si inconnus. */
  readonly tokens?: AiTokenUsage | null | undefined;
  /** `false` : l'annonce est ignorée même si le modèle en a produit une. Défaut : conservée. */
  readonly wantListingCopy?: boolean | undefined;
}

/** Sortie validée → brouillon d'expertise (montants en unités mineures, valeurs bornées). */
export function toDraft(parsed: AppraisalOutput, meta: DraftMeta): AppraisalDraft {
  const body = parseAppraisalBody(parsed, meta.currency);
  return {
    provider: meta.provider,
    model: meta.model,
    credits: AI_CREDIT_COST.APPRAISAL,
    tokens: normalizeTokens(meta.tokens),
    latencyMs: Math.max(0, Math.round(meta.latencyMs)),
    ...body,
    listingCopy: meta.wantListingCopy === false ? null : body.listingCopy,
  };
}

/** Valide un JSON brut (déjà parsé) contre le schéma ; `INVALID_OUTPUT` sinon. */
export function parseAppraisalOutput(raw: unknown, provider: string): AppraisalOutput {
  const result = AppraisalOutputSchema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(racine)"}: ${i.message}`);
  throw new AppraiserError("INVALID_OUTPUT", `${provider} : sortie hors schéma (${issues[0]})`, {
    provider,
    details: { issues },
  });
}

/** JSON éventuellement entouré de ``` ou de texte : on isole le premier objet complet. */
export function parseJsonLoosely(text: string, provider = "ia"): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // on tombe dans l'erreur ci-dessous
      }
    }
    throw new AppraiserError("INVALID_OUTPUT", `${provider} : JSON invalide`, {
      provider,
      details: { sample: cleaned.slice(0, 300) },
    });
  }
}

// ── Délai ────────────────────────────────────────────────────────────────

/**
 * Exécute `run` avec un signal d'annulation déclenché après `timeoutMs`. Si le délai expire,
 * le résultat est `TIMEOUT` (réessayable) quel que soit ce que `run` finit par renvoyer.
 */
export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  provider: string,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new AppraiserError("TIMEOUT", `${provider} : délai dépassé (${timeoutMs} ms)`, {
          provider,
          details: { timeoutMs },
        }),
      );
    }, timeoutMs);
  });
  try {
    return await Promise.race([run(controller.signal), expired]);
  } catch (e) {
    if (controller.signal.aborted && !isAppraiserError(e)) {
      throw new AppraiserError("TIMEOUT", `${provider} : délai dépassé (${timeoutMs} ms)`, {
        provider,
        details: { timeoutMs },
        cause: e,
      });
    }
    throw e;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Options communes aux fournisseurs distants. */
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface ProviderOptions {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly fetch?: FetchLike | undefined;
}

export const DEFAULT_TIMEOUT_MS = 45_000;

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
