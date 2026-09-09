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

/** Grilles par défaut (France, 2026). Modifiables par espace de travail. */
export const DEFAULT_FEE_SCHEDULES: Readonly<Record<Platform, FeeSchedule>> = {
  VINTED: {
    percent: 0,
    fixedMinor: 0,
    note: "Aucun frais vendeur ; la protection acheteur est payée par l'acheteur.",
  },
  VESTIAIRE: {
    percent: 15,
    fixedMinor: 0,
    minMinor: 1500,
    note: "Commission vendeur 15 %, minimum 15 €.",
  },
  LEBONCOIN: { percent: 0, fixedMinor: 0, note: "Gratuit hors options de mise en avant." },
  DEPOP: {
    percent: 0,
    fixedMinor: 0,
    note: "Plus de frais vendeur depuis 2024 (frais reportés sur l'acheteur).",
  },
  EBAY: { percent: 12.9, fixedMinor: 30, note: "Frais sur la valeur finale ~12,9 % + 0,30 €." },
  ETSY: { percent: 6.5, fixedMinor: 20, note: "Commission 6,5 % + frais de mise en vente 0,20 €." },
  WHATNOT: { percent: 8, fixedMinor: 0 },
  INSTAGRAM: { percent: 0, fixedMinor: 0 },
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
