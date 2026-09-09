import { describe, expect, it } from "vitest";
import {
  AI_CREDIT_COST,
  checkQuota,
  hasFeature,
  INF,
  minimumPlanFor,
  overQuotaBy,
  PLAN_LIMITS,
  PLAN_PRICES_EUR,
  PLANS,
  PURCHASABLE_PLANS,
  planAtLeast,
  yearlyPerMonthMinor,
  yearlySavingMinor,
} from "../src/index.js";

describe("Plans et quotas", () => {
  it("bloque le plan gratuit au-delà de 50 pièces en stock et propose le premier plan achetable", () => {
    expect(checkQuota("FREE", "items", 49).allowed).toBe(true);
    const d = checkQuota("FREE", "items", 50);
    expect(d.allowed).toBe(false);
    expect(d.limit).toBe(50);
    expect(d.upgradeTo).toBe("PREMIUM");
  });

  it("propose Pro quand Chineur ne suffit plus, jamais Atelier (liste d'attente)", () => {
    expect(checkQuota("PREMIUM", "items", 500).upgradeTo).toBe("PRO");
    expect(checkQuota("PRO", "aiCreditsPerMonth", 300).upgradeTo).toBeUndefined();
    expect(PURCHASABLE_PLANS).toEqual(["PREMIUM", "PRO"]);
  });

  it("les plans illimités acceptent toute consommation", () => {
    expect(checkQuota("PRO", "items", 1_000_000)).toEqual({
      allowed: true,
      used: 1_000_000,
      limit: INF,
    });
    expect(checkQuota("PREMIUM", "sourcesPerMonth", 40).allowed).toBe(true);
  });

  it("l'expertise IA existe dès le plan gratuit, avec un quota mensuel", () => {
    expect(hasFeature("FREE", "AI_APPRAISAL")).toBe(true);
    expect(PLAN_LIMITS.FREE.aiCreditsPerMonth).toBe(10);
    expect(hasFeature("FREE", "AI_LISTING_COPY")).toBe(false);
    expect(minimumPlanFor("AI_LISTING_COPY")).toBe("PREMIUM");
    expect(minimumPlanFor("QR_LABELS")).toBe("PRO");
    expect(minimumPlanFor("MULTI_USER")).toBe("BUSINESS");
    expect(planAtLeast("BUSINESS", "PRO")).toBe(true);
  });

  it("chaque plan supérieur inclut les fonctionnalités et limites du plan précédent", () => {
    for (let i = 1; i < PLANS.length; i++) {
      const lower = PLAN_LIMITS[PLANS[i - 1] as (typeof PLANS)[number]];
      const upper = PLAN_LIMITS[PLANS[i] as (typeof PLANS)[number]];
      for (const f of lower.features) expect(upper.features.has(f)).toBe(true);
      expect(upper.maxItems).toBeGreaterThanOrEqual(lower.maxItems);
      expect(upper.aiCreditsPerMonth).toBeGreaterThanOrEqual(lower.aiCreditsPerMonth);
    }
  });

  it("les prix sont des entiers en centimes et l'annuel offre une remise", () => {
    for (const p of PLANS) {
      expect(Number.isInteger(PLAN_PRICES_EUR[p].monthlyMinor)).toBe(true);
      expect(Number.isInteger(PLAN_PRICES_EUR[p].yearlyMinor)).toBe(true);
    }
    expect(PLAN_PRICES_EUR.PREMIUM).toEqual({ monthlyMinor: 699, yearlyMinor: 5_900 });
    expect(yearlyPerMonthMinor("PREMIUM")).toBe(492);
    expect(yearlySavingMinor("PREMIUM")).toBe(699 * 12 - 5_900);
    expect(yearlySavingMinor("PRO")).toBeGreaterThan(0);
  });

  it("mesure le dépassement après rétrogradation", () => {
    expect(overQuotaBy("FREE", "items", 120)).toBe(70);
    expect(overQuotaBy("FREE", "items", 12)).toBe(0);
    expect(overQuotaBy("PRO", "items", 12_000)).toBe(0);
  });
});

describe("crédits IA", () => {
  it("aucun plan n'offre de crédits illimités : le coût d'inférence est réel", () => {
    for (const p of PLANS) expect(Number.isFinite(PLAN_LIMITS[p].aiCreditsPerMonth)).toBe(true);
  });

  it("une action à plusieurs crédits est refusée dès que le solde ne la couvre plus", () => {
    const cost = AI_CREDIT_COST.PHOTO_STUDIO;
    expect(cost).toBeGreaterThan(AI_CREDIT_COST.APPRAISAL);
    expect(checkQuota("FREE", "aiCreditsPerMonth", 10 - cost, cost).allowed).toBe(true);
    const d = checkQuota("FREE", "aiCreditsPerMonth", 10 - cost + 1, cost);
    expect(d.allowed).toBe(false);
    expect(d.upgradeTo).toBe("PREMIUM");
  });
});
