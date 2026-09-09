import type { Platform } from "../listing/platforms.js";
import type { Currency } from "../money/currency.js";
import { Money } from "../money/money.js";
import type { Sale } from "../sales/sale.js";
import type { IsoDate } from "../shared/entity.js";

export interface PeriodReport {
  readonly from: IsoDate;
  readonly to: IsoDate;
  readonly salesCount: number;
  readonly gross: Money;
  readonly fees: Money;
  readonly costs: Money;
  readonly net: Money;
  readonly acquisition: Money;
  readonly margin: Money;
  readonly marginRate: number | undefined;
  readonly averageTicket: Money;
  readonly refundedCount: number;
  readonly byPlatform: ReadonlyArray<{
    platform: Platform;
    count: number;
    net: Money;
    margin: Money;
  }>;
  readonly byDay: ReadonlyArray<{ day: IsoDate; net: Money; margin: Money; count: number }>;
}

const inRange = (d: IsoDate, from: IsoDate, to: IsoDate): boolean => d >= from && d <= to;

/** Service de domaine : synthèse d'une période (mois, 30 j, année) à partir des ventes. */
export function computePeriodReport(
  sales: readonly Sale[],
  from: IsoDate,
  to: IsoDate,
  currency: Currency,
): PeriodReport {
  const zero = Money.zero(currency);
  const inPeriod = sales.filter((s) => inRange(s.soldAt, from, to));
  const valid = inPeriod.filter((s) => s.countsAsRevenue);
  const sum = (f: (s: Sale) => Money) => valid.reduce((a, s) => a.add(f(s)), zero);
  const gross = sum((s) => s.economics.gross),
    fees = sum((s) => s.economics.fees),
    costs = sum((s) => s.economics.costs);
  const net = sum((s) => s.economics.net),
    acquisition = sum((s) => s.acquisitionCost),
    margin = net.subtract(acquisition);
  const byPlatformMap = new Map<Platform, { count: number; net: Money; margin: Money }>();
  const byDayMap = new Map<IsoDate, { net: Money; margin: Money; count: number }>();
  for (const s of valid) {
    const e = s.economics;
    const p = byPlatformMap.get(s.platform) ?? { count: 0, net: zero, margin: zero };
    byPlatformMap.set(s.platform, {
      count: p.count + 1,
      net: p.net.add(e.net),
      margin: p.margin.add(e.margin),
    });
    const d = byDayMap.get(s.soldAt) ?? { net: zero, margin: zero, count: 0 };
    byDayMap.set(s.soldAt, {
      net: d.net.add(e.net),
      margin: d.margin.add(e.margin),
      count: d.count + 1,
    });
  }
  return {
    from,
    to,
    salesCount: valid.length,
    gross,
    fees,
    costs,
    net,
    acquisition,
    margin,
    marginRate: margin.ratioTo(gross),
    averageTicket: valid.length ? net.divide(valid.length) : zero,
    refundedCount: inPeriod.filter((s) => s.status === "REFUNDED").length,
    byPlatform: [...byPlatformMap.entries()]
      .map(([platform, v]) => ({ platform, ...v }))
      .sort((a, b) => b.net.minor - a.net.minor),
    byDay: [...byDayMap.entries()]
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
  };
}

/** Variation relative entre deux montants (ex. +18 % vs mois précédent). */
export function relativeChange(current: Money, previous: Money): number | undefined {
  if (previous.isZero) return current.isZero ? 0 : undefined;
  return (current.minor - previous.minor) / Math.abs(previous.minor);
}
