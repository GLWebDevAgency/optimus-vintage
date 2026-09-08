import { describe, expect, it } from "vitest";
import { checkQuota, hasFeature, minimumPlanFor, planAtLeast } from "../src/index.js";

describe("Plans et quotas", () => {
  it("bloque le plan gratuit au-delà de 60 pièces et propose l'upgrade", () => {
    expect(checkQuota("FREE", "items", 59).allowed).toBe(true);
    const d = checkQuota("FREE", "items", 60);
    expect(d.allowed).toBe(false);
    expect(d.upgradeTo).toBe("PREMIUM");
  });
  it("expose les fonctionnalités par plan", () => {
    expect(hasFeature("FREE", "AI_APPRAISAL")).toBe(false);
    expect(hasFeature("PREMIUM", "AI_APPRAISAL")).toBe(true);
    expect(minimumPlanFor("API_ACCESS")).toBe("PRO");
    expect(planAtLeast("BUSINESS", "PRO")).toBe(true);
  });
});
