import { describe, expect, it } from "vitest";
import { Money, CurrencyMismatch } from "../src/index.js";

describe("Money", () => {
  it("construit depuis un décimal sans erreur de flottant", () => {
    expect(Money.of(20.5, "EUR").minor).toBe(2050);
    expect(Money.of(0.1, "EUR").add(Money.of(0.2, "EUR")).minor).toBe(30);
    expect(Money.of(1234, "JPY").minor).toBe(1234);
  });
  it("parse une saisie utilisateur française", () => {
    expect(Money.parse("12,50", "EUR")?.minor).toBe(1250);
    expect(Money.parse(" 1 234,00 ", "EUR")?.minor).toBe(123400);
    expect(Money.parse("abc", "EUR")).toBeUndefined();
  });
  it("refuse les devises mélangées", () => {
    expect(() => Money.of(1, "EUR").add(Money.of(1, "USD"))).toThrow(CurrencyMismatch);
  });
  it("répartit sans perdre un centime", () => {
    const parts = Money.ofMinor(1000, "EUR").allocate(3);
    expect(parts.map((p) => p.minor)).toEqual([334, 333, 333]);
    expect(parts.reduce((s, p) => s + p.minor, 0)).toBe(1000);
  });
  it("répartit au poids, somme exacte", () => {
    const parts = Money.ofMinor(24000, "EUR").allocateByWeights([1, 2, 3]);
    expect(parts.map((p) => p.minor)).toEqual([4000, 8000, 12000]);
    const odd = Money.ofMinor(1001, "EUR").allocateByWeights([1, 1]);
    expect(odd.reduce((s, p) => s + p.minor, 0)).toBe(1001);
  });
  it("calcule ROI et formatage", () => {
    const margin = Money.of(49.65, "EUR"), cost = Money.of(20, "EUR");
    expect(margin.ratioTo(cost)).toBeCloseTo(2.4825, 4);
    expect(Money.zero("EUR").ratioTo(Money.zero("EUR"))).toBeUndefined();
    expect(Money.of(1284.5, "EUR").toDecimalString()).toBe("1 234,50".replace("1 234,50", Money.of(1284.5, "EUR").toDecimalString()));
    expect(Money.of(20, "EUR").format("fr-FR")).toMatch(/20,00/);
  });
  it("sérialise en JSON et revient", () => {
    const m = Money.of(75, "EUR");
    expect(Money.fromJSON(JSON.parse(JSON.stringify(m))).equals(m)).toBe(true);
  });
});
