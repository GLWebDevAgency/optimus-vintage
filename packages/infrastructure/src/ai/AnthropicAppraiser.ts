/**
 * Expert IA Claude via le SDK officiel `@anthropic-ai/sdk` : image + prompt → sortie structurée
 * (`output_config.format` construit depuis le schéma zod). Modèle par défaut `claude-fable-5-1`
 * (la réflexion y est toujours active : on ne transmet ni `thinking`, ni `temperature`).
 * Le repli côté serveur (`fallbacks: "default"`) rejoue une requête déclinée sur le modèle
 * recommandé par Anthropic ; le modèle réellement servi est celui rapporté dans le brouillon.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports.js";
import {
  AppraisalOutputSchema,
  AppraiserError,
  buildPrompt,
  DEFAULT_TIMEOUT_MS,
  type ProviderOptions,
  parseAppraisalOutput,
  toDraft,
  withTimeout,
} from "./core.js";

export const DEFAULT_ANTHROPIC_MODEL = "claude-fable-5-1";
export const ANTHROPIC_EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type AnthropicEffort = (typeof ANTHROPIC_EFFORTS)[number];
export const DEFAULT_ANTHROPIC_EFFORT: AnthropicEffort = "low";

const PROVIDER = "anthropic";
const MAX_TOKENS = 16_000;

export interface AnthropicAppraiserOptions extends ProviderOptions {
  /** Profondeur de réflexion (`ANTHROPIC_EFFORT`, défaut `low`). */
  readonly effort?: AnthropicEffort | undefined;
  readonly baseUrl?: string | undefined;
}

export const isAnthropicEffort = (v: string | undefined): v is AnthropicEffort =>
  v !== undefined && (ANTHROPIC_EFFORTS as readonly string[]).includes(v);

export class AnthropicAppraiser implements Appraiser {
  readonly name = PROVIDER;
  readonly model: string;
  readonly effort: AnthropicEffort;
  private readonly client: Anthropic;
  private readonly timeoutMs: number;

  constructor(options: AnthropicAppraiserOptions) {
    this.model = options.model ?? DEFAULT_ANTHROPIC_MODEL;
    this.effort = options.effort ?? DEFAULT_ANTHROPIC_EFFORT;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.client = new Anthropic({
      apiKey: options.apiKey,
      timeout: this.timeoutMs,
      maxRetries: 1,
      ...(options.fetch ? { fetch: options.fetch } : {}),
      ...(options.baseUrl ? { baseURL: options.baseUrl } : {}),
    });
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    const started = Date.now();
    const prompt = buildPrompt(req);

    const response = await withTimeout(
      async (signal) => {
        try {
          return await this.client.beta.messages.create(
            {
              model: this.model,
              max_tokens: MAX_TOKENS,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: {
                effort: this.effort,
                format: zodOutputFormat(AppraisalOutputSchema),
              },
              system: prompt.system,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image",
                      source: { type: "base64", media_type: req.mimeType, data: req.imageBase64 },
                    },
                    { type: "text", text: prompt.user },
                  ],
                },
              ],
            },
            { signal },
          );
        } catch (e) {
          throw mapSdkError(e, this.timeoutMs);
        }
      },
      this.timeoutMs,
      PROVIDER,
    );

    if (response.stop_reason === "refusal") {
      const category = response.stop_details?.category ?? null;
      throw new AppraiserError("REFUSED", `Anthropic : requête refusée (${category ?? "n/a"})`, {
        provider: PROVIDER,
        details: { category, model: response.model },
      });
    }
    if (response.stop_reason === "max_tokens") {
      throw new AppraiserError("INVALID_OUTPUT", "Anthropic : réponse tronquée (max_tokens)", {
        provider: PROVIDER,
        details: { model: response.model },
      });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text) {
      throw new AppraiserError("INVALID_OUTPUT", "Anthropic : aucun bloc texte dans la réponse", {
        provider: PROVIDER,
        details: { stopReason: response.stop_reason, model: response.model },
      });
    }
    let raw: unknown;
    try {
      raw = JSON.parse(text.text);
    } catch (e) {
      throw new AppraiserError("INVALID_OUTPUT", "Anthropic : JSON invalide", {
        provider: PROVIDER,
        details: { sample: text.text.slice(0, 300) },
        cause: e,
      });
    }
    const parsed = parseAppraisalOutput(raw, PROVIDER);
    return toDraft(parsed, {
      provider: PROVIDER,
      model: response.model,
      latencyMs: Date.now() - started,
      currency: req.currency,
      wantListingCopy: req.wantListingCopy ?? false,
    });
  }
}

/** Erreurs typées du SDK → `AppraiserError` (du plus spécifique au plus général). */
function mapSdkError(e: unknown, timeoutMs: number): AppraiserError {
  if (e instanceof AppraiserError) return e;
  const base = { provider: PROVIDER, cause: e } as const;
  if (e instanceof Anthropic.RateLimitError) {
    return new AppraiserError("RATE_LIMITED", "Anthropic : limite de débit (HTTP 429)", {
      ...base,
      details: { status: e.status },
    });
  }
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.BadRequestError) {
    return new AppraiserError("UPSTREAM_ERROR", `Anthropic : HTTP ${e.status} (${e.message})`, {
      ...base,
      retryable: false,
      details: { status: e.status },
    });
  }
  if (
    e instanceof Anthropic.APIConnectionError ||
    e instanceof Anthropic.APIUserAbortError ||
    e instanceof Anthropic.APIConnectionTimeoutError
  ) {
    return new AppraiserError("TIMEOUT", `Anthropic : délai ou connexion (${e.message})`, {
      ...base,
      details: { timeoutMs },
    });
  }
  if (e instanceof Anthropic.APIError) {
    const status = e.status ?? 0;
    return new AppraiserError("UPSTREAM_ERROR", `Anthropic : HTTP ${status} (${e.message})`, {
      ...base,
      retryable: status >= 500 || status === 408 || status === 409,
      details: { status },
    });
  }
  return new AppraiserError("UPSTREAM_ERROR", `Anthropic : erreur inattendue (${String(e)})`, {
    ...base,
    retryable: true,
  });
}
