/**
 * Expert IA OpenAI via l'API Responses (`POST /v1/responses`, sans SDK) : image + prompt →
 * JSON strict (`text.format` = json_schema strict), validé puis converti vers le domaine.
 * Aucun modèle par défaut fiable : `OPENAI_MODEL` est obligatoire quand le fournisseur est
 * activé (l'utilisateur vise un identifiant de classe « GPT-6 Astra »).
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
  toDraft,
  withTimeout,
} from "./core.js";

const PROVIDER = "openai";
const MAX_OUTPUT_TOKENS = 8192;

export interface OpenAIAppraiserOptions extends ProviderOptions {
  /** Identifiant du modèle (obligatoire : pas de défaut). */
  readonly model: string;
  readonly baseUrl?: string | undefined;
}

interface OpenAIContentPart {
  type?: string;
  text?: string;
  refusal?: string;
}
interface OpenAIResponse {
  id?: string;
  model?: string;
  status?: "completed" | "incomplete" | "failed" | "in_progress" | "cancelled" | "queued";
  incomplete_details?: { reason?: string } | null;
  error?: { code?: string; message?: string } | null;
  output_text?: string;
  output?: Array<{ type?: string; content?: OpenAIContentPart[] }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export class OpenAIAppraiser implements Appraiser {
  readonly name = PROVIDER;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: OpenAIAppraiserOptions) {
    if (!options.model.trim()) {
      throw new AppraiserError("NOT_CONFIGURED", "OpenAI : OPENAI_MODEL est obligatoire", {
        provider: PROVIDER,
      });
    }
    this.apiKey = options.apiKey;
    this.model = options.model.trim();
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    const started = Date.now();
    const prompt = buildPrompt(req);
    const body = {
      model: this.model,
      instructions: prompt.system,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:${req.mimeType};base64,${req.imageBase64}`,
              detail: "high",
            },
            { type: "input_text", text: prompt.user },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "appraisal",
          strict: true,
          schema: APPRAISAL_JSON_SCHEMA,
        },
      },
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
    };

    const response = await withTimeout(
      async (signal) => {
        try {
          return await this.fetchImpl(`${this.baseUrl}/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
            signal,
          });
        } catch (e) {
          if (signal.aborted) throw e;
          throw new AppraiserError(
            "UPSTREAM_ERROR",
            `OpenAI : erreur réseau (${errorMessage(e)})`,
            { retryable: true, provider: PROVIDER, cause: e },
          );
        }
      },
      this.timeoutMs,
      PROVIDER,
    );

    if (!response.ok) throw await httpError(response);
    const json = await readJson(response);
    const text = extractText(json);

    if (json.status === "failed" || json.error) {
      throw new AppraiserError(
        "UPSTREAM_ERROR",
        `OpenAI : réponse en échec (${json.error?.message ?? json.error?.code ?? "n/a"})`,
        { retryable: true, provider: PROVIDER, details: { error: json.error ?? null } },
      );
    }
    if (text.refusal !== undefined) {
      throw new AppraiserError("REFUSED", `OpenAI : requête refusée (${text.refusal})`, {
        provider: PROVIDER,
        details: { refusal: text.refusal },
      });
    }
    if (json.status === "incomplete") {
      const reason = json.incomplete_details?.reason ?? "unknown";
      throw new AppraiserError(
        reason === "content_filter" ? "REFUSED" : "INVALID_OUTPUT",
        `OpenAI : réponse incomplète (${reason})`,
        { provider: PROVIDER, details: { reason } },
      );
    }
    if (!text.text.trim()) {
      throw new AppraiserError("INVALID_OUTPUT", "OpenAI : réponse vide", {
        provider: PROVIDER,
        details: { status: json.status ?? null },
      });
    }
    let raw: unknown;
    try {
      raw = JSON.parse(text.text);
    } catch (e) {
      throw new AppraiserError("INVALID_OUTPUT", "OpenAI : JSON invalide", {
        provider: PROVIDER,
        details: { sample: text.text.slice(0, 300) },
        cause: e,
      });
    }
    const parsed = parseAppraisalOutput(raw, PROVIDER);
    return toDraft(parsed, {
      provider: PROVIDER,
      model: json.model ?? this.model,
      tokens:
        json.usage?.input_tokens === undefined
          ? null
          : { input: json.usage.input_tokens, output: json.usage.output_tokens ?? 0 },
      latencyMs: Date.now() - started,
      currency: req.currency,
      wantListingCopy: req.wantListingCopy ?? false,
    });
  }
}

/** `output_text` (SDK) ou concaténation des parties `output_text` du premier message. */
function extractText(json: OpenAIResponse): { text: string; refusal?: string } {
  const parts = (json.output ?? [])
    .filter((o) => o.type === "message" || o.type === undefined)
    .flatMap((o) => o.content ?? []);
  const refusal = parts.find((p) => p.type === "refusal")?.refusal;
  if (refusal !== undefined) return { text: "", refusal };
  const text =
    json.output_text ??
    parts
      .filter((p) => p.type === "output_text" || p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  return { text };
}

async function httpError(response: Response): Promise<AppraiserError> {
  const status = response.status;
  const body = (await safeText(response)).slice(0, 2000);
  const details = { status, body };
  if (status === 429) {
    return new AppraiserError("RATE_LIMITED", "OpenAI : limite de débit (HTTP 429)", {
      provider: PROVIDER,
      details,
    });
  }
  return new AppraiserError("UPSTREAM_ERROR", `OpenAI : HTTP ${status}`, {
    retryable: status >= 500 || status === 408,
    provider: PROVIDER,
    details,
  });
}

async function readJson(response: Response): Promise<OpenAIResponse> {
  try {
    return (await response.json()) as OpenAIResponse;
  } catch (e) {
    if (isAppraiserError(e)) throw e;
    throw new AppraiserError("INVALID_OUTPUT", "OpenAI : corps de réponse illisible", {
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
