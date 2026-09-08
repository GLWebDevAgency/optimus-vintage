import { describe, expect, it } from "vitest";

/** Intl émet des espaces insécables (U+202F, U+00A0) : on compare en espaces simples. */
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");

import {
  daysBetween,
  formatDate,
  formatMoney,
  formatMoneyParts,
  formatNumber,
  formatPercent,
  formatRelative,
  toMinor,
} from "../src/index.js";

const eur = (minor: number) => ({ minor, currency: "EUR" });

describe("formatMoney", () => {
  it("formate en fr et en en", () => {
    expect(plain(formatMoney(eur(128_450), "fr"))).toBe("1 284,50 €");
    expect(plain(formatMoney(eur(128_450), "en"))).toBe("€1,284.50");
    expect(plain(formatMoney({ minor: 1500, currency: "JPY" }, "en"))).toMatch(/¥1,500$/);
  });
  it("compact retire les décimales des montants ronds", () => {
    expect(plain(formatMoney(eur(7500), "fr", { compact: true }))).toBe("75 €");
    expect(plain(formatMoney(eur(4965), "fr", { compact: true }))).toBe("49,65 €");
  });
  it("signe et sans symbole pour les reçus", () => {
    expect(plain(formatMoney(eur(4965), "fr", { signDisplay: "always", symbol: false }))).toBe(
      "+49,65",
    );
    expect(plain(formatMoney(eur(-495), "fr", { symbol: false }))).toBe("-4,95");
  });
  it("découpe en morceaux pour la typographie hero", () => {
    const p = formatMoneyParts(eur(128_450), "fr");
    expect({ ...p, integer: plain(p.integer) }).toMatchObject({
      sign: "",
      integer: "1 284",
      fraction: ",50",
      symbol: "€",
    });
    expect(formatMoneyParts(eur(7500), "fr", { compact: true }).fraction).toBe("");
    expect(formatMoneyParts(eur(-320), "fr", { signDisplay: "always" }).sign).toBe("-");
  });
  it("toMinor arrondit correctement", () => {
    expect(toMinor(20.5, "EUR")).toBe(2050);
    expect(toMinor(0.1 + 0.2, "EUR")).toBe(30);
    expect(toMinor(1500, "JPY")).toBe(1500);
  });
});

describe("dates", () => {
  const d = new Date(2026, 8, 7, 9, 41);
  it("formatDate selon le style", () => {
    expect(plain(formatDate(d, "fr"))).toBe("7 sept. 2026");
    expect(plain(formatDate("2026-09-07", "fr", "weekday"))).toMatch(/^lun\. 7 sept\.$/);
    expect(plain(formatDate(d, "fr", "monthYear"))).toBe("septembre 2026");
    expect(plain(formatDate(d, "en", "long"))).toBe("7 September 2026");
    expect(plain(formatDate("nope", "fr"))).toBe("");
  });
  it("formatRelative parle comme un humain", () => {
    const now = new Date(2026, 8, 7, 12, 0);
    expect(plain(formatRelative(new Date(2026, 8, 6, 12, 0), "fr", now))).toBe("hier");
    expect(plain(formatRelative(new Date(2026, 8, 4, 12, 0), "fr", now))).toBe("il y a 3 j");
    expect(plain(formatRelative(new Date(2026, 8, 7, 11, 58), "en", now))).toBe("2 min ago");
    expect(plain(formatRelative(new Date(2026, 8, 7, 12, 0, 10), "fr", now))).toBe("maintenant");
    expect(plain(formatRelative(new Date(2026, 6, 1), "en", now))).toMatch(/^2 mo\.? ago$/);
  });
  it("daysBetween compte des jours calendaires", () => {
    expect(daysBetween(new Date(2026, 7, 31, 23, 0), new Date(2026, 8, 7, 1, 0))).toBe(7);
  });
});

describe("pourcentages et nombres", () => {
  it("formatPercent", () => {
    expect(plain(formatPercent(0.64, "fr"))).toBe("64 %");
    expect(plain(formatPercent(2.4825, "fr", { signed: true }))).toBe("+248 %");
    expect(plain(formatPercent(-0.7, "en", { signed: true }))).toBe("-70%");
    expect(plain(formatPercent(0, "fr", { signed: true }))).toBe("0 %");
    expect(plain(formatPercent(Number.NaN, "fr"))).toBe("—");
  });
  it("formatNumber", () => {
    expect(plain(formatNumber(1284.5, "fr"))).toBe("1 284,5");
    expect(plain(formatNumber(142, "en", { signed: true }))).toBe("+142");
  });
});
