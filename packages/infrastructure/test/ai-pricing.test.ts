import { describe, expect, it } from "vitest";
import { estimateCostMicroUsd, priceForModel } from "../src/ai/pricing.js";

describe("table de prix des modèles", () => {
  it("retrouve le prix par le plus long préfixe et ignore la casse", () => {
    expect(priceForModel("claude-sonnet-5")).toEqual({ inputPerMTok: 2, outputPerMTok: 10 });
    expect(priceForModel("Claude-Fable-5-1")).toEqual({ inputPerMTok: 10, outputPerMTok: 50 });
    expect(priceForModel("gemini-2.5-flash-lite-preview")?.inputPerMTok).toBe(0.1);
    expect(priceForModel("gpt-6-astra")).toBeNull();
  });

  it("estime le coût en micro-dollars et refuse d'inventer un chiffre", () => {
    // 3 700 jetons d'entrée à 2 $ + 1 500 de sortie à 10 $ ≈ 2,24 centimes.
    expect(estimateCostMicroUsd("claude-sonnet-5", { input: 3700, output: 1500 })).toBe(22_400);
    expect(estimateCostMicroUsd("claude-fable-5-1", { input: 3700, output: 1500 })).toBe(112_000);
    expect(estimateCostMicroUsd("claude-sonnet-5", null)).toBeNull();
    expect(estimateCostMicroUsd("modele-inconnu", { input: 1, output: 1 })).toBeNull();
  });
});
