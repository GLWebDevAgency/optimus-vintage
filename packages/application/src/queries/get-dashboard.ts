import {
  computePeriodReport,
  type DomainError,
  type IsoDate,
  ITEM_STATUSES,
  type ItemStatus,
  Money,
  ok,
  type Result,
  relativeChange,
  SELLABLE,
  toIsoDate,
} from "@chine/domain";
import type { DashboardDto, GoalProgressDto } from "../dto.js";
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

export class GetDashboard implements Query<GetDashboardQuery, DashboardDto> {
  constructor(
    private readonly deps: Pick<
      AppDependencies,
      "workspaces" | "items" | "sales" | "clock" | "photos"
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
    });
  }
}
