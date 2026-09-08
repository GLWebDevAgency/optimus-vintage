import type { Appraiser } from "../ports.js";
import { FakeAppraiser } from "./FakeAppraiser.js";
import { DEFAULT_GEMINI_MODEL, GeminiAppraiser } from "./GeminiAppraiser.js";

export {
  type AppraisalBody,
  parseAppraisalBody,
  parseMoney,
  serializeAppraisalBody,
} from "./appraisal-codec.js";
export { FakeAppraiser, type FakeAppraiserOptions } from "./FakeAppraiser.js";
export {
  AppraiserError,
  DEFAULT_GEMINI_MODEL,
  type FetchLike,
  GeminiAppraiser,
  type GeminiAppraiserOptions,
  parseJsonLoosely,
} from "./GeminiAppraiser.js";
export {
  APPRAISAL_RESPONSE_SCHEMA,
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_VERSION,
} from "./prompt.js";

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key]?.trim() || undefined;

export type AppraiserDriver = "auto" | "gemini" | "fake";

/** `APPRAISER_DRIVER=auto|gemini|fake` — `auto` choisit Gemini si `GEMINI_API_KEY` est défini. */
export function createAppraiser(env: Env = process.env): Appraiser {
  const driver = (read(env, "APPRAISER_DRIVER") ?? "auto") as AppraiserDriver;
  const apiKey = read(env, "GEMINI_API_KEY");
  if (driver === "gemini" || (driver === "auto" && apiKey)) {
    if (!apiKey) throw new Error("APPRAISER_DRIVER=gemini mais GEMINI_API_KEY est vide");
    return new GeminiAppraiser({
      apiKey,
      model: read(env, "GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL,
    });
  }
  return new FakeAppraiser();
}
