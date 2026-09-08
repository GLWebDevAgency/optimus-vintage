"use client";

import type { SourceDto } from "@chine/contract";
import { Stamp, StitchProgress } from "@chine/ui";
import Link from "next/link";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { label } from "../common/labels";

/** Carte source : nom, contexte, investi, fil de remboursement, récupéré / plancher, tampon Amortie. */
export function SourceCard({ source, index = 0 }: { source: SourceDto; index?: number }) {
  const t = useT();
  const fmt = useFormat();
  const { intl } = useLocale();
  const p = source.performance;
  const sub = [
    source.location?.label ?? source.supplierName ?? label.supplierKindShort(t, source.supplierKind),
    source.weightKg ? new Intl.NumberFormat(intl, { style: "unit", unit: "kilogram", maximumFractionDigits: 1 }).format(source.weightKg) : null,
    source.kind === "UNIT"
      ? fmt.date(source.purchasedAt, "medium")
      : t("common.pieces", { count: source.effectiveQuantity ?? source.itemCount }),
  ]
    .filter(Boolean)
    .join(" · ");
  const remaining = (source.effectiveQuantity ?? source.itemCount) - p.soldCount - p.writtenOffCount;

  return (
    <Link
      href={`/app/sources/${source.id}`}
      className={`src enter d${Math.min(7, 3 + index)}`}
      data-testid="source-card"
      data-amortized={p.isAmortized || undefined}
    >
      {p.isAmortized ? (
        <span className="absolute right-3 top-10">
          <Stamp tone="brass" size="sm" delay={0.9 + index * 0.15}>
            {t("sources.amortized")}
          </Stamp>
        </span>
      ) : null}
      <div className="r1">
        <div className="min-w-0">
          <div className="t truncate">{source.name}</div>
          <div className="s truncate">{sub}</div>
        </div>
        <div className="amt">
          {fmt.money(source.totalInvestment, { compact: true, symbol: false })}
          <small> {source.totalInvestment.currency === "EUR" ? "€" : source.totalInvestment.currency}</small>
        </div>
      </div>
      <StitchProgress
        value={Math.min(1, p.recoveryRate)}
        tone={p.isAmortized ? "brass" : "thread"}
        height={10}
        delay={0.2 + index * 0.1}
        aria-label={t("sources.recoveryRate", {
          percent: new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(p.recoveryRate),
        })}
      />
      <div className="foot">
        <span>
          {t("sources.recovered")} <b>{fmt.money(p.recovered)}</b>
        </span>
        {!p.isAmortized && p.floorPriceBreakEven && remaining > 0 ? (
          <span className="text-thread">
            {t("sources.floorPrice", { amount: fmt.money(p.floorPriceBreakEven, { compact: true }) })}
          </span>
        ) : (
          <span>
            {t("sources.soldAndStock", { sold: p.soldCount, stock: Math.max(0, remaining) })}
          </span>
        )}
      </div>
    </Link>
  );
}
