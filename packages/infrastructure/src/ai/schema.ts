/**
 * Schéma de sortie de l'expert IA : source unique (zod) déclinée en JSON Schema (Anthropic,
 * OpenAI) et en sous-ensemble OpenAPI (Gemini). Les montants sont des nombres décimaux dans
 * la devise de la requête ; les énumérations sont celles du domaine.
 */
import { CATEGORIES, CONDITIONS, ERAS, PLATFORMS } from "@chine/domain";
import { z } from "zod";

export const DEMANDS = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"] as const;
export const TRENDS = ["RISING", "STABLE", "DECLINING"] as const;
export const ACTIONS = ["STRONG_BUY", "BUY", "CONSIDER", "PASS"] as const;

const unitScore = (what: string) => z.number().describe(`${what}, between 0 and 1`);
const amount = (what: string) =>
  z.number().describe(`${what}, decimal amount in the request currency`);

/**
 * JSON exact attendu du modèle. Les montants sont des nombres décimaux dans la devise de la
 * requête ; les énumérations sont celles du domaine. Volontairement sans contraintes numériques
 * (min/max) : toutes les API de sortie structurée ne les acceptent pas, le codec borne ensuite.
 */
export const AppraisalOutputSchema = z.object({
  identification: z.object({
    brand: z.string().nullable().describe("Brand as printed on the label, or null if unreadable"),
    brandConfidence: unitScore("Confidence in the brand"),
    category: z.enum(CATEGORIES),
    model: z.string().nullable().describe("Model or line name, or null"),
    era: z.enum(ERAS),
    materials: z.array(z.string()),
    colors: z.array(z.string()),
    size: z.string().nullable(),
    condition: z.enum(CONDITIONS),
    conditionNotes: z.array(z.string()),
    isVintage: z.boolean(),
    notableFeatures: z.array(z.string()),
  }),
  price: z.object({
    low: amount("Low resale price"),
    mid: amount("Most likely resale price"),
    high: amount("High resale price"),
    retailNew: amount("Approximate new retail price").nullable(),
    confidence: unitScore("Confidence in the estimate"),
    perPlatform: z.array(
      z.object({
        platform: z.enum(PLATFORMS),
        price: amount("Realistic asking price on this platform"),
        daysToSell: z.number().describe("Expected days to sell, integer"),
      }),
    ),
  }),
  market: z.object({
    demand: z.enum(DEMANDS),
    trend: z.enum(TRENDS),
    rarity: unitScore("Rarity"),
    audience: z.array(z.string()),
    seasonality: z.string().nullable(),
  }),
  advice: z.object({
    action: z.enum(ACTIONS),
    maxBuyPrice: amount("Maximum purchase price to keep a margin").nullable(),
    reasons: z.array(z.string()),
    risk: unitScore("Risk of the deal"),
    sellingTips: z.array(z.string()),
  }),
  listingCopy: z
    .object({
      title: z.string(),
      description: z.string(),
      hashtags: z.array(z.string()),
    })
    .nullable(),
});

export type AppraisalOutput = z.infer<typeof AppraisalOutputSchema>;

export type JsonSchema = Record<string, unknown>;

/** JSON Schema (draft 2020-12, sans `$schema`) pour les API qui l'acceptent tel quel. */
export const APPRAISAL_JSON_SCHEMA: JsonSchema = (() => {
  const { $schema: _omit, ...rest } = z.toJSONSchema(AppraisalOutputSchema);
  return rest;
})();

/**
 * Convertit le JSON Schema en sous-ensemble OpenAPI attendu par Gemini (`responseSchema`) :
 * types en majuscules, `nullable` au lieu de l'union avec `null`, sans mots-clés inconnus.
 */
export function toGeminiSchema(schema: JsonSchema): JsonSchema {
  const out: JsonSchema = {};
  let type = schema["type"];
  let nullable = false;
  if (Array.isArray(type)) {
    nullable = type.includes("null");
    type = type.find((t) => t !== "null");
  }
  const anyOf = schema["anyOf"];
  if (Array.isArray(anyOf)) {
    const variants = anyOf.filter((v): v is JsonSchema => isObject(v) && v["type"] !== "null");
    nullable = variants.length < anyOf.length;
    const first = variants[0];
    if (variants.length === 1 && first) return { ...toGeminiSchema(first), nullable };
  }
  if (typeof type === "string") out["type"] = type.toUpperCase();
  if (nullable) out["nullable"] = true;
  for (const key of ["description", "enum", "required"] as const) {
    if (schema[key] !== undefined) out[key] = schema[key];
  }
  const properties = schema["properties"];
  if (isObject(properties)) {
    out["properties"] = Object.fromEntries(
      Object.entries(properties).map(([k, v]) => [k, toGeminiSchema(isObject(v) ? v : {})]),
    );
  }
  const items = schema["items"];
  if (isObject(items)) out["items"] = toGeminiSchema(items);
  return out;
}

const isObject = (v: unknown): v is JsonSchema => typeof v === "object" && v !== null;
