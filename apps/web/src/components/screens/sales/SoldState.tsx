"use client";

import type { SaleDto } from "@chine/contract";
import {
  AppIcon,
  BigButton,
  Receipt,
  SectionHeader,
  Stamp,
  StatusPill,
  StitchProgress,
  Tally,
} from "@chine/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDashboard } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { label } from "../common/labels";

interface SoldStateProps {
  readonly sale: SaleDto;
  readonly pending: boolean;
  readonly onNewSale: () => void;
}

/** Vendu : le tampon tombe, la marge se compte, l'objectif du mois avance d'un point de couture. */
export function SoldState({ sale, pending, onNewSale }: SoldStateProps) {
  const t = useT();
  const fmt = useFormat();
  const { locale, intl } = useLocale();
  const router = useRouter();
  const dashboard = useDashboard("month");
  const eco = sale.economics;
  // Le formulaire était défilé jusqu'au bouton : le tampon doit tomber en haut de l'écran.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const goal = dashboard.data?.goal;
  const pct = (r: number) =>
    new Intl.NumberFormat(intl, {
      style: "percent",
      maximumFractionDigits: 0,
      signDisplay: "exceptZero",
    }).format(r);
  const neg = (m: { minor: number; currency: string }) => ({
    minor: -Math.abs(m.minor),
    currency: m.currency,
  });

  return (
    <div className="grid flex-1 content-start gap-4" data-testid="sold-state">
      <div className="sale-hero enter d2">
        <div className="ring overflow-hidden">
          {sale.item?.thumbnailUrl ? (
            // biome-ignore lint/performance/noImgElement: photo distante ou URL d'objet, hors next/image
            <img src={sale.item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <AppIcon name="shirt" size={56} className="text-indigo" />
          )}
        </div>
        <span className="absolute top-[26px]" data-testid="sold-stamp">
          <Stamp size="lg">{t("sales.stampSold")}</Stamp>
        </span>
        <p className="caption">
          <b className="text-ink">{sale.item?.title ?? t("items.one")}</b> ·{" "}
          {fmt.money(sale.grossPrice)}
          {sale.buyer ? ` · ${t("sales.buyer").toLowerCase()} ${sale.buyer}` : ""}
        </p>
        {pending ? <StatusPill status="pending" label={t("common.syncLater")} /> : null}
      </div>

      <div className="margin-card enter d3">
        <div className="top">
          <div>
            <span className="k">{t("sales.netMargin")}</span>
            <div className="v">
              <Tally value={eco.margin} locale={locale} size="card" tone="brass" signed />
            </div>
          </div>
          {eco.roi !== undefined ? (
            <span className="pill sold">
              {t("sales.roi")} {pct(eco.roi)}
            </span>
          ) : null}
        </div>
        <StitchProgress value={1} tone="brass" height={10} />
        <Receipt
          bare
          locale={locale}
          rows={[
            { key: "gross", label: t("sales.grossShort"), value: eco.gross },
            ...(eco.fees.minor > 0
              ? [
                  {
                    key: "fees",
                    label: t("sales.platformFees", { platform: label.platform(t, sale.platform) }),
                    value: neg(eco.fees),
                  },
                ]
              : []),
            ...(sale.shippingCost.minor > 0
              ? [{ key: "ship", label: t("sales.shipping"), value: neg(sale.shippingCost) }]
              : []),
            ...(sale.packagingCost.minor > 0
              ? [{ key: "pack", label: t("sales.packaging"), value: neg(sale.packagingCost) }]
              : []),
            ...(sale.otherCosts.minor > 0
              ? [{ key: "other", label: t("sales.otherCosts"), value: neg(sale.otherCosts) }]
              : []),
            { key: "acq", label: t("sales.acquisition"), value: neg(sale.acquisitionCost) },
          ]}
        />
      </div>

      <SectionHeader
        title={t("sales.monthInProgress")}
        action={
          dashboard.data
            ? t("dashboard.salesShort", { count: dashboard.data.current.salesCount })
            : undefined
        }
        className="enter d4"
      />
      <div className="enter d5">
        {goal ? (
          <StitchProgress
            value={Math.min(1, goal.progress)}
            tone={goal.progress >= 1 ? "brass" : "thread"}
            label={t("dashboard.goalOf", {
              amount: fmt.money(
                { minor: goal.targetMinor, currency: goal.currency },
                { compact: true },
              ),
            })}
            valueLabel={new Intl.NumberFormat(intl, {
              style: "percent",
              maximumFractionDigits: 0,
            }).format(goal.progress)}
            delay={0.4}
          />
        ) : dashboard.data ? (
          <StitchProgress
            value={0}
            label={t("dashboard.noGoal")}
            valueLabel={fmt.money(dashboard.data.current.margin, { compact: true })}
          />
        ) : null}
      </div>

      <div className="two-btn enter d6">
        <BigButton
          variant="secondary"
          onClick={() => router.push(`/app/stock/${sale.itemId}`)}
          data-testid="sold-view-item"
        >
          {t("sales.viewItem")}
        </BigButton>
        <BigButton onClick={onNewSale} data-testid="sold-new">
          {t("sales.new")}
        </BigButton>
      </div>
    </div>
  );
}
