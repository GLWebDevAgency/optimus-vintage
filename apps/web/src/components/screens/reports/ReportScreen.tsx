"use client";

import { AppIcon, Button, Select } from "@chine/ui";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useDashboardRange, useSales, useWorkspace } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";
import { label } from "../common/labels";
import { AnalyticsCard } from "../today/AnalyticsCard";

/** Douze derniers mois civils, du plus récent au plus ancien. */
function lastMonths(n: number, now = new Date()): { key: string; from: string; to: string }[] {
  const out: { key: string; from: string; to: string }[] = [];
  for (let i = 0; i < n; i++) {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const last = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ key: iso(first).slice(0, 7), from: iso(first), to: iso(last) });
  }
  return out;
}

/**
 * Rapport mensuel imprimable (formule Chineur+) : chiffres de la période, plateformes, analytique
 * et journal des ventes. « Imprimer / PDF » passe par la boîte d'impression du navigateur.
 */
export function ReportScreen() {
  const t = useT();
  const fmt = useFormat();
  const { intl } = useLocale();
  const workspace = useWorkspace();
  const months = useMemo(() => lastMonths(12), []);
  const [key, setKey] = useState(months[0]?.key ?? "");
  const month = months.find((m) => m.key === key) ?? months[0];
  const from = month?.from ?? "";
  const to = month?.to ?? "";
  const dashboard = useDashboardRange(from, to);
  const sales = useSales({ from, to });
  const allowed = workspace.data?.features.includes("PDF_REPORTS") ?? false;
  const monthLabel = (k: string) =>
    new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(
      new Date(`${k}-01T12:00:00`),
    );
  const rows = sales.data?.pages.flatMap((p) => p.items) ?? [];
  const d = dashboard.data;
  const pct = (v: number | undefined | null) =>
    v === undefined || v === null
      ? "—"
      : new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(v);

  return (
    <>
      <TopBar
        title={t("report.title")}
        kicker={month ? monthLabel(month.key) : ""}
        back="/app/reglages"
        avatar={false}
      />
      <Screen>
        {workspace.data && !allowed ? (
          <div className="card flex items-center gap-3 enter d1" data-testid="report-locked">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-soft text-brass">
              <AppIcon name="lock" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{t("report.title")}</div>
              <div className="text-[12.5px] text-ink-2">{t("report.lockedBody")}</div>
            </div>
            <Link
              href="/app/reglages#plan"
              className="btn ghost !min-h-[36px] !px-3 !text-[12px] shrink-0"
            >
              {t("billing.plan.PREMIUM")}
            </Link>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 enter d1 print:hidden">
          <Select
            value={key}
            onChange={setKey}
            aria-label={t("report.month")}
            className="!min-h-[40px] w-auto !text-[13px]"
            options={months.map((m) => ({ value: m.key, label: monthLabel(m.key) }))}
          />
          <Button
            onClick={() => window.print()}
            disabled={!allowed || !d}
            leading={<AppIcon name="receipt" size={16} />}
            data-testid="report-print"
          >
            {t("report.print")}
          </Button>
        </div>
        {!allowed ? null : dashboard.isPending && !d ? (
          <PageSkeleton variant="today" />
        ) : !d ? (
          <div className="card enter d2">
            <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
          </div>
        ) : (
          <article className="report grid gap-4 enter d2" data-testid="report">
            <header className="hidden print:block">
              <h1 className="font-display text-[28px] italic">
                Chiné · {t("report.title")} · {monthLabel(key)}
              </h1>
              <p className="text-[12px] text-ink-3">{workspace.data?.workspace.name}</p>
            </header>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                [t("dashboard.netMargin"), fmt.money(d.current.margin)],
                [t("dashboard.grossRevenue"), fmt.money(d.current.gross)],
                [t("dashboard.net"), fmt.money(d.current.net)],
                [t("sales.marginRate"), pct(d.current.marginRate)],
                [
                  t("dashboard.sales", { count: d.current.salesCount }),
                  fmt.money(d.current.averageTicket),
                ],
                [
                  t("dashboard.stockValue"),
                  d.stockValueAtCost ? fmt.money(d.stockValueAtCost) : "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">{k}</div>
                  <div className="font-display text-[24px] italic leading-tight">{v}</div>
                </div>
              ))}
            </div>
            {d.current.byPlatform.length ? (
              <div className="card grid gap-2">
                <span className="label">{t("dashboard.byPlatform")}</span>
                <table className="w-full text-[13px]">
                  <thead className="text-left text-[11px] uppercase text-ink-3">
                    <tr>
                      <th>{t("sales.platform")}</th>
                      <th className="text-right">{t("sales.title")}</th>
                      <th className="text-right">{t("dashboard.net")}</th>
                      <th className="text-right">{t("dashboard.netMargin")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.current.byPlatform.map((p) => (
                      <tr key={p.platform} className="border-t border-line">
                        <td className="py-1">{label.platform(t, p.platform)}</td>
                        <td className="py-1 text-right tabular">{p.count}</td>
                        <td className="py-1 text-right tabular">
                          {fmt.money(p.net, { compact: true })}
                        </td>
                        <td className="py-1 text-right tabular">
                          {fmt.money(p.margin, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <AnalyticsCard analytics={d.analytics} locked={!d.analytics} />
            <div className="card grid gap-2">
              <span className="label">{t("report.salesJournal")}</span>
              {rows.length === 0 ? (
                <p className="text-[13px] text-ink-2">{t("dashboard.noSales")}</p>
              ) : (
                <table className="w-full text-[12.5px]">
                  <thead className="text-left text-[11px] uppercase text-ink-3">
                    <tr>
                      <th>{t("common.date")}</th>
                      <th>{t("items.one")}</th>
                      <th>{t("sales.platform")}</th>
                      <th className="text-right">{t("sales.grossPrice")}</th>
                      <th className="text-right">{t("sales.netMargin")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.id} className="border-t border-line">
                        <td className="py-1 tabular">{fmt.date(s.soldAt, "short")}</td>
                        <td className="max-w-[160px] truncate py-1">
                          {s.item?.title ?? s.item?.sku ?? "—"}
                        </td>
                        <td className="py-1">{label.platform(t, s.platform)}</td>
                        <td className="py-1 text-right tabular">
                          {fmt.money(s.grossPrice, { compact: true })}
                        </td>
                        <td className="py-1 text-right tabular">
                          {fmt.money(s.economics.margin, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {sales.hasNextPage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="print:hidden"
                  onClick={() => void sales.fetchNextPage()}
                  loading={sales.isFetchingNextPage}
                >
                  {t("common.loadMore")}
                </Button>
              ) : null}
            </div>
            <p className="hidden text-[11px] text-ink-3 print:block">
              {t("report.footer", { date: fmt.date(new Date(), "long") })}
            </p>
          </article>
        )}
      </Screen>
    </>
  );
}
