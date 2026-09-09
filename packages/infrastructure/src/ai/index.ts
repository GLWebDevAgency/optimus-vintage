/**
 * Fabrique de l'expert IA depuis l'environnement. `APPRAISER_DRIVER` est une liste ordonnée
 * (`anthropic,gemini,openai`) ; `auto` = tous les fournisseurs configurés dans l'ordre
 * anthropic → gemini → openai, puis `fake` hors production. En production, l'expert de
 * démonstration n'entre dans la chaîne que si `APPRAISER_DRIVER` le nomme explicitement.
 */
import type { Appraiser } from "../ports.js";
import {
  AnthropicAppraiser,
  DEFAULT_ANTHROPIC_EFFORT,
  DEFAULT_ANTHROPIC_MODEL,
  isAnthropicEffort,
} from "./AnthropicAppraiser.js";
import {
  type AppraiserAttempt,
  type AppraiserDescription,
  AppraiserRouter,
} from "./AppraiserRouter.js";
import { AppraiserError, DEFAULT_TIMEOUT_MS, type FetchLike } from "./core.js";
import { FakeAppraiser } from "./FakeAppraiser.js";
import { DEFAULT_GEMINI_MODEL, GeminiAppraiser } from "./GeminiAppraiser.js";

export { estimateCostMicroUsd, PRICES_DATED, priceForModel } from "./pricing.js";

import { OpenAIAppraiser } from "./OpenAIAppraiser.js";

export {
  ANTHROPIC_EFFORTS,
  AnthropicAppraiser,
  type AnthropicAppraiserOptions,
  type AnthropicEffort,
  DEFAULT_ANTHROPIC_EFFORT,
  DEFAULT_ANTHROPIC_MODEL,
  isAnthropicEffort,
} from "./AnthropicAppraiser.js";
export {
  type AppraiserAttempt,
  type AppraiserChainEntry,
  type AppraiserDescription,
  AppraiserRouter,
  type AppraiserRouterOptions,
  modelOf,
  shouldFailover,
} from "./AppraiserRouter.js";
export {
  type AppraisalBody,
  parseAppraisalBody,
  parseMoney,
  serializeAppraisalBody,
} from "./appraisal-codec.js";
export {
  ACTIONS,
  APPRAISAL_JSON_SCHEMA,
  type AppraisalOutput,
  AppraisalOutputSchema,
  AppraiserError,
  type AppraiserErrorCode,
  type AppraiserErrorOptions,
  buildPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  DEFAULT_TIMEOUT_MS,
  DEMANDS,
  type DraftMeta,
  type FetchLike,
  isAppraiserError,
  type JsonSchema,
  PROMPT_VERSION,
  type ProviderOptions,
  parseAppraisalOutput,
  parseJsonLoosely,
  TRENDS,
  toAppraiserError,
  toDraft,
  toGeminiSchema,
  withTimeout,
} from "./core.js";
export { FakeAppraiser, type FakeAppraiserOptions } from "./FakeAppraiser.js";
export {
  DEFAULT_GEMINI_MODEL,
  GeminiAppraiser,
  type GeminiAppraiserOptions,
} from "./GeminiAppraiser.js";
export { OpenAIAppraiser, type OpenAIAppraiserOptions } from "./OpenAIAppraiser.js";
export type { Prompt } from "./prompt.js";

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key]?.trim() || undefined;

export const APPRAISER_PROVIDERS = ["anthropic", "gemini", "openai", "fake"] as const;
export type AppraiserProvider = (typeof APPRAISER_PROVIDERS)[number];
const AUTO_ORDER: readonly AppraiserProvider[] = ["anthropic", "gemini", "openai"];

const isProvider = (v: string): v is AppraiserProvider =>
  (APPRAISER_PROVIDERS as readonly string[]).includes(v);

export interface AppraiserPlanEntry {
  readonly provider: AppraiserProvider;
  readonly model: string;
}
export interface AppraiserPlan extends AppraiserDescription {
  readonly chain: readonly AppraiserPlanEntry[];
  readonly timeoutMs: number;
  readonly production: boolean;
}

const modelFor = (env: Env, provider: AppraiserProvider): string => {
  switch (provider) {
    case "anthropic":
      return read(env, "ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
    case "gemini":
      return read(env, "GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL;
    case "openai":
      return read(env, "OPENAI_MODEL") ?? "";
    case "fake":
      return "fake-lacoste-v1";
  }
};

const keyFor = (env: Env, provider: AppraiserProvider): string | undefined =>
  provider === "fake" ? "n/a" : read(env, `${provider.toUpperCase()}_API_KEY`);

/** Un fournisseur est « configuré » quand sa clé (et son modèle pour OpenAI) sont présents. */
const isConfigured = (env: Env, provider: AppraiserProvider): boolean =>
  keyFor(env, provider) !== undefined && modelFor(env, provider) !== "";

/**
 * Résout la chaîne depuis l'environnement, sans instancier de client. Lève `NOT_CONFIGURED`
 * pour un fournisseur nommé explicitement mais sans clé, ou un nom inconnu.
 */
export function resolveAppraiserPlan(env: Env = process.env): AppraiserPlan {
  const production = read(env, "NODE_ENV") === "production";
  const tokens = (read(env, "APPRAISER_DRIVER") ?? "auto")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  const chain: AppraiserProvider[] = [];
  const push = (p: AppraiserProvider): void => {
    if (!chain.includes(p)) chain.push(p);
  };
  for (const token of tokens) {
    if (token === "auto") {
      for (const p of AUTO_ORDER) if (isConfigured(env, p)) push(p);
      if (!production) push("fake");
      continue;
    }
    if (!isProvider(token)) {
      throw new AppraiserError(
        "NOT_CONFIGURED",
        `APPRAISER_DRIVER : fournisseur inconnu « ${token} »`,
      );
    }
    if (!isConfigured(env, token)) {
      const missing =
        token === "openai" && keyFor(env, token) !== undefined
          ? "OPENAI_MODEL"
          : `${token.toUpperCase()}_API_KEY`;
      throw new AppraiserError(
        "NOT_CONFIGURED",
        `APPRAISER_DRIVER=${token} mais ${missing} est vide`,
      );
    }
    push(token);
  }
  const timeoutRaw = Number(read(env, "APPRAISER_TIMEOUT_MS") ?? DEFAULT_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : DEFAULT_TIMEOUT_MS;
  return {
    chain: chain.map((provider) => ({ provider, model: modelFor(env, provider) })),
    fake: chain.includes("fake"),
    timeoutMs,
    production,
  };
}

export interface CreateAppraiserOptions {
  /** Transport injectable (tests) pour tous les fournisseurs distants. */
  readonly fetch?: FetchLike | undefined;
  readonly onAttempt?: ((attempt: AppraiserAttempt) => void) | undefined;
}

function instantiate(
  env: Env,
  entry: AppraiserPlanEntry,
  plan: AppraiserPlan,
  options: CreateAppraiserOptions,
): Appraiser {
  const common = { model: entry.model, timeoutMs: plan.timeoutMs, fetch: options.fetch };
  switch (entry.provider) {
    case "anthropic": {
      const effort = read(env, "ANTHROPIC_EFFORT");
      return new AnthropicAppraiser({
        ...common,
        apiKey: read(env, "ANTHROPIC_API_KEY") ?? "",
        effort: isAnthropicEffort(effort) ? effort : DEFAULT_ANTHROPIC_EFFORT,
      });
    }
    case "gemini":
      return new GeminiAppraiser({ ...common, apiKey: read(env, "GEMINI_API_KEY") ?? "" });
    case "openai":
      return new OpenAIAppraiser({ ...common, apiKey: read(env, "OPENAI_API_KEY") ?? "" });
    case "fake":
      return new FakeAppraiser();
  }
}

/** Expert IA de l'application : un routeur sur la chaîne résolue depuis l'environnement. */
export function createAppraiser(
  env: Env = process.env,
  options: CreateAppraiserOptions = {},
): AppraiserRouter {
  const plan = resolveAppraiserPlan(env);
  return new AppraiserRouter({
    providers: plan.chain.map((entry) => instantiate(env, entry, plan, options)),
    timeoutMs: plan.timeoutMs,
    onAttempt: options.onAttempt,
  });
}

/** Description de la chaîne (pour `/api/health`), sans instancier de client ni exposer de clé. */
export function describeAppraiser(env: Env = process.env): AppraiserDescription {
  const plan = resolveAppraiserPlan(env);
  return { chain: plan.chain, fake: plan.fake };
}
