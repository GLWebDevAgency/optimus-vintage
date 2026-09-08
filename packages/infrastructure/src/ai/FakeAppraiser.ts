/**
 * Expert IA de démonstration : déterministe, sans réseau. Renvoie une expertise plausible
 * (survêtement Lacoste vintage) adaptée à la devise, à la langue et aux indices fournis.
 */
import { CATEGORIES, type Category, Money } from "@chine/domain";
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports.js";

const COPY = {
  fr: {
    title: "Survêtement Lacoste vintage 90s bleu marine — L",
    description:
      "Ensemble survêtement Lacoste authentique des années 90, bleu marine à bandes vertes. Crocodile brodé, fermeture éclair intégrale, coupe droite. Très bon état vintage : légères marques d'usage sur les poignets, aucun trou ni tache. Taille L (voir mesures). Envoi soigné sous 24 h.",
    conditionNotes: ["Légères marques d'usage aux poignets", "Bords-côtes encore élastiques"],
    reasons: [
      "Marque très recherchée en vintage sportswear",
      "Pièce complète (veste + pantalon), plus rare qu'une veste seule",
      "Décote de 60 % sur le prix neuf : marge confortable",
    ],
    tips: [
      "Photographier le crocodile brodé en gros plan",
      "Indiquer les mesures à plat (poitrine, longueur)",
      "Mettre en avant « années 90 » et « ensemble complet » dans le titre",
    ],
    audience: ["Amateurs de sportswear vintage", "Hommes 18-35 ans", "Collectionneurs Lacoste"],
    seasonality: "Demande plus forte de septembre à mars",
    features: [
      "Crocodile brodé d'époque",
      "Étiquette « Devanlay » (années 90)",
      "Ensemble complet",
    ],
  },
  en: {
    title: "Vintage 90s Lacoste navy tracksuit — size L",
    description:
      "Authentic 1990s Lacoste tracksuit, navy with green stripes. Embroidered crocodile, full zip, straight fit. Very good vintage condition: light wear on the cuffs, no holes or stains. Size L (see measurements). Ships within 24h.",
    conditionNotes: ["Light wear on the cuffs", "Ribbing still elastic"],
    reasons: [
      "Highly sought-after brand in vintage sportswear",
      "Full set (jacket + pants), rarer than a jacket alone",
      "60% off retail: comfortable margin",
    ],
    tips: [
      "Shoot a close-up of the embroidered crocodile",
      "List flat measurements (chest, length)",
      "Put “90s” and “full set” in the title",
    ],
    audience: ["Vintage sportswear fans", "Men 18-35", "Lacoste collectors"],
    seasonality: "Demand peaks from September to March",
    features: ["Period embroidered crocodile", "“Devanlay” label (1990s)", "Full set"],
  },
  de: {
    title: "Vintage 90er Lacoste Trainingsanzug marineblau — Gr. L",
    description:
      "Originaler Lacoste Trainingsanzug aus den 90ern, marineblau mit grünen Streifen. Gesticktes Krokodil, durchgehender Reißverschluss, gerader Schnitt. Sehr guter Vintage-Zustand: leichte Gebrauchsspuren an den Bündchen, keine Löcher oder Flecken. Größe L (siehe Maße). Versand innerhalb von 24 h.",
    conditionNotes: ["Leichte Gebrauchsspuren an den Bündchen", "Bündchen noch elastisch"],
    reasons: [
      "Sehr gefragte Marke im Vintage-Sportswear",
      "Komplettes Set (Jacke + Hose), seltener als eine einzelne Jacke",
      "60 % unter Neupreis: komfortable Marge",
    ],
    tips: [
      "Nahaufnahme des gestickten Krokodils fotografieren",
      "Flachmaße angeben (Brust, Länge)",
      "„90er“ und „komplettes Set“ in den Titel setzen",
    ],
    audience: ["Vintage-Sportswear-Fans", "Männer 18-35", "Lacoste-Sammler"],
    seasonality: "Höchste Nachfrage von September bis März",
    features: [
      "Zeitgenössisches gesticktes Krokodil",
      "„Devanlay“-Etikett (1990er)",
      "Komplettes Set",
    ],
  },
} as const;

export interface FakeAppraiserOptions {
  /** Latence simulée rapportée dans `latencyMs` (défaut 42). */
  readonly latencyMs?: number | undefined;
}

export class FakeAppraiser implements Appraiser {
  readonly name = "fake";
  readonly model = "fake-lacoste-v1";
  private readonly latencyMs: number;

  constructor(options: FakeAppraiserOptions = {}) {
    this.latencyMs = options.latencyMs ?? 42;
  }

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    const c = req.currency;
    const copy = COPY[req.locale];
    const brand = req.hints?.brand?.trim() || "Lacoste";
    const category = toCategory(req.hints?.category) ?? "TRACKSUIT";
    const mid = Money.of(45, c);
    const purchase = req.hints?.purchasePriceMinor;
    const maxBuy = Money.of(18, c);
    const action =
      purchase === undefined
        ? "BUY"
        : purchase <= maxBuy.minor
          ? "STRONG_BUY"
          : purchase <= mid.minor / 2
            ? "BUY"
            : purchase <= mid.minor
              ? "CONSIDER"
              : "PASS";

    return {
      provider: this.name,
      model: this.model,
      latencyMs: this.latencyMs,
      identification: {
        brand,
        brandConfidence: 0.92,
        category,
        model: "Tracksuit Devanlay 90s",
        era: "1990s",
        materials: ["polyester", "cotton"],
        colors: ["navy", "green", "white"],
        size: "L",
        condition: "VERY_GOOD",
        conditionNotes: [...copy.conditionNotes],
        isVintage: true,
        notableFeatures: [...copy.features],
      },
      price: {
        low: Money.of(35, c),
        mid,
        high: Money.of(65, c),
        retailNew: Money.of(150, c),
        confidence: 0.78,
        perPlatform: [
          { platform: "VINTED", price: Money.of(49, c), daysToSell: 9 },
          { platform: "DEPOP", price: Money.of(55, c), daysToSell: 14 },
          { platform: "EBAY", price: Money.of(59, c), daysToSell: 21 },
        ],
      },
      market: {
        demand: "HIGH",
        trend: "RISING",
        rarity: 0.55,
        audience: [...copy.audience],
        seasonality: copy.seasonality,
      },
      advice: {
        action,
        maxBuyPrice: maxBuy,
        reasons: [...copy.reasons],
        risk: 0.25,
        sellingTips: [...copy.tips],
      },
      listingCopy: req.wantListingCopy
        ? {
            title: copy.title,
            description: copy.description,
            hashtags: ["#lacoste", "#vintage", "#90s", "#tracksuit", "#sportswear", "#secondhand"],
          }
        : null,
    };
  }
}

function toCategory(hint: string | undefined): Category | undefined {
  if (!hint) return undefined;
  const norm = hint
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return (CATEGORIES as readonly string[]).includes(norm) ? (norm as Category) : undefined;
}
