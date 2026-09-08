import { describe, expect, it } from "vitest";
import { de, en, flattenKeys, fr, getMessages, hasKey, resolveLocale } from "../src/index.js";

describe("catalogues", () => {
  it("FR et EN ont exactement le même ensemble de clés", () => {
    const frKeys = flattenKeys(fr).sort();
    const enKeys = flattenKeys(en).sort();
    expect(enKeys).toEqual(frKeys);
    expect(frKeys.length).toBeGreaterThan(300);
  });

  it("DE est un sous-ensemble de FR et se complète par le FR", () => {
    const frKeys = new Set(flattenKeys(fr));
    for (const key of flattenKeys(de)) expect(frKeys.has(key), key).toBe(true);
    expect(flattenKeys(getMessages("de")).sort()).toEqual(flattenKeys(fr).sort());
    expect(getMessages("de").nav.stock).toBe("Lager");
    expect(getMessages("de").sales.buyer).toBe(fr.sales.buyer);
  });

  it("aucune valeur vide et accolades équilibrées", () => {
    for (const catalogue of [fr, en]) {
      for (const key of flattenKeys(catalogue)) {
        const value = key
          .split(".")
          .reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], catalogue) as string;
        expect(value.trim().length, key).toBeGreaterThan(0);
        const opens = (value.match(/\{/g) ?? []).length;
        const closes = (value.match(/\}/g) ?? []).length;
        expect(opens, key).toBe(closes);
      }
    }
  });

  it("les paramètres ICU d'une clé sont identiques en FR et en EN", () => {
    const params = (s: string) =>
      [...s.matchAll(/\{\s*([a-zA-Z0-9_]+)\s*[,}]/g)].map((m) => m[1]).sort();
    for (const key of flattenKeys(fr)) {
      const get = (c: object) =>
        key.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], c) as string;
      expect(params(get(en)), key).toEqual(params(get(fr)));
    }
  });

  it("reprend le vocabulaire de la charte", () => {
    expect(fr.chine.addToChine).toBe("Ajouter à la chine");
    expect(fr.dashboard.netMargin).toBe("Marge nette");
    expect(fr.dashboard.goal).toBe("Objectif");
    expect(fr.dashboard.dormant).toBe("Dormant");
    expect(fr.sources.amortized).toBe("Amortie");
    expect(fr.nav).toMatchObject({
      today: "Aujourd'hui",
      chine: "Chiner",
      stock: "Stock",
      sales: "Ventes",
      sources: "Sources",
      settings: "Réglages",
    });
  });

  it("hasKey et resolveLocale", () => {
    expect(hasKey("items.status.SOLD")).toBe(true);
    expect(hasKey("items.status.NOPE")).toBe(false);
    expect(resolveLocale("en-GB,en;q=0.9,fr;q=0.8")).toBe("en");
    expect(resolveLocale("de-CH")).toBe("de");
    expect(resolveLocale("pt-BR")).toBe("fr");
    expect(resolveLocale(null)).toBe("fr");
  });
});
