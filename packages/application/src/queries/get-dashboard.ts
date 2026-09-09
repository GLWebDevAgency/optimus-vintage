import {
  type Currency,
  computePeriodReport,
  type DomainError,
  type IsoDate,
  ITEM_STATUSES,
  type ItemStatus,
  Money,
  ok,
  type Platform,
  type Result,
  relativeChange,
  type Sale,
  SELLABLE,
  type SourceId,
  toIsoDate,
} from "@chine/domain";
import type { AnalyticsDto, DashboardDto, GoalProgressDto } from "../dto.js";
import { toMoneyDto, toPeriodReportDto, toSaleListEntryDto } from "../mappers/index.js";
import type { AppDependencies } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { addDays, endOfMonth, previousPeriod, startOfMonth } from "../shared/dates.js";
import type { Query } from "./query.js";

export interface GetDashboardQuery extends WorkspaceScoped {
  /** Période analysée ; par défaut le mois civil en cours. */
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  /** Objectif de marge pour la période (en unités mineures). */
  readonly goalMinor?: number;
  readonly dormantThresholdDays?: number;
}

/** Sentinelle « pas de pagination » (les dépôts la traduisent en absence de LIMIT). */
const ALL_ROWS = Number.POSITIVE_INFINITY;
/** Ventes les plus récentes dont la pièce est relue pour les délais de vente et les marques. */
const ANALYTICS_ITEM_CAP = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

export class GetDashboard implements Query<GetDashboardQuery, DashboardDto> {
  constructor(
    private readonly deps: Pick<
      AppDependencies,
      "workspaces" | "items" | "sales" | "sources" | "clock" | "photos"
    >,
  ) {}

  async execute(q: GetDashboardQuery): Promise<Result<DashboardDto, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const { id, currency } = ws.value;
    const now = this.deps.clock.now();
    const from = q.from ?? toIsoDate(startOfMonth(now));
    const to = q.to ?? toIsoDate(endOfMonth(now));
    const prev = previousPeriod(from, to);

    // Rapport de période : toutes les ventes de l'intervalle, jamais une page tronquée.
    const sales = await this.deps.sales.list(id, { from: prev.from, to, limit: ALL_ROWS });
    const current = computePeriodReport(sales, from, to, currency);
    const previous = computePeriodReport(sales, prev.from, prev.to, currency);

    const countsByStatus = {} as Record<ItemStatus, number>;
    for (const status of ITEM_STATUSES)
      countsByStatus[status] = await this.deps.items.count(id, { status: [status] });
    const sellable = [...SELLABLE];
    const sellableCount = sellable.reduce((acc, s) => acc + countsByStatus[s], 0);
    const dormantCount = await this.deps.items.count(id, {
      status: sellable,
      dormantSince: addDays(now, -(q.dormantThresholdDays ?? 30)),
    });
    const stock = await this.deps.items.list(id, { status: sellable, limit: ALL_ROWS });
    const stockValueAtCost = stock.reduce(
      (acc, i) => acc.add(i.acquisitionCost),
      Money.zero(currency),
    );

    const lastSales = await this.deps.sales.list(id, { limit: 5 });
    const publicUrl = (k: string) => this.deps.photos.publicUrl(k);
    const lastSalesDto = await Promise.all(
      lastSales.map(async (s) =>
        toSaleListEntryDto(s, await this.deps.items.byId(id, s.itemId), publicUrl),
      ),
    );

    let goal: GoalProgressDto | null = null;
    if (q.goalMinor !== undefined && q.goalMinor > 0) {
      const target = Money.ofMinor(q.goalMinor, currency);
      const achieved = current.margin;
      goal = {
        target: toMoneyDto(target),
        achieved: toMoneyDto(achieved),
        remaining: toMoneyDto(target.subtract(achieved).max(Money.zero(currency))),
        progress: achieved.minor / target.minor,
      };
    }

    const analytics = await this.analytics(
      id,
      currency,
      sales.filter((s) => s.countsAsRevenue && s.soldAt >= from && s.soldAt <= to),
      sellableCount,
    );

    return ok({
      period: { from, to },
      current: toPeriodReportDto(current),
      previous: toPeriodReportDto(previous),
      change: {
        gross: relativeChange(current.gross, previous.gross) ?? null,
        net: relativeChange(current.net, previous.net) ?? null,
        margin: relativeChange(current.margin, previous.margin) ?? null,
        salesCount:
          previous.salesCount === 0
            ? current.salesCount === 0
              ? 0
              : null
            : (current.salesCount - previous.salesCount) / previous.salesCount,
      },
      countsByStatus,
      sellableCount,
      dormantCount,
      stockValueAtCost: toMoneyDto(stockValueAtCost),
      goal,
      lastSales: lastSalesDto,
      analytics,
    });
  }

  /**
   * Analytique de la période. Les délais de vente et les marques demandent la pièce de chaque
   * vente : on lit les `ANALYTICS_ITEM_CAP` ventes les plus récentes (au-delà, agréger en SQL).
   */
  private async analytics(
    workspaceId: Parameters<AppDependencies["items"]["byId"]>[0],
    currency: Currency,
    sold: readonly Sale[],
    sellableCount: number,
  ): Promise<AnalyticsDto> {
    const zero = Money.zero(currency);
    const bucket = <K extends string>() => new Map<K, { count: number; margin: Money }>();
    const add = <K extends string>(
      map: Map<K, { count: number; margin: Money }>,
      key: K,
      margin: Money,
    ) => {
      const cur = map.get(key) ?? { count: 0, margin: zero };
      map.set(key, { count: cur.count + 1, margin: cur.margin.add(margin) });
    };
    const platforms = bucket<Platform>();
    const grossByPlatform = new Map<Platform, Money>();
    const sources = bucket<SourceId>();
    const brands = bucket<string>();
    const days: number[] = [];
    const recent = [...sold].sort((a, b) => (a.soldAt < b.soldAt ? 1 : -1));
    for (const sale of recent) {
      const margin = sale.economics.margin;
      add(platforms, sale.platform, margin);
      grossByPlatform.set(
        sale.platform,
        (grossByPlatform.get(sale.platform) ?? zero).add(sale.grossPrice),
      );
      add(sources, sale.sourceId, margin);
    }
    for (const sale of recent.slice(0, ANALYTICS_ITEM_CAP)) {
      const item = await this.deps.items.byId(workspaceId, sale.itemId);
      if (!item) continue;
      const soldAt = new Date(`${sale.soldAt}T12:00:00Z`).getTime();
      days.push(Math.max(0, Math.round((soldAt - item.createdAt.getTime()) / DAY_MS)));
      if (item.brand) add(brands, item.brand.trim(), sale.economics.margin);
    }
    const sortedDays = [...days].sort((a, b) => a - b);
    const median =
      sortedDays.length === 0
        ? null
        : sortedDays.length % 2 === 1
          ? (sortedDays[(sortedDays.length - 1) / 2] ?? null)
          : ((sortedDays[sortedDays.length / 2 - 1] ?? 0) +
              (sortedDays[sortedDays.length / 2] ?? 0)) /
            2;
    const top = <K extends string>(map: Map<K, { count: number; margin: Money }>, n: number) =>
      [...map.entries()]
        .sort((a, b) => b[1].margin.minor - a[1].margin.minor || b[1].count - a[1].count)
        .slice(0, n);
    const topSources = await Promise.all(
      top(sources, 5).map(async ([sourceId, v]) => ({
        sourceId,
        name: (await this.deps.sources.byId(workspaceId, sourceId))?.name ?? "—",
        count: v.count,
        margin: toMoneyDto(v.margin),
      })),
    );
    return {
      sellThroughRate:
        sold.length + sellableCount === 0 ? null : sold.length / (sold.length + sellableCount),
      averageDaysToSell:
        days.length === 0 ? null : Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      medianDaysToSell: median,
      topPlatforms: top(platforms, 5).map(([platform, v]) => {
        const gross = grossByPlatform.get(platform) ?? zero;
        return {
          platform,
          count: v.count,
          margin: toMoneyDto(v.margin),
          marginRate: gross.minor === 0 ? null : v.margin.minor / gross.minor,
        };
      }),
      topSources,
      topBrands: top(brands, 5).map(([brand, v]) => ({
        brand,
        count: v.count,
        margin: toMoneyDto(v.margin),
      })),
    };
  }
}
