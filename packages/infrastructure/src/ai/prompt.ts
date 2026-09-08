/**
 * Prompt de l'expert IA, commun à tous les fournisseurs. Versionné : changer `PROMPT_VERSION`
 * quand le texte évolue, pour tracer quelle version a produit une expertise.
 */
import type { AppraisalRequest } from "../ports.js";

export const PROMPT_VERSION = "2026-09-v2";

const LANGUAGE: Record<AppraisalRequest["locale"], string> = {
  fr: "French",
  en: "English",
  de: "German",
};

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

export interface Prompt {
  /** Instructions système (rôle, langue, devise, format). */
  readonly system: string;
  /** Message utilisateur accompagnant la photo (indices, annonce souhaitée). */
  readonly user: string;
  readonly version: string;
}

/** Prompt complet pour une requête : localisé (fr/en/de), devise, indices, annonce. */
export function buildPrompt(req: AppraisalRequest): Prompt {
  return { system: buildSystemPrompt(req), user: buildUserPrompt(req), version: PROMPT_VERSION };
}
