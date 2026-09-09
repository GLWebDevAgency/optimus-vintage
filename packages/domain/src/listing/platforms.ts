import type { Currency } from "../money/currency.js";
import { Money } from "../money/money.js";

export const PLATFORMS = [
  "VINTED",
  "VESTIAIRE",
  "LEBONCOIN",
  "DEPOP",
  "EBAY",
  "ETSY",
  "WHATNOT",
  "INSTAGRAM",
  "IN_PERSON",
  "OTHER",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Readonly<Record<Platform, string>> = {
  VINTED: "Vinted",
  VESTIAIRE: "Vestiaire Collective",
  LEBONCOIN: "Leboncoin",
  DEPOP: "Depop",
  EBAY: "eBay",
  ETSY: "Etsy",
  WHATNOT: "Whatnot",
  INSTAGRAM: "Instagram",
  IN_PERSON: "En main propre",
  OTHER: "Autre",
};

/**
 * Grille de frais vendeur d'une plateforme. Données, pas code : on met à jour une grille
 * sans toucher au calcul (Open/Closed). `percent` sur le brut, `fixed` par vente, `min` plancher.
 */
export interface FeeSchedule {
  readonly percent: number;
  readonly fixedMinor: number;
  readonly minMinor?: number;
  readonly note?: string;
}

/**
 * Grilles par défaut (France, particuliers, septembre 2026). Modifiables par espace de travail.
 * Les vendeurs professionnels (Vinted Pro, eBay pro…) ajustent leur grille dans les réglages.
 */
export const DEFAULT_FEE_SCHEDULES: Readonly<Record<Platform, FeeSchedule>> = {
  VINTED: {
    percent: 0,
    fixedMinor: 0,
    note: "Aucun frais vendeur (la protection acheteur est payée par l'acheteur). Vinted Pro : 5 % + 0,30 € par article, à régler ici.",
  },
  VESTIAIRE: {
    percent: 20,
    fixedMinor: 0,
    minMinor: 1500,
    note: "Depuis juin 2026 : 17 % de commission + 3 % de traitement ; sous 75 €, forfait 12 € + 3 €.",
  },
  LEBONCOIN: {
    percent: 0,
    fixedMinor: 0,
    note: "Gratuit hors options de mise en avant ; le paiement sécurisé est facturé à l'acheteur.",
  },
  DEPOP: {
    percent: 13.3,
    fixedMinor: 45,
    note: "Hors UK/US : 10 % de commission + traitement du paiement (≈ 3,3 % + 0,45 €).",
  },
  EBAY: {
    percent: 0,
    fixedMinor: 0,
    note: "Particuliers de l'EEE : plus de frais de vente depuis septembre 2026 (protection acheteur payée par l'acheteur). Pro : ≈ 12,9 % + 0,35 €, à régler ici.",
  },
  ETSY: {
    percent: 10.9,
    fixedMinor: 47,
    note: "6,5 % de transaction + 4 % + 0,30 € de paiement + 0,17 € de mise en vente + frais réglementaires.",
  },
  WHATNOT: {
    percent: 10.9,
    fixedMinor: 30,
    note: "UE : 6,67 % HT de commission (8 % TTC) + 2,9 % + 0,30 € de paiement.",
  },
  INSTAGRAM: {
    percent: 0,
    fixedMinor: 0,
    note: "Vente directe : frais du moyen de paiement à ajouter.",
  },
  IN_PERSON: { percent: 0, fixedMinor: 0 },
  OTHER: { percent: 0, fixedMinor: 0 },
};

/** Politique de frais : stratégie interchangeable (SOLID). */
export interface PlatformFeePolicy {
  feesFor(platform: Platform, gross: Money): Money;
}

export class ScheduleFeePolicy implements PlatformFeePolicy {
  constructor(
    private readonly schedules: Readonly<Record<Platform, FeeSchedule>> = DEFAULT_FEE_SCHEDULES,
  ) {}

  static withOverrides(overrides: Partial<Record<Platform, FeeSchedule>>): ScheduleFeePolicy {
    return new ScheduleFeePolicy({ ...DEFAULT_FEE_SCHEDULES, ...overrides });
  }

  scheduleFor(platform: Platform): FeeSchedule {
    return this.schedules[platform];
  }

  feesFor(platform: Platform, gross: Money): Money {
    const s = this.schedules[platform];
    if (gross.isZero || gross.isNegative) return Money.zero(gross.currency);
    let fees = gross.percent(s.percent).add(Money.ofMinor(s.fixedMinor, gross.currency));
    if (s.minMinor !== undefined) fees = fees.max(Money.ofMinor(s.minMinor, gross.currency));
    return fees.min(gross);
  }
}

export const zeroFees = (currency: Currency): Money => Money.zero(currency);
