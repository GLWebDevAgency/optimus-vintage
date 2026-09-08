/**
 * Routeur d'experts IA : chaîne ordonnée de fournisseurs. On essaie chacun à son tour, on passe
 * au suivant sur une erreur réessayable (délai, quota, refus, sortie hors schéma, panne amont),
 * on s'arrête au premier succès. Une erreur non réessayable (clé invalide, requête rejetée)
 * interrompt la chaîne : la réessayer ailleurs ne changerait rien et masquerait le défaut.
 */
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports.js";
import {
  AppraiserError,
  type AppraiserErrorCode,
  DEFAULT_TIMEOUT_MS,
  toAppraiserError,
  withTimeout,
} from "./core.js";

export interface AppraiserAttempt {
  readonly provider: string;
  readonly model: string;
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly code?: AppraiserErrorCode | undefined;
  readonly message?: string | undefined;
}

export interface AppraiserRouterOptions {
  readonly providers: readonly Appraiser[];
  /** Délai maximal par tentative (défaut 45 s) ; le fournisseur en est aussi informé. */
  readonly timeoutMs?: number | undefined;
  /** Journalisation / métriques : appelé après chaque tentative, succès ou échec. */
  readonly onAttempt?: ((attempt: AppraiserAttempt) => void) | undefined;
}

export interface AppraiserChainEntry {
  readonly provider: string;
  readonly model: string;
}
export interface AppraiserDescription {
  readonly chain: readonly AppraiserChainEntry[];
  /** Vrai si l'expert de démonstration figure dans la chaîne. */
  readonly fake: boolean;
}

/** Codes pour lesquels on passe au fournisseur suivant même si `retryable` est faux. */
const FAILOVER_CODES: ReadonlySet<AppraiserErrorCode> = new Set([
  "TIMEOUT",
  "RATE_LIMITED",
  "REFUSED",
  "INVALID_OUTPUT",
]);

export const shouldFailover = (e: AppraiserError): boolean =>
  e.retryable || FAILOVER_CODES.has(e.code);

/** Modèle annoncé par un fournisseur (propriété `model` facultative sur le port). */
export const modelOf = (p: Appraiser): string =>
  "model" in p && typeof p.model === "string" ? p.model : "unknown";

export class AppraiserRouter implements Appraiser {
  readonly name: string;
  readonly providers: readonly Appraiser[];
  private readonly timeoutMs: number;
  private readonly onAttempt: ((attempt: AppraiserAttempt) => void) | undefined;

  constructor(options: AppraiserRouterOptions) {
    this.providers = [...options.providers];
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.onAttempt = options.onAttempt;
    this.name = `router(${this.providers.map((p) => p.name).join(",")})`;
  }

  describe(): AppraiserDescription {
    return {
      chain: this.providers.map((p) => ({ provider: p.name, model: modelOf(p) })),
      fake: this.providers.some((p) => p.name === "fake"),
    };
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    if (this.providers.length === 0) {
      throw new AppraiserError(
        "NOT_CONFIGURED",
        "Aucun expert IA configuré (APPRAISER_DRIVER / clés d'API)",
      );
    }
    const failures: AppraiserAttempt[] = [];
    for (const provider of this.providers) {
      const started = Date.now();
      const model = modelOf(provider);
      try {
        const draft = await withTimeout(
          () => provider.appraise(req),
          this.timeoutMs,
          provider.name,
        );
        this.report({ provider: provider.name, model, ok: true, latencyMs: Date.now() - started });
        return draft;
      } catch (e) {
        const error = toAppraiserError(e, provider.name);
        const attempt: AppraiserAttempt = {
          provider: provider.name,
          model,
          ok: false,
          latencyMs: Date.now() - started,
          code: error.code,
          message: error.message,
        };
        this.report(attempt);
        failures.push(attempt);
        if (!shouldFailover(error)) {
          throw new AppraiserError(error.code, error.message, {
            retryable: false,
            provider: error.provider ?? provider.name,
            details: { ...error.details, attempts: failures },
            cause: error,
          });
        }
      }
    }
    const summary = failures.map((f) => `${f.provider}=${f.code}`).join(", ");
    throw new AppraiserError("UPSTREAM_ERROR", `Tous les experts IA ont échoué (${summary})`, {
      retryable: failures.every((f) => f.code !== "REFUSED"),
      provider: this.name,
      details: { attempts: failures },
    });
  }

  private report(attempt: AppraiserAttempt): void {
    try {
      this.onAttempt?.(attempt);
    } catch {
      // un journal défaillant ne doit jamais faire échouer une expertise
    }
  }
}
