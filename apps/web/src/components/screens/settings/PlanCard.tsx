"use client";

import type { QuotaUsageDto, WorkspaceOverviewDto } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { AppIcon, Button, StitchProgress, useToast } from "@chine/ui";
import { useOpenBillingPortal, useStartCheckout } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";

const QUOTAS: (keyof WorkspaceOverviewDto["quotas"])[] = ["items", "sourcesPerMonth", "aiAppraisalsPerMonth", "members"];

/** Formule : plan courant, quotas cousus, passer à Premium (Stripe Checkout), portail. */
export function PlanCard({ overview }: { overview: WorkspaceOverviewDto }) {
  const t = useT();
  const fmt = useFormat();
  const { show } = useToast();
  const describe = useErrorMessage();
  const checkout = useStartCheckout();
  const portal = useOpenBillingPortal();
  const plan = overview.billing.plan;
  const returnUrl = () => `${window.location.origin}/app/reglages`;

  const upgrade = async () => {
    try {
      show(t("billing.checkoutStarting"), { kind: "info", duration: 2500 });
      const { url } = await checkout.mutateAsync({ plan: "PREMIUM", interval: "monthly", returnUrl: returnUrl() });
      window.location.assign(url);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };
  const openPortal = async () => {
    try {
      const { url } = await portal.mutateAsync(returnUrl());
      window.location.assign(url);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const usage = (q: QuotaUsageDto) =>
    q.limit === null ? t("billing.unlimited") : t("billing.quotaUsage", { used: q.used, limit: q.limit });

  return (
    <div className="card grid gap-4" id="plan" data-testid="plan-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="label">{t("billing.currentPlan")}</span>
          <div className="font-display italic text-[30px] leading-none">{t(`billing.plan.${plan}` as MessageKey)}</div>
          <div className="text-[12.5px] text-ink-2">{t(`billing.planTagline.${plan}` as MessageKey)}</div>
        </div>
        <span className={`pill ${plan === "FREE" ? "stock" : "sold"}`}>{plan}</span>
      </div>
      <div className="grid gap-3">
        {QUOTAS.map((k) => {
          const q = overview.quotas[k];
          const ratio = q.limit === null || q.limit === 0 ? 0 : Math.min(1, q.used / q.limit);
          return (
            <StitchProgress
              key={k}
              value={q.limit === null ? 0.08 : ratio}
              tone={q.limit !== null && ratio >= 1 ? "thread" : q.limit === null ? "brass" : "indigo"}
              height={10}
              label={t(`billing.quota.${k}` as MessageKey)}
              valueLabel={usage(q)}
            />
          );
        })}
      </div>
      {overview.billing.renewsAt ? (
        <span className="label">
          {t(overview.billing.cancelAtPeriodEnd ? "billing.endsOn" : "billing.renewsOn", {
            date: fmt.date(overview.billing.renewsAt, "long"),
          })}
        </span>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        {plan === "FREE" ? (
          <Button onClick={() => void upgrade()} loading={checkout.isPending} leading={<AppIcon name="sparkle" size={16} />}>
            {t("settings.upgrade")}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => void openPortal()}
          loading={portal.isPending}
          disabled={!overview.billing.portalAvailable}
          title={overview.billing.portalAvailable ? undefined : t("billing.portalUnavailable")}
        >
          {t("settings.portal")}
        </Button>
      </div>
    </div>
  );
}
