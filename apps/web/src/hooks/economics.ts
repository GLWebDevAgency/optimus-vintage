import type { FeeScheduleDto, MoneyDto, Platform, SaleEconomicsDto } from "@chine/contract";
import { DEFAULT_FEE_SCHEDULES, type FeeSchedule } from "@chine/domain";

/** Grilles effectives : défaut + surcharges de l'espace de travail. */
export function effectiveSchedules(
  overrides?: Partial<Record<Platform, FeeScheduleDto | null | undefined>>,
): Record<Platform, FeeSchedule> {
  const out = { ...DEFAULT_FEE_SCHEDULES } as Record<Platform, FeeSchedule>;
  if (overrides) {
    for (const [p, s] of Object.entries(overrides) as [Platform, FeeScheduleDto | null][]) {
      if (s) out[p] = s;
    }
  }
  return out;
}

const money = (minor: number, currency: string): MoneyDto => ({ minor, currency }) as MoneyDto;

/** Frais vendeur d'une plateforme pour un prix brut (pourcentage + fixe, minimum, plafonné au brut). */
export function feesFor(gross: MoneyDto, schedule: FeeSchedule): MoneyDto {
  if (gross.minor <= 0) return money(0, gross.currency);
  let fees = Math.round((gross.minor * schedule.percent) / 100) + schedule.fixedMinor;
  if (schedule.minMinor !== undefined) fees = Math.max(fees, schedule.minMinor);
  return money(Math.min(fees, gross.minor), gross.currency);
}

export interface SaleInputs {
  readonly platform: Platform;
  readonly gross: MoneyDto;
  readonly acquisitionCost: MoneyDto;
  readonly shipping?: MoneyDto;
  readonly packaging?: MoneyDto;
  readonly other?: MoneyDto;
  readonly feesOverride?: MoneyDto;
  readonly schedules?: Record<Platform, FeeSchedule>;
}

/** Économie d'une vente côté client : brut → frais → coûts → net → marge, ROI, taux. */
export function computeSaleEconomics(input: SaleInputs): SaleEconomicsDto & {
  readonly fees: MoneyDto;
} {
  const cur = input.gross.currency;
  const schedules = input.schedules ?? DEFAULT_FEE_SCHEDULES;
  const fees = input.feesOverride ?? feesFor(input.gross, schedules[input.platform]);
  const costsMinor =
    (input.shipping?.minor ?? 0) + (input.packaging?.minor ?? 0) + (input.other?.minor ?? 0);
  const netMinor = input.gross.minor - fees.minor - costsMinor;
  const marginMinor = netMinor - input.acquisitionCost.minor;
  const roi =
    input.acquisitionCost.minor > 0 ? marginMinor / input.acquisitionCost.minor : undefined;
  const marginRate = input.gross.minor > 0 ? marginMinor / input.gross.minor : undefined;
  return {
    gross: input.gross,
    fees,
    costs: money(costsMinor, cur),
    net: money(netMinor, cur),
    margin: money(marginMinor, cur),
    ...(roi !== undefined ? { roi } : {}),
    ...(marginRate !== undefined ? { marginRate } : {}),
  };
}

export interface PriceSimulationRow {
  readonly platform: Platform;
  readonly price: MoneyDto;
  readonly fees: MoneyDto;
  readonly net: MoneyDto;
  readonly margin: MoneyDto;
  readonly roi: number | undefined;
}

/** Ce qu'un prix affiché rapporte sur chaque plateforme (fiche Pièce). */
export function simulateAcross(
  platforms: readonly Platform[],
  price: MoneyDto,
  acquisitionCost: MoneyDto,
  schedules: Record<Platform, FeeSchedule>,
  extraCostsMinor = 0,
): PriceSimulationRow[] {
  return platforms.map((platform) => {
    const fees = feesFor(price, schedules[platform]);
    const net = money(price.minor - fees.minor - extraCostsMinor, price.currency);
    const margin = money(net.minor - acquisitionCost.minor, price.currency);
    return {
      platform,
      price,
      fees,
      net,
      margin,
      roi: acquisitionCost.minor > 0 ? margin.minor / acquisitionCost.minor : undefined,
    };
  });
}
