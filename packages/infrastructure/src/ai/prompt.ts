/**
 * Prompt de l'expert IA. Versionné : changer `PROMPT_VERSION` quand le texte évolue,
 * pour tracer quelle version a produit une expertise.
 */
import { CATEGORIES, CONDITIONS, ERAS, PLATFORMS } from "@chine/domain";
import type { AppraisalRequest } from "../ports.js";

export const PROMPT_VERSION = "2026-09-v1";

const LANGUAGE: Record<AppraisalRequest["locale"], string> = {
  fr: "French",
  en: "English",
  de: "German",
};

/** Schéma JSON attendu (sous-ensemble OpenAPI accepté par Gemini `responseSchema`). */
export const APPRAISAL_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["identification", "price", "market", "advice"],
  properties: {
    identification: {
      type: "OBJECT",
      required: ["brand", "brandConfidence", "category", "era", "condition", "isVintage"],
      properties: {
        brand: { type: "STRING", nullable: true },
        brandConfidence: { type: "NUMBER" },
        category: { type: "STRING", enum: [...CATEGORIES] },
        model: { type: "STRING", nullable: true },
        era: { type: "STRING", enum: [...ERAS] },
        materials: { type: "ARRAY", items: { type: "STRING" } },
        colors: { type: "ARRAY", items: { type: "STRING" } },
        size: { type: "STRING", nullable: true },
        condition: { type: "STRING", enum: [...CONDITIONS] },
        conditionNotes: { type: "ARRAY", items: { type: "STRING" } },
        isVintage: { type: "BOOLEAN" },
        notableFeatures: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
    price: {
      type: "OBJECT",
      required: ["low", "mid", "high", "confidence"],
      properties: {
        low: { type: "NUMBER" },
        mid: { type: "NUMBER" },
        high: { type: "NUMBER" },
        retailNew: { type: "NUMBER", nullable: true },
        confidence: { type: "NUMBER" },
        perPlatform: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            required: ["platform", "price", "daysToSell"],
            properties: {
              platform: { type: "STRING", enum: [...PLATFORMS] },
              price: { type: "NUMBER" },
              daysToSell: { type: "INTEGER" },
            },
          },
        },
      },
    },
    market: {
      type: "OBJECT",
      required: ["demand", "trend", "rarity"],
      properties: {
        demand: { type: "STRING", enum: ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"] },
        trend: { type: "STRING", enum: ["RISING", "STABLE", "DECLINING"] },
        rarity: { type: "NUMBER" },
        audience: { type: "ARRAY", items: { type: "STRING" } },
        seasonality: { type: "STRING", nullable: true },
      },
    },
    advice: {
      type: "OBJECT",
      required: ["action", "risk"],
      properties: {
        action: { type: "STRING", enum: ["STRONG_BUY", "BUY", "CONSIDER", "PASS"] },
        maxBuyPrice: { type: "NUMBER", nullable: true },
        reasons: { type: "ARRAY", items: { type: "STRING" } },
        risk: { type: "NUMBER" },
        sellingTips: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
    listingCopy: {
      type: "OBJECT",
      nullable: true,
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        hashtags: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
  },
} as const;

/** Instructions système : rôle, contraintes, format. */
export function buildSystemPrompt(req: AppraisalRequest): string {
  const language = LANGUAGE[req.locale];
  return [
    "You are a senior second-hand and vintage clothing expert working for professional resellers",
    "(flea markets, wholesale lots, Vinted, Vestiaire Collective, eBay, Depop, Leboncoin).",
    "You identify garments from a photo, estimate resale prices in the European second-hand market,",
    "and give a clear buy/pass recommendation with honest confidence levels.",
    "",
    "Rules:",
    `- Write every free-text field (notes, reasons, tips, listing copy) in ${language}.`,
    `- All amounts are decimal numbers in ${req.currency} (e.g. 24.5), never strings, never other currencies.`,
    "- Use ONLY the enum values listed in the schema for category, era, condition, platform, demand, trend and action.",
    "- Confidence, rarity and risk are numbers between 0 and 1.",
    "- price.low <= price.mid <= price.high; retailNew is the approximate new retail price, or null if unknown.",
    "- perPlatform lists 2 to 4 relevant platforms with a realistic asking price and expected days to sell.",
    "- Prefer 'CONSIDER' or 'PASS' when the brand cannot be read or the condition is poor.",
    "- Never invent a brand: if unsure, set brand to null and brandConfidence below 0.4.",
    "- Return only the JSON object, no prose, no markdown fences.",
  ].join("\n");
}

/** Contexte utilisateur : indices facultatifs et demande d'annonce. */
export function buildUserPrompt(req: AppraisalRequest): string {
  const lines: string[] = ["Analyse this garment photo and produce the appraisal JSON."];
  const h = req.hints;
  if (h?.brand) lines.push(`Hint — brand according to the seller: ${h.brand}.`);
  if (h?.category) lines.push(`Hint — category according to the seller: ${h.category}.`);
  if (h?.purchasePriceMinor !== undefined) {
    const amount = (h.purchasePriceMinor / 100).toFixed(2);
    lines.push(
      `The reseller can buy it for ${amount} ${req.currency}: judge whether it is a good deal at that price.`,
    );
  }
  lines.push(
    req.wantListingCopy
      ? "Also write listingCopy: a catchy title (max 70 chars), a complete description (materials, measurements placeholders, condition, styling) and 5 to 10 hashtags."
      : "Set listingCopy to null.",
  );
  return lines.join("\n");
}
