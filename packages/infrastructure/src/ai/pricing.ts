/**
 * Prix publics des modèles (USD par million de jetons), pour estimer le coût d'une action IA à
 * partir des jetons rapportés par le fournisseur. Table datée : à rafraîchir quand un fournisseur
 * change ses tarifs ; un modèle inconnu donne `null` plutôt qu'un chiffre inventé.
 *
 * Sources : platform.claude.com/docs/en/about-claude/pricing (septembre 2026) ; Gemini et OpenAI
 * d'après leurs pages de tarifs publiques (à vérifier à chaque mise à jour de modèle).
 */
import type { AiTokenUsage } from "@chine/domain";

export const PRICES_DATED = "2026-09-09";

interface ModelPrice {
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
}

/** Préfixes d'identifiant de modèle → prix. Le plus long préfixe correspondant l'emporte. */
const PRICES: ReadonlyArray<readonly [prefix: string, price: ModelPrice]> = [
  ["claude-fable-5-1", { inputPerMTok: 10, outputPerMTok: 50 }],
  ["claude-fable-5", { inputPerMTok: 10, outputPerMTok: 50 }],
  ["claude-mythos-5", { inputPerMTok: 10, outputPerMTok: 50 }],
  ["claude-opus-5", { inputPerMTok: 5, outputPerMTok: 25 }],
  ["claude-opus-4", { inputPerMTok: 5, outputPerMTok: 25 }],
  ["claude-sonnet-5", { inputPerMTok: 2, outputPerMTok: 10 }],
  ["claude-sonnet-4", { inputPerMTok: 3, outputPerMTok: 15 }],
  ["claude-haiku-4-5", { inputPerMTok: 1, outputPerMTok: 5 }],
  ["gemini-2.5-flash-lite", { inputPerMTok: 0.1, outputPerMTok: 0.4 }],
  ["gemini-2.5-flash", { inputPerMTok: 0.3, outputPerMTok: 2.5 }],
  ["gemini-2.5-pro", { inputPerMTok: 1.25, outputPerMTok: 10 }],
];

export function priceForModel(model: string): ModelPrice | null {
  const id = model.trim().toLowerCase();
  let best: (typeof PRICES)[number] | undefined;
  for (const entry of PRICES) {
    if (id.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) best = entry;
  }
  return best ? best[1] : null;
}

/**
 * Coût estimé en micro-dollars (1 000 000 = 1 $) d'après les jetons facturés. `null` si le modèle
 * est inconnu ou les jetons absents. Ne tient pas compte du cache ni du mode batch.
 */
export function estimateCostMicroUsd(model: string, tokens: AiTokenUsage | null): number | null {
  if (!tokens) return null;
  const price = priceForModel(model);
  if (!price) return null;
  return Math.round(tokens.input * price.inputPerMTok + tokens.output * price.outputPerMTok);
}
