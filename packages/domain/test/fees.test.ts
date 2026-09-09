import { describe, expect, it } from "vitest";
import { Money, priceForTargetMargin, ScheduleFeePolicy, simulatePrice } from "../src/index.js";

const policy = new ScheduleFeePolicy();
const eur = (n: number) => Money.of(n, "EUR");

describe("Grilles de frais par plateforme", () => {
  it("Vinted FR : zéro frais vendeur", () => {
    expect(policy.feesFor("VINTED", eur(75)).isZero).toBe(true);
  });
  it("Vestiaire (juin 2026) : 17 % + 3 % de traitement, forfait 15 € sous 75 €", () => {
    expect(policy.feesFor("VESTIAIRE", eur(200)).minor).toBe(4000);
    expect(policy.feesFor("VESTIAIRE", eur(75)).minor).toBe(1500);
    expect(policy.feesFor("VESTIAIRE", eur(50)).minor).toBe(1500);
    expect(policy.feesFor("VESTIAIRE", eur(10)).minor).toBe(1000); // jamais plus que le brut
  });
  it("eBay particuliers (sept. 2026) : zéro frais ; Etsy : pourcentage + fixe", () => {
    expect(policy.feesFor("EBAY", eur(100)).isZero).toBe(true);
    expect(policy.feesFor("ETSY", eur(100)).minor).toBe(1090 + 47);
  });
  it("les grilles sont surchargeables par espace de travail", () => {
    const custom = ScheduleFeePolicy.withOverrides({ VINTED: { percent: 5, fixedMinor: 70 } });
    expect(custom.feesFor("VINTED", eur(100)).minor).toBe(570);
  });
});

describe("Simulation de prix", () => {
  it("Lacoste 20 € → 75 € sur Vinted, port 4,95 : marge 50,05", () => {
    const s = simulatePrice("VINTED", eur(75), eur(20), policy, eur(4.95));
    expect(s.net.minor).toBe(7005);
    expect(s.margin.minor).toBe(5005);
    expect(s.roi).toBeCloseTo(2.5025, 4);
  });
  it("trouve le prix affiché pour une marge cible frais compris", () => {
    const p = priceForTargetMargin("ETSY", eur(20), eur(30), policy);
    const check = simulatePrice("ETSY", p, eur(20), policy);
    expect(check.margin.minor).toBeGreaterThanOrEqual(3000);
    expect(check.margin.minor).toBeLessThan(3100);
  });
});
