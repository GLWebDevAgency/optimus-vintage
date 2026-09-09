"use client";

import type { Plan, QuotaUsageDto, WorkspaceOverviewDto } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { AppIcon, Button, StitchProgress, useToast } from "@chine/ui";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PLANS as PLAN_CARDS, TRIAL_DAYS } from "@/components/marketing/pricing";
import { keys, useOpenBillingPortal, useStartCheckout } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";

const QUOTAS: (keyof WorkspaceOverviewDto["quotas"])[] = [
  "items",
  "sourcesPerMonth",
  "aiCreditsPerMonth",
];

type Interval = "monthly" | "yearly";
const ORDER: Record<Plan, number> = { FREE: 0, PREMIUM: 1, PRO: 2, BUSINESS: 3 };

/**
 * Formule : plan courant et son état (essai, impayé, résiliation), quotas cousus, dépassement
 * après rétrogradation, choix Chineur / Pro en mensuel ou annuel (Checkout Stripe, essai sans
 * carte), portail de gestion. Gère le retour `?checkout=success|cancel`.
 */
export function PlanCard({ overview }: { overview: WorkspaceOverviewDto }) {
  const t = useT();
  const fmt = useFormat();
  const { show } = useToast();
  const describe = useErrorMessage();
  const checkout = useStartCheckout();
  const portal = useOpenBillingPortal();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [interval, setInterval] = useState<Interval>(
    overview.billing.interval === "yearly" ? "yearly" : "monthly",
  );
  const [pending, setPending] = useState<Plan | null>(null);
  const billing = overview.billing;
  const plan = billing.plan;
  const currency = overview.workspace.currency;
  const returnUrl = () => `${window.location.origin}/app/reglages`;

  // Retour de Stripe : le plan est déjà (ou presque) synchronisé par webhook → on recharge l'espace.
  useEffect(() => {
    const outcome = params.get("checkout");
    if (!outcome) return;
    if (outcome === "success") {
      show(t("billing.thanks"), { kind: "success" });
      void qc.invalidateQueries({ queryKey: keys.workspace });
      const retry = setTimeout(() => void qc.invalidateQueries({ queryKey: keys.workspace }), 4000);
      router.replace(pathname);
      return () => clearTimeout(retry);
    }
    if (outcome === "cancel") show(t("billing.checkoutCanceled"), { kind: "info" });
    router.replace(pathname);
    return undefined;
  }, [params, pathname, qc, router, show, t]);

  const start = async (target: Plan) => {
    if (target === "FREE" || target === "BUSINESS") return;
    setPending(target);
    try {
      show(t("billing.checkoutStarting"), { kind: "info", duration: 2500 });
      const { url } = await checkout.mutateAsync({
        plan: target,
        interval,
        returnUrl: returnUrl(),
      });
      window.location.assign(url);
    } catch (e) {
      show(describe(e), { kind: "error" });
      setPending(null);
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
    q.limit === null
      ? t("billing.unlimited")
      : t("billing.quotaUsage", { used: q.used, limit: q.limit });
  const items = overview.quotas.items;
  const overQuota = items.limit !== null && items.used > items.limit;
  const money = (minor: number) => fmt.money({ minor, currency }, { compact: true });
  const subscribed =
    billing.status === "trialing" || billing.status === "active" || billing.status === "past_due";

  return (
    <div className="card grid gap-4" id="plan" data-testid="plan-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="label">{t("billing.currentPlan")}</span>
          <div className="font-display italic text-[30px] leading-none">
            {t(`billing.plan.${plan}` as MessageKey)}
          </div>
          <div className="text-[12.5px] text-ink-2">
            {t(`billing.planTagline.${plan}` as MessageKey)}
          </div>
        </div>
        <span className={`pill ${plan === "FREE" ? "stock" : "sold"}`}>{plan}</span>
      </div>

      {billing.status === "trialing" && billing.trialEndsAt ? (
        <p className="text-[13px] text-ink-2" data-testid="billing-trial">
          {t("billing.trialUntil", { date: fmt.date(billing.trialEndsAt, "long") })}
        </p>
      ) : null}
      {billing.status === "past_due" ? (
        <div className="rounded-xl bg-thread-soft p-3 text-[13px] text-thread" role="alert">
          <p>{t("billing.pastDue")}</p>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => void openPortal()}>
            {t("billing.pastDueCta")}
          </Button>
        </div>
      ) : null}
      {billing.status === "canceled" && plan === "FREE" ? (
        <p className="text-[13px] text-ink-2">{t("billing.canceledInfo")}</p>
      ) : null}
      {overQuota && items.limit !== null ? (
        <div
          className="rounded-xl bg-brass-soft p-3 text-[13px]"
          role="status"
          data-testid="over-quota"
        >
          <p className="font-bold text-brass">
            {t("billing.overQuota", { used: items.used, limit: items.limit })}
          </p>
          <p className="text-ink-2">{t("billing.overQuotaBody")}</p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {QUOTAS.map((k) => {
          const q = overview.quotas[k];
          const ratio = q.limit === null || q.limit === 0 ? 0 : Math.min(1, q.used / q.limit);
          return (
            <StitchProgress
              key={k}
              value={q.limit === null ? 0.08 : ratio}
              tone={
                q.limit !== null && ratio >= 1 ? "thread" : q.limit === null ? "brass" : "indigo"
              }
              height={10}
              label={t(`billing.quota.${k}` as MessageKey)}
              valueLabel={usage(q)}
            />
          );
        })}
      </div>
      {billing.renewsAt && subscribed && billing.status !== "trialing" ? (
        <span className="label">
          {t(billing.cancelAtPeriodEnd ? "billing.endsOn" : "billing.renewsOn", {
            date: fmt.date(billing.renewsAt, "long"),
          })}
        </span>
      ) : null}

      {/* Choix de formule */}
      <div className="grid gap-2.5" data-testid="plan-chooser">
        <div className="flex items-center justify-between gap-2">
          <span className="label">{t("billing.choosePlan")}</span>
          <div className="flex items-center gap-1 rounded-full bg-surface-2 p-0.5">
            {(["monthly", "yearly"] as const).map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={interval === i}
                className={`min-h-[32px] rounded-full px-3 text-[12px] font-bold ${interval === i ? "bg-ink text-bg" : "text-ink-2"}`}
                onClick={() => setInterval(i)}
              >
                {t(i === "monthly" ? "billing.monthly" : "billing.yearly")}
              </button>
            ))}
          </div>
        </div>
        {PLAN_CARDS.filter((c) => c.id !== "FREE").map((c) => {
          const current = c.id === plan && subscribed;
          const priceMinor = interval === "yearly" ? c.yearlyPerMonthMinor : c.monthlyMinor;
          const saving = c.monthlyMinor * 12 - c.yearlyMinor;
          const upgrade = ORDER[c.id] > ORDER[plan];
          return (
            <div
              key={c.id}
              className={`grid gap-1.5 rounded-2xl border p-3 ${current ? "border-ink" : "border-line"}`}
              data-testid={`plan-option-${c.id}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold">
                  {t(`billing.plan.${c.id}` as MessageKey)}
                  {c.hot && !current ? (
                    <span className="badge-cut ml-2 align-middle">{t("billing.popular")}</span>
                  ) : null}
                </span>
                <span className="tabular text-[15px] font-bold">
                  {t("billing.perMonth", { price: money(priceMinor) })}
                </span>
              </div>
              <p className="text-[12.5px] text-ink-2">{c.tagline}</p>
              <p className="text-[12px] text-ink-3">
                {interval === "yearly"
                  ? `${t("billing.perMonthYearly", { price: money(priceMinor), year: money(c.yearlyMinor) })} · ${t("billing.yearlySaving", { saving: money(saving) })}`
                  : t("billing.trialNote")}
              </p>
              <ul className="grid gap-0.5 text-[12.5px] text-ink-2">
                {c.features
                  .filter((f) => f.on)
                  .slice(0, 4)
                  .map((f) => (
                    <li key={f.label} className="flex items-center gap-1.5">
                      <AppIcon name="check" size={12} />
                      <span>{f.label}</span>
                    </li>
                  ))}
              </ul>
              {c.waitlist ? (
                <span className="label">{t("billing.waitlist")}</span>
              ) : current ? (
                <Button
                  variant="ghost"
                  onClick={() => void openPortal()}
                  loading={portal.isPending}
                >
                  {t("billing.manage")}
                </Button>
              ) : (
                <Button
                  onClick={() => void start(c.id)}
                  loading={pending === c.id}
                  leading={<AppIcon name="sparkle" size={16} />}
                  data-testid={`plan-cta-${c.id}`}
                >
                  {subscribed
                    ? t("billing.switchTo", { plan: t(`billing.plan.${c.id}` as MessageKey) })
                    : upgrade && billing.status !== "canceled"
                      ? t("billing.tryDays", { days: TRIAL_DAYS })
                      : t("billing.choose")}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        onClick={() => void openPortal()}
        loading={portal.isPending}
        disabled={!billing.portalAvailable}
        title={billing.portalAvailable ? undefined : t("billing.portalUnavailable")}
      >
        {t("settings.portal")}
      </Button>
    </div>
  );
}
