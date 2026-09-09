/**
 * Expert IA Gemini via l'API REST (pas de SDK) : une image + un prompt → JSON strict
 * (`responseSchema`), validé par le schéma partagé puis converti en types du domaine.
 * Le modèle vient de `GEMINI_MODEL` (défaut `gemini-2.5-flash` ; un identifiant plus récent,
 * par ex. `gemini-3.x-flash`, se règle par l'environnement sans changer le code).
 */
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports.js";
import {
  APPRAISAL_JSON_SCHEMA,
  AppraiserError,
  buildPrompt,
  DEFAULT_TIMEOUT_MS,
  errorMessage,
  type FetchLike,
  isAppraiserError,
  type ProviderOptions,
  parseAppraisalOutput,
  parseJsonLoosely,
  toDraft,
  toGeminiSchema,
  withTimeout,
} from "./core.js";

export interface GeminiAppraiserOptions extends ProviderOptions {
  readonly baseUrl?: string | undefined;
  /** Envoie `responseSchema` (structuré) en plus du prompt ; désactivable si le modèle le refuse. */
  readonly useResponseSchema?: boolean | undefined;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const PROVIDER = "gemini";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  modelVersion?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

export class GeminiAppraiser implements Appraiser {
  readonly name = PROVIDER;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;
  private readonly useResponseSchema: boolean;

  constructor(options: GeminiAppraiserOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_GEMINI_MODEL;
    this.baseUrl = (options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(
      /\/+$/,
      "",
    );
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.useResponseSchema = options.useResponseSchema ?? true;
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    const started = Date.now();
    const prompt = buildPrompt(req);
    const body = {
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt.user },
            { inlineData: { mimeType: req.mimeType, data: req.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        // Sur les modèles « thinking », la réflexion compte dans la sortie : marge large.
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        ...(this.useResponseSchema
          ? { responseSchema: toGeminiSchema(APPRAISAL_JSON_SCHEMA) }
          : {}),
      },
    };

    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`;
    const response = await withTimeout(
      async (signal) => {
        try {
          return await this.fetchImpl(url, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
            body: JSON.stringify(body),
            signal,
          });
        } catch (e) {
          if (signal.aborted) throw e;
          throw new AppraiserError(
            "UPSTREAM_ERROR",
            `Gemini : erreur réseau (${errorMessage(e)})`,
            { retryable: true, provider: PROVIDER, cause: e },
          );
        }
      },
      this.timeoutMs,
      PROVIDER,
    );

    if (!response.ok) throw await httpError(response);

    const json = await readJson(response);
    if (json.promptFeedback?.blockReason) {
      throw new AppraiserError(
        "REFUSED",
        `Gemini : requête bloquée (${json.promptFeedback.blockReason})`,
        { provider: PROVIDER, details: { blockReason: json.promptFeedback.blockReason } },
      );
    }
    const candidate = json.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
      throw new AppraiserError("REFUSED", `Gemini : réponse refusée (${finishReason})`, {
        provider: PROVIDER,
        details: { finishReason },
      });
    }
    const text = (candidate?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    if (!text.trim()) {
      throw new AppraiserError("INVALID_OUTPUT", "Gemini : réponse vide", {
        provider: PROVIDER,
        details: { finishReason },
      });
    }
    if (finishReason === "MAX_TOKENS") {
      throw new AppraiserError("INVALID_OUTPUT", "Gemini : réponse tronquée (MAX_TOKENS)", {
        provider: PROVIDER,
        details: { finishReason },
      });
    }

    const parsed = parseAppraisalOutput(parseJsonLoosely(text, "Gemini"), PROVIDER);
    const u = json.usageMetadata;
    return toDraft(parsed, {
      provider: PROVIDER,
      model: json.modelVersion ?? this.model,
      tokens:
        u?.promptTokenCount === undefined
          ? null
          : {
              input: u.promptTokenCount,
              output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
            },
      latencyMs: Date.now() - started,
      currency: req.currency,
      wantListingCopy: req.wantListingCopy ?? false,
    });
  }
}

async function httpError(response: Response): Promise<AppraiserError> {
  const status = response.status;
  const body = (await safeText(response)).slice(0, 2000);
  const details = { status, body };
  if (status === 429) {
    return new AppraiserError("RATE_LIMITED", "Gemini : quota dépassé (HTTP 429)", {
      provider: PROVIDER,
      details,
    });
  }
  return new AppraiserError("UPSTREAM_ERROR", `Gemini : HTTP ${status}`, {
    retryable: status >= 500 || status === 408,
    provider: PROVIDER,
    details,
  });
}

async function readJson(response: Response): Promise<GeminiResponse> {
  try {
    return (await response.json()) as GeminiResponse;
  } catch (e) {
    if (isAppraiserError(e)) throw e;
    throw new AppraiserError("INVALID_OUTPUT", "Gemini : corps de réponse illisible", {
      provider: PROVIDER,
      cause: e,
    });
  }
}

const safeText = async (r: Response): Promise<string> => {
  try {
    return await r.text();
  } catch {
    return "";
  }
};
