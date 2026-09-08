"use client";

import type { ItemDto } from "@chine/contract";
import { Tally } from "@chine/ui";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useFormat, useLocale, useT } from "@/hooks/i18n";

/**
 * L'étiquette qui se retourne : recto « Payé » et décote face au neuf, verso « Prix cible »,
 * fourchette IA et marge. Se retourne seule après 1,1 s, puis au toucher.
 */
export function FlipTag({ item, aiRange }: { item: ItemDto; aiRange?: string }) {
  const t = useT();
  const fmt = useFormat();
  const { locale, intl } = useLocale();
  const reduced = useReducedMotion();
  const [side, setSide] = useState<"front" | "back">("front");

  useEffect(() => {
    if (reduced || !item.targetPrice) return;
    const id = window.setTimeout(() => setSide("back"), 1100);
    return () => window.clearTimeout(id);
  }, [reduced, item.targetPrice]);

  const pct = (r: number) =>
    new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" }).format(r);
  const marginRatio =
    item.targetPrice && item.acquisitionCost.minor > 0
      ? (item.targetPrice.minor - item.acquisitionCost.minor) / item.acquisitionCost.minor
      : undefined;

  return (
    <button
      type="button"
      className="flip-wrap enter d2 block w-full text-left focus-thread rounded-card"
      onClick={() => setSide((s) => (s === "front" ? "back" : "front"))}
      aria-label={side === "front" ? t("items.targetPrice") : t("items.acquisitionCost")}
      data-testid="flip-tag"
    >
      <div className="flip" data-side={side}>
        <div className="face front">
          <div>
            <span className="k">{t("items.acquisitionCost")}</span>
            <div className="v">
              <Tally value={item.acquisitionCost} locale={locale} size="card" compact />
            </div>
          </div>
          <div className="side">
            {item.retailPrice ? (
              <>
                <b>{t("items.retailPrice")}</b>
                <s>{fmt.money(item.retailPrice)}</s>
                {item.discountVsRetail !== undefined ? (
                  <span className="badge-cut">
                    {t("items.discountVsRetail", { percent: `−${Math.round(item.discountVsRetail * 100)} %` })}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <b>{t("items.sku")}</b>
                <span className="mono text-[12px] opacity-70">{item.sku}</span>
              </>
            )}
          </div>
        </div>
        <div className="face back">
          <div>
            <span className="k">{t("items.targetPrice")}</span>
            <div className="v">
              {item.targetPrice ? (
                <Tally value={item.targetPrice} locale={locale} size="card" compact className="!text-bg" />
              ) : (
                <span className="text-[16px] font-semibold opacity-80">{t("items.noTarget")}</span>
              )}
            </div>
          </div>
          <div className="side">
            {aiRange ? (
              <>
                <b>{t("items.aiRange")}</b>
                <span className="mono text-[12px] opacity-70">{aiRange}</span>
              </>
            ) : null}
            {marginRatio !== undefined ? (
              <span className="badge-cut">{t("items.marginBadge", { percent: pct(marginRatio) })}</span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
