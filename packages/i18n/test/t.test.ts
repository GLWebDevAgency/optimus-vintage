import { describe, expect, it } from "vitest";

/** Intl émet des espaces insécables (U+202F, U+00A0) : on compare en espaces simples. */
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");

import { createT, interpolate, translate } from "../src/index";

describe("t()", () => {
  const t = createT("fr");
  const tEn = createT("en");

  it("traduit une clé simple et une clé d'énumération", () => {
    expect(t("nav.today")).toBe("Aujourd'hui");
    expect(t("items.status.SOLD")).toBe("Vendue");
    expect(tEn("items.status.SOLD")).toBe("Sold");
    expect(translate("de", "nav.stock")).toBe("Lager");
  });

  it("interpole les paramètres", () => {
    expect(t("dashboard.goalOf", { amount: "2 000 €" })).toBe("Objectif 2 000 €");
    expect(t("auth.magicLinkSent", { email: "lina@ex.fr" })).toBe(
      "Lien envoyé à lina@ex.fr. Ouvre-le sur ce téléphone.",
    );
  });

  it("gère le pluriel (one / other / =0) avec # formaté", () => {
    expect(t("common.pieces", { count: 0 })).toBe("aucune pièce");
    expect(t("common.pieces", { count: 1 })).toBe("1 pièce");
    expect(plain(t("common.pieces", { count: 1284 }))).toBe("1 284 pièces");
    expect(tEn("common.pieces", { count: 2 })).toBe("2 pieces");
    expect(tEn("common.pieces", { count: 1 })).toBe("1 piece");
  });

  it("gère les pluriels imbriqués avec d'autres paramètres", () => {
    expect(t("dashboard.dormantHint", { count: 12, days: 30 })).toBe(
      "12 pièces dorment depuis plus de 30 jours",
    );
    expect(t("sources.soldAndStock", { sold: 1, stock: 5 })).toBe("1 vendue · 5 en stock");
  });

  it("laisse un paramètre manquant visible et ignore les accolades orphelines", () => {
    expect(interpolate("Bonjour {name}", {}, "fr-FR")).toBe("Bonjour {name}");
    expect(interpolate("a { b", { b: 1 }, "fr-FR")).toBe("a { b");
  });

  it("supporte select, number et date", () => {
    expect(interpolate("{k, select, LOT{un lot} other{autre}}", { k: "LOT" }, "fr-FR")).toBe(
      "un lot",
    );
    expect(interpolate("{k, select, LOT{un lot} other{autre}}", { k: "UNIT" }, "fr-FR")).toBe(
      "autre",
    );
    expect(plain(interpolate("{n, number}", { n: 1234.5 }, "fr-FR"))).toBe("1 234,5");
    expect(interpolate("{d, date}", { d: new Date(2026, 8, 7) }, "en-GB")).toBe("7 Sept 2026");
  });
});
