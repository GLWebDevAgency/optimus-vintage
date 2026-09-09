"use client";

import type { AnalyticsDto } from "@chine/contract";
import { AppIcon } from "@chine/ui";
import Link from "next/link";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { label } from "../common/labels";

/**
 * Analytique de période (formule Chineur+) : taux d'écoulement, délai de vente, meilleures
 * plateformes, sources et marques. Sans la fonctionnalité : carte verrouillée, jamais de faux chiffres.
 */
export function AnalyticsCard({
  analytics,
  locked,
}: {
  analytics: AnalyticsDto | null | undefined;
  locked: boolean;
}) {
  const t = useT();
  const fmt = useFormat();
  const { intl } = useLocale();
  if (locked || !analytics) {
    return (
      <div className="card flex items-center gap-3" data-testid="analytics-locked">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-soft text-brass">
          <AppIcon name="lock" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{t("analytics.title")}</div>
          <div className="text-[12.5px] text-ink-2">{t("analytics.lockedBody")}</div>
        </div>
        <Link
          href="/app/reglages#plan"
          className="btn ghost !min-h-[36px] !px-3 !text-[12px] shrink-0"
        >
          {t("billing.plan.PREMIUM")}
        </Link>
      </div>
    );
  }
  const pct = (v: number | null) =>
    v === null
      ? "—"
      : new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(v);
  const days = (v: number | null) =>
    v === null ? "—" : t("analytics.days", { count: Math.round(v) });
  const Row = ({
    name,
    sub,
    amount,
  }: {
    name: string;
    sub: string;
    amount: { minor: number; currency: string };
  }) => (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold">{name}</div>
        <div className="text-[12px] text-ink-3">{sub}</div>
      </div>
      <span className="tabular text-[13.5px] font-bold text-brass">
        {fmt.money(amount as never, { compact: true })}
      </span>
    </li>
  );
  return (
    <div className="card grid gap-3" data-testid="analytics">
      <span className="label">{t("analytics.title")}</span>
      <div className="grid grid-cols-3 gap-2">
        {[
          [t("analytics.sellThrough"), pct(analytics.sellThroughRate)],
          [t("analytics.avgDays"), days(analytics.averageDaysToSell)],
          [t("analytics.medianDays"), days(analytics.medianDaysToSell)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface-2 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">{k}</div>
            <div className="font-display text-[22px] italic leading-tight">{v}</div>
          </div>
        ))}
      </div>
      {analytics.topPlatforms.length ? (
        <div>
          <span className="label">{t("analytics.topPlatforms")}</span>
          <ul className="divide-y divide-line">
            {analytics.topPlatforms.map((p) => (
              <Row
                key={p.platform}
                name={label.platform(t, p.platform)}
                sub={`${t("dashboard.salesShort", { count: p.count })}${p.marginRate !== null ? ` · ${pct(p.marginRate)} ${t("analytics.marginRateShort")}` : ""}`}
                amount={p.margin}
              />
            ))}
          </ul>
        </div>
      ) : null}
      {analytics.topSources.length ? (
        <div>
          <span className="label">{t("analytics.topSources")}</span>
          <ul className="divide-y divide-line">
            {analytics.topSources.map((s) => (
              <Row
                key={s.sourceId}
                name={s.name}
                sub={t("dashboard.salesShort", { count: s.count })}
                amount={s.margin}
              />
            ))}
          </ul>
        </div>
      ) : null}
      {analytics.topBrands.length ? (
        <div>
          <span className="label">{t("analytics.topBrands")}</span>
          <ul className="divide-y divide-line">
            {analytics.topBrands.map((b) => (
              <Row
                key={b.brand}
                name={b.brand}
                sub={t("dashboard.salesShort", { count: b.count })}
                amount={b.margin}
              />
            ))}
          </ul>
        </div>
      ) : null}
      {analytics.topPlatforms.length === 0 ? (
        <p className="text-[13px] text-ink-2">{t("analytics.empty")}</p>
      ) : null}
    </div>
  );
}
