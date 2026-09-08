/**
 * Expert IA Gemini via l'API REST (pas de SDK) : une image + un prompt → JSON strict,
 * parsé et validé défensivement avant d'être converti en types du domaine.
 */

import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports.js";
import { parseAppraisalBody } from "./appraisal-codec.js";
import { APPRAISAL_RESPONSE_SCHEMA, buildSystemPrompt, buildUserPrompt } from "./prompt.js";

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface GeminiAppraiserOptions {
  readonly apiKey: string;
  /** Modèle (défaut `gemini-2.5-flash`). */
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly fetch?: FetchLike | undefined;
  /** Envoie `responseSchema` (structuré) en plus du prompt ; désactivable si le modèle le refuse. */
  readonly useResponseSchema?: boolean | undefined;
}

export class AppraiserError extends Error {
  override readonly name = "AppraiserError";
  constructor(
    readonly code: "HTTP" | "EMPTY" | "BLOCKED" | "INVALID_JSON" | "TIMEOUT" | "NETWORK",
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
  }
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export class GeminiAppraiser implements Appraiser {
  readonly name = "gemini";
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
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.useResponseSchema = options.useResponseSchema ?? true;
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    const started = Date.now();
    const body = {
      systemInstruction: { parts: [{ text: buildSystemPrompt(req) }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: buildUserPrompt(req) },
            { inlineData: { mimeType: req.mimeType, data: req.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        ...(this.useResponseSchema ? { responseSchema: APPRAISAL_RESPONSE_SCHEMA } : {}),
      },
    };

    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (controller.signal.aborted)
        throw new AppraiserError("TIMEOUT", `Gemini : délai dépassé (${this.timeoutMs} ms)`);
      throw new AppraiserError("NETWORK", `Gemini : erreur réseau (${errorMessage(e)})`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const text = await safeText(response);
      throw new AppraiserError("HTTP", `Gemini : HTTP ${response.status}`, {
        status: response.status,
        body: text.slice(0, 2000),
      });
    }

    const json = (await response.json()) as GeminiResponse;
    if (json.promptFeedback?.blockReason) {
      throw new AppraiserError(
        "BLOCKED",
        `Gemini : requête bloquée (${json.promptFeedback.blockReason})`,
      );
    }
    const candidate = json.candidates?.[0];
    const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text.trim()) {
      throw new AppraiserError("EMPTY", "Gemini : réponse vide", {
        finishReason: candidate?.finishReason,
      });
    }

    const raw = parseJsonLoosely(text);
    const parsed = parseAppraisalBody(raw, req.currency);
    return {
      provider: this.name,
      model: this.model,
      latencyMs: Date.now() - started,
      ...parsed,
      listingCopy: req.wantListingCopy ? parsed.listingCopy : null,
    };
  }
}

/** JSON éventuellement entouré de ``` ou de texte : on isole le premier objet complet. */
export function parseJsonLoosely(text: string): unknown {
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
    throw new AppraiserError("INVALID_JSON", "Gemini : JSON invalide", {
      sample: cleaned.slice(0, 300),
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
const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
