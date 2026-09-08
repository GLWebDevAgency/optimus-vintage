"use client";

import type { DashboardDto, DashboardPeriod } from "@chine/contract";
import {
  AppIcon,
  Button,
  EmptyState,
  HangTag,
  KpiHero,
  List,
  ListRow,
  SectionHeader,
  Segmented,
  StatusPill,
  StitchProgress,
} from "@chine/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TodayKicker } from "@/components/shell/TodayKicker";
import { TopBar } from "@/components/shell/TopBar";
import { NextLink } from "@/components/ui/NextLink";
import { useDashboard, useWorkspace } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { usePendingCaptures } from "@/hooks/offline";
import { ErrorState } from "../common/ErrorState";
import { label, periodLabel } from "../common/labels";
import { GoalSheet } from "./GoalSheet";

const PERIODS: readonly DashboardPeriod[] = ["month", "30d", "3m", "year"];

function isBrandNew(d: DashboardDto, pendingCount: number): boolean {
  const c = d.counts;
  return (
    pendingCount === 0 &&
    c.inStock + c.listed + c.reserved + c.sold + c.dormant === 0 &&
    d.current.salesCount === 0 &&
    d.lastSales.length === 0
  );
}

/** Aujourd'hui : le mois en un chiffre, l'objectif cousu, trois étiquettes, les dernières ventes. */
export function TodayScreen() {
  const t = useT();
  const { locale, intl } = useLocale();
  const fmt = useFormat();
  const router = useRouter();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [goalOpen, setGoalOpen] = useState(false);
  const dashboard = useDashboard(period);
  const workspace = useWorkspace();
  const pending = usePendingCaptures();

  const currency =
    workspace.data?.workspace.currency ?? dashboard.data?.current.net.currency ?? "EUR";
  const goalMinor =
    workspace.data?.workspace.monthlyGoal?.minor ?? dashboard.data?.goal?.targetMinor ?? null;

  return (
    <>
      <TopBar
        title={t("dashboard.title")}
        kicker={
          <span className="inline-flex items-center gap-2">
            <TodayKicker />
            {dashboard.isFetching && dashboard.data ? (
              <span className="sync-dot" aria-hidden="true" />
            ) : null}
          </span>
        }
      />
      <Screen>
        <Segmented
          value={period}
          onChange={setPeriod}
          aria-label={t("sales.period")}
          size="sm"
          className="enter d1"
          options={PERIODS.map((p) => ({ value: p, label: label.periodShort(t, p) }))}
        />

        {dashboard.isPending && !dashboard.data ? (
          <PageSkeleton variant="today" />
        ) : dashboard.isError && !dashboard.data ? (
          <div className="card enter d2">
            <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
          </div>
        ) : dashboard.data ? (
          isBrandNew(dashboard.data, pending.length) ? (
            <div className="card enter d2 flex-1 grid place-items-center">
              <EmptyState
                title={t("dashboard.emptyTitle")}
                body={t("dashboard.emptyCta")}
                action={
                  <Button
                    href="/app/chiner"
                    Link={NextLink}
                    size="lg"
                    leading={<AppIcon name="camera" size={18} />}
                  >
                    {t("dashboard.emptyAction")}
                  </Button>
                }
              />
            </div>
          ) : (
            <DashboardBody
              data={dashboard.data}
              period={period}
              locale={locale}
              intl={intl}
              pendingCount={pending.length}
              fmtMoney={fmt.money}
              fmtRelative={fmt.relative}
              onEditGoal={() => setGoalOpen(true)}
              onTag={(status) => router.push(`/app/stock?filter=${status}`)}
            />
          )
        ) : null}
      </Screen>
      <GoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        currency={currency}
        currentMinor={goalMinor}
      />
    </>
  );
}

interface BodyProps {
  readonly data: DashboardDto;
  readonly period: DashboardPeriod;
  readonly locale: string;
  readonly intl: string;
  readonly pendingCount: number;
  readonly fmtMoney: ReturnType<typeof useFormat>["money"];
  readonly fmtRelative: ReturnType<typeof useFormat>["relative"];
  readonly onEditGoal: () => void;
  readonly onTag: (status: "stock" | "online" | "dormant") => void;
}

function DashboardBody({
  data,
  period,
  locale,
  intl,
  pendingCount,
  fmtMoney,
  fmtRelative,
  onEditGoal,
  onTag,
}: BodyProps) {
  const t = useT();
  const change = data.change.margin;
  const deltaText = [
    change !== undefined
      ? t("dashboard.vsPrevious", {
          change: new Intl.NumberFormat(intl, {
            style: "percent",
            maximumFractionDigits: 0,
            signDisplay: "exceptZero",
          }).format(change),
          period: period === "month" ? t("dashboard.previousMonth") : t("dashboard.previousPeriod"),
        })
      : null,
    t("dashboard.salesShort", { count: data.current.salesCount }),
  ]
    .filter(Boolean)
    .join(" · ");
  const goal = data.goal;
  const progress = goal ? Math.min(1, goal.progress) : 0;

  return (
    <>
      <div className="enter d2" data-testid="today-kpi">
        <KpiHero
          label={t("dashboard.netMarginPeriod", { period: periodLabel(t, period, intl) })}
          value={data.current.margin}
          locale={locale}
          delta={deltaText}
          deltaTone={change !== undefined && change < 0 ? "thread" : "brass"}
        />
      </div>

      <div className="enter d3">
        {goal ? (
          <button
            type="button"
            className="block w-full text-left rounded-md focus-thread"
            onClick={onEditGoal}
            aria-label={t("dashboard.editGoal")}
          >
            <StitchProgress
              value={progress}
              tone={goal.progress >= 1 ? "brass" : "thread"}
              label={t("dashboard.goalOf", {
                amount: fmtMoney(
                  { minor: goal.targetMinor, currency: goal.currency },
                  { compact: true },
                ),
              })}
              valueLabel={
                goal.progress >= 1
                  ? t("dashboard.goalReached")
                  : new Intl.NumberFormat(intl, {
                      style: "percent",
                      maximumFractionDigits: 0,
                    }).format(goal.progress)
              }
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onEditGoal}
            className="flex w-full items-center justify-between gap-3 rounded-field border border-dashed border-line-2 px-3.5 py-3 text-left text-[13px] text-ink-2 focus-thread min-h-[44px]"
          >
            <span>{t("dashboard.noGoal")}</span>
            <span className="font-semibold text-ink">{t("dashboard.setGoal")}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-4">
        <HangTag
          label={t("dashboard.stock")}
          value={data.counts.inStock + pendingCount}
          delay={0.35}
          onClick={() => onTag("stock")}
        />
        <HangTag
          label={t("dashboard.online")}
          value={data.counts.listed}
          delay={0.5}
          onClick={() => onTag("online")}
        />
        <HangTag
          label={t("dashboard.dormant")}
          value={data.counts.dormant}
          tone="thread"
          delay={0.65}
          onClick={() => onTag("dormant")}
        />
      </div>

      <SectionHeader
        title={t("dashboard.lastSales")}
        action={t("common.seeAll")}
        href="/app/ventes"
        Link={NextLink}
        className="enter d5"
      />
      <div className="enter d6">
        {data.lastSales.length === 0 ? (
          <div className="card">
            <EmptyState
              compact
              title={t("dashboard.noSales")}
              action={
                <Link href="/app/ventes/nouvelle" className="btn ghost">
                  {t("dashboard.noSalesCta")}
                </Link>
              }
            />
          </div>
        ) : (
          <List>
            {data.lastSales.slice(0, 5).map((s) => (
              <ListRow
                key={s.id}
                href={`/app/ventes/${s.id}`}
                Link={NextLink}
                thumb={s.item?.thumbnailUrl}
                title={s.item?.title ?? s.item?.sku ?? t("sales.one")}
                sub={`${label.platform(t, s.platform)} · ${fmtRelative(s.soldAt)}`}
                amount={s.economics.margin}
                locale={locale}
                trailing={
                  s.status !== "COMPLETED" ? (
                    <StatusPill
                      status={s.status === "PENDING" ? "pending" : "returned"}
                      label={label.saleStatus(t, s.status)}
                    />
                  ) : undefined
                }
              />
            ))}
          </List>
        )}
      </div>
    </>
  );
}
