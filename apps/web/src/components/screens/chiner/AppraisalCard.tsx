"use client";

import type { AppraisalDto } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { AppIcon, Button } from "@chine/ui";
import Link from "next/link";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { label } from "../common/labels";

export type AppraisalState =
  | { readonly status: "idle" }
  | { readonly status: "running" }
  | { readonly status: "done"; readonly data: AppraisalDto }
  | { readonly status: "locked" }
  | { readonly status: "quota" }
  | { readonly status: "offline" }
  | { readonly status: "failed"; readonly message: string };

/** Carte IA superposée à la photo : « Reconnu · 92 % » puis marque · catégorie · époque · fourchette. */
export function AppraisalOverlay({ state }: { state: AppraisalState }) {
  const t = useT();
  const fmt = useFormat();
  const { intl } = useLocale();
  if (state.status === "running") {
    return (
      <>
        <span className="l">{t("appraisal.analyzing")}</span>
        <span className="t">{t("chine.appraising")}</span>
      </>
    );
  }
  if (state.status !== "done") return null;
  const a = state.data;
  const id = a.identification;
  const confidence = new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(
    Math.max(id.brandConfidence, a.price.confidence),
  );
  const parts = [
    id.brand,
    label.category(t, id.category).toLowerCase(),
    id.era !== "UNKNOWN" ? id.era : null,
  ].filter(Boolean);
  return (
    <>
      <span className="l" data-testid="appraisal-recognized">
        {id.brand || id.brandConfidence > 0.5 ? t("chine.recognized", { confidence }) : t("chine.notRecognized")}
      </span>
      <span className="t">
        {parts.join(" · ")}
        {parts.length ? " · " : ""}
        <em>
          {t("chine.estimate", {
            low: fmt.money(a.price.low, { compact: true }),
            high: fmt.money(a.price.high, { compact: true }),
          })}
        </em>
      </span>
    </>
  );
}

/** Sous la photo : conseil d'achat, prix max, ou état verrouillé / quota / échec / hors ligne. */
export function AppraisalCard({
  state,
  onRetry,
  onApplyPrice,
}: {
  state: AppraisalState;
  onRetry: () => void;
  onApplyPrice: (minor: number) => void;
}) {
  const t = useT();
  const fmt = useFormat();
  if (state.status === "idle" || state.status === "running") return null;

  if (state.status === "locked" || state.status === "quota") {
    const locked = state.status === "locked";
    return (
      <div className="card flex items-center gap-3 enter" data-testid="ai-upsell">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-soft text-brass">
          <AppIcon name={locked ? "lock" : "sparkle"} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">
            {locked ? t("chine.aiLockedTitle") : t("chine.aiQuotaTitle")}
          </div>
          <div className="text-[12.5px] text-ink-2">
            {locked ? t("chine.aiLockedBody") : t("appraisal.quotaReached")}
          </div>
        </div>
        <Link href="/app/reglages#plan" className="btn ghost !min-h-[36px] !px-3 !text-[12px] shrink-0">
          {locked ? t("billing.plan.PREMIUM") : t("billing.upgrade")}
        </Link>
      </div>
    );
  }
  if (state.status === "offline") {
    return (
      <p className="loc enter">
        <AppIcon name="cloudOff" size={14} />
        <span>{t("chine.aiOffline")}</span>
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <div className="card flex items-center gap-3 enter">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-thread-soft text-thread">
          <AppIcon name="alert" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{t("chine.aiFailedTitle")}</div>
          <div className="truncate text-[12.5px] text-ink-2">{state.message}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }
  const a = state.data;
  const advice = a.advice;
  const adviceTone =
    advice.action === "STRONG_BUY" || advice.action === "BUY"
      ? "bg-brass-soft text-brass"
      : advice.action === "PASS"
        ? "bg-thread-soft text-thread"
        : "bg-surface-2 text-ink-2";
  return (
    <div className="card grid gap-2.5 enter" data-testid="ai-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`pill ${adviceTone}`} style={{ background: undefined }}>
          {t(`appraisal.adviceLabel.${advice.action}` as MessageKey)}
        </span>
        {advice.maxBuyPrice ? (
          <button
            type="button"
            className="chip !min-h-[32px] !text-[12px]"
            onClick={() => advice.maxBuyPrice && onApplyPrice(advice.maxBuyPrice.minor)}
          >
            {t("chine.aiMaxBuy", { amount: fmt.money(advice.maxBuyPrice, { compact: true }) })}
          </button>
        ) : null}
        <span className="label ml-auto">
          {t("appraisal.demand")} · {t(`appraisal.demandLabel.${a.market.demand}` as MessageKey)}
        </span>
      </div>
      {advice.reasons.length > 0 ? (
        <p className="text-[13px] text-ink-2">{advice.reasons.slice(0, 2).join(" · ")}</p>
      ) : null}
      {a.quota && a.quota.limit !== Number.POSITIVE_INFINITY && Number.isFinite(a.quota.limit) ? (
        <span className="label">{t("appraisal.quota", { used: a.quota.used, limit: a.quota.limit })}</span>
      ) : null}
    </div>
  );
}
