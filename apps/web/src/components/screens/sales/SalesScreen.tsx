"use client";

import type { DashboardPeriod, SaleDto } from "@chine/contract";
import { AppIcon, Button, EmptyState, List, ListRow, Segmented, SkeletonRow, StatusPill } from "@chine/ui";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";
import { NextLink } from "@/components/ui/NextLink";
import { useDashboard, useSales } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { useOutboxEntries } from "@/hooks/offline";
import { ErrorState } from "../common/ErrorState";
import { label, periodLabel, periodRange, salePill } from "../common/labels";
import { LoadMore } from "../common/LoadMore";

const PERIODS: readonly DashboardPeriod[] = ["month", "30d", "3m", "year"];

function groupByDay(sales: readonly SaleDto[]): { day: string; sales: SaleDto[] }[] {
  const groups = new Map<string, SaleDto[]>();
  for (const s of sales) {
    const list = groups.get(s.soldAt) ?? [];
    list.push(s);
    groups.set(s.soldAt, list);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).map(([day, list]) => ({ day, sales: list }));
}

/** Ventes : période, quatre chiffres, liste par jour avec plateforme et marge nette. */
export function SalesScreen() {
  const t = useT();
  const fmt = useFormat();
  const { locale, intl } = useLocale();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const range = useMemo(() => periodRange(period), [period]);
  const dashboard = useDashboard(period);
  const sales = useSales(range);
  const outbox = useOutboxEntries();
  const pendingSales = outbox.filter((e) => e.method === "POST" && e.path === "/sales").length;

  const all = sales.data?.pages.flatMap((p) => p.items) ?? [];
  const total = sales.data?.pages[0]?.total ?? 0;
  const groups = useMemo(() => groupByDay(all), [all]);
  const stats = dashboard.data?.current;
  const change = dashboard.data?.change.net;
  const pct = (r: number) =>
    new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" }).format(r);

  return (
    <>
      <TopBar
        title={t("sales.title")}
        kicker={periodLabel(t, period, intl)}
        actions={
          <Link href="/app/ventes/nouvelle" className="avatar !bg-btn !text-btn-ink" aria-label={t("sales.new")}>
            <IconPlus />
          </Link>
        }
      />
      <Screen>
        <Segmented
          value={period}
          onChange={setPeriod}
          size="sm"
          aria-label={t("sales.period")}
          className="enter d1"
          options={PERIODS.map((p) => ({ value: p, label: label.periodShort(t, p) }))}
        />

        <div className="kpi-tiles enter d2" data-testid="sales-kpis">
          <div className="kpi-tile">
            <span className="k">{t("sales.kpiNet")}</span>
            <span className="v">
              {stats ? fmt.money(stats.net, { compact: true }) : <span className="sk text inline-block w-16" />}
            </span>
          </div>
          <div className="kpi-tile">
            <span className="k">{t("sales.kpiCount")}</span>
            <span className="v">
              {stats ? stats.salesCount + pendingSales : <span className="sk text inline-block w-10" />}
            </span>
          </div>
          <div className="kpi-tile">
            <span className="k">{t("sales.kpiTicket")}</span>
            <span className="v">
              {stats ? fmt.money(stats.averageTicket, { compact: true }) : <span className="sk text inline-block w-14" />}
            </span>
          </div>
          <div className="kpi-tile">
            <span className="k">{t("sales.kpiChange")}</span>
            <span className={`v ${change !== undefined && change < 0 ? "text-thread" : "text-brass"}`}>
              {stats ? (change !== undefined ? pct(change) : "—") : <span className="sk text inline-block w-12" />}
            </span>
          </div>
        </div>

        {sales.isPending && !sales.data ? (
          <div className="enter d3">
            <SkeletonRow count={5} />
          </div>
        ) : sales.isError && !sales.data ? (
          <div className="card enter d3">
            <ErrorState error={sales.error} onRetry={() => void sales.refetch()} />
          </div>
        ) : all.length === 0 ? (
          <div className="card enter d3">
            <EmptyState
              title={t("sales.empty")}
              body={t("sales.emptyBody")}
              action={
                <Button href="/app/ventes/nouvelle" Link={NextLink} leading={<AppIcon name="receipt" size={18} />}>
                  {t("sales.new")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 enter d3" data-testid="sales-list">
            {groups.map((g) => (
              <div key={g.day} className="grid gap-1.5">
                <div className="day-head">{fmt.date(g.day, "weekday")}</div>
                <List>
                  {g.sales.map((s) => (
                    <ListRow
                      key={s.id}
                      href={`/app/ventes/${s.id}`}
                      Link={NextLink}
                      thumb={s.item?.thumbnailUrl}
                      title={s.item?.title ?? s.item?.sku ?? t("sales.one")}
                      sub={`${label.platform(t, s.platform)}${s.buyer ? ` · ${s.buyer}` : ""}`}
                      amount={s.economics.margin}
                      locale={locale}
                      trailing={
                        s.status !== "COMPLETED" ? (
                          <StatusPill status={salePill(s.status)} label={label.saleStatus(t, s.status)} />
                        ) : undefined
                      }
                    />
                  ))}
                </List>
              </div>
            ))}
            <LoadMore
              shown={all.length}
              total={total}
              hasMore={Boolean(sales.hasNextPage)}
              loading={sales.isFetchingNextPage}
              onMore={() => void sales.fetchNextPage()}
            />
          </div>
        )}
      </Screen>
    </>
  );
}
