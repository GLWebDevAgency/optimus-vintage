import { Money } from "@chine/domain";
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../ports/index.js";

/** Expertise déterministe : un survêtement Lacoste des années 90 (60 / 75 / 85, neuf 250). */
export class FakeAppraiser implements Appraiser {
  readonly name = "fake";
  readonly requests: AppraisalRequest[] = [];

  async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
    this.requests.push(req);
    const c = req.currency;
    const brand = req.hints?.brand ?? "Lacoste";
    return {
      provider: "fake",
      model: "fake-1",
      identification: {
        brand,
        brandConfidence: 0.92,
        category: "TRACKSUIT",
        model: "Survêtement vintage crocodile",
        era: "1990s",
        materials: ["polyester", "coton"],
        colors: ["bleu marine", "vert"],
        size: "L",
        condition: "VERY_GOOD",
        conditionNotes: ["Légère usure au col"],
        isVintage: true,
        notableFeatures: ["Logo crocodile brodé", "Made in France"],
      },
      price: {
        low: Money.of(60, c),
        mid: Money.of(75, c),
        high: Money.of(85, c),
        retailNew: Money.of(250, c),
        confidence: 0.8,
        perPlatform: [
          { platform: "VINTED", price: Money.of(75, c), daysToSell: 12 },
          { platform: "VESTIAIRE", price: Money.of(95, c), daysToSell: 30 },
          { platform: "EBAY", price: Money.of(80, c), daysToSell: 20 },
        ],
      },
      market: {
        demand: "HIGH",
        trend: "RISING",
        rarity: 0.6,
        audience: ["streetwear", "vintage 90s"],
        seasonality: "Automne / hiver",
      },
      advice: {
        action: "BUY",
        maxBuyPrice: Money.of(35, c),
        reasons: ["Marque recherchée", "Bon état"],
        risk: 0.2,
        sellingTips: ["Photographier le logo de près", "Indiquer les mesures à plat"],
      },
      listingCopy: req.wantListingCopy
        ? {
            title: `Survêtement ${brand} vintage 90s taille L`,
            description:
              "Survêtement Lacoste vintage des années 90, très bon état, logo crocodile brodé.",
            hashtags: ["#lacoste", "#vintage", "#90s"],
          }
        : null,
      latencyMs: 0,
    };
  }
}
