export const PLANS = ["FREE", "PREMIUM", "PRO", "BUSINESS"] as const;
export type Plan = (typeof PLANS)[number];

export const FEATURES = [
  "AI_APPRAISAL",
  "AI_LISTING_COPY",
  "ADVANCED_ANALYTICS",
  "PDF_REPORTS",
  "CSV_EXPORT",
  "ACCOUNTING_EXPORT",
  "QR_LABELS",
  "API_ACCESS",
  "MULTI_USER",
  "CUSTOM_BRANDING",
] as const;
export type Feature = (typeof FEATURES)[number];

export interface PlanLimits {
  readonly maxItems: number;
  readonly maxSourcesPerMonth: number;
  readonly aiAppraisalsPerMonth: number;
  readonly historyMonths: number;
  readonly members: number;
  readonly features: ReadonlySet<Feature>;
}

const F = (...f: Feature[]): ReadonlySet<Feature> => new Set(f);
export const INF = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Readonly<Record<Plan, PlanLimits>> = {
  FREE: {
    maxItems: 60,
    maxSourcesPerMonth: 5,
    aiAppraisalsPerMonth: 8,
    historyMonths: 6,
    members: 1,
    features: F("CSV_EXPORT"),
  },
  PREMIUM: {
    maxItems: INF,
    maxSourcesPerMonth: INF,
    aiAppraisalsPerMonth: 150,
    historyMonths: INF,
    members: 1,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
    ),
  },
  PRO: {
    maxItems: INF,
    maxSourcesPerMonth: INF,
    aiAppraisalsPerMonth: INF,
    historyMonths: INF,
    members: 1,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
      "ACCOUNTING_EXPORT",
      "QR_LABELS",
      "API_ACCESS",
    ),
  },
  BUSINESS: {
    maxItems: INF,
    maxSourcesPerMonth: INF,
    aiAppraisalsPerMonth: INF,
    historyMonths: INF,
    members: 5,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
      "ACCOUNTING_EXPORT",
      "QR_LABELS",
      "API_ACCESS",
      "MULTI_USER",
      "CUSTOM_BRANDING",
    ),
  },
};

export const PLAN_PRICES_EUR: Readonly<Record<Plan, { monthly: number; yearly: number }>> = {
  FREE: { monthly: 0, yearly: 0 },
  PREMIUM: { monthly: 5.99, yearly: 59 },
  PRO: { monthly: 14.99, yearly: 149 },
  BUSINESS: { monthly: 34.99, yearly: 349 },
};

const ORDER: Readonly<Record<Plan, number>> = { FREE: 0, PREMIUM: 1, PRO: 2, BUSINESS: 3 };
export const planAtLeast = (plan: Plan, min: Plan): boolean => ORDER[plan] >= ORDER[min];
export const hasFeature = (plan: Plan, feature: Feature): boolean =>
  PLAN_LIMITS[plan].features.has(feature);
/** Plan minimal qui débloque une fonctionnalité. */
export const minimumPlanFor = (feature: Feature): Plan =>
  PLANS.find((p) => hasFeature(p, feature)) ?? "BUSINESS";

export type QuotaResource = "items" | "sourcesPerMonth" | "aiAppraisalsPerMonth" | "members";
export interface QuotaDecision {
  readonly allowed: boolean;
  readonly used: number;
  readonly limit: number;
  readonly upgradeTo?: Plan;
}

export function checkQuota(plan: Plan, resource: QuotaResource, used: number): QuotaDecision {
  const limits = PLAN_LIMITS[plan];
  const limit =
    resource === "items"
      ? limits.maxItems
      : resource === "sourcesPerMonth"
        ? limits.maxSourcesPerMonth
        : resource === "aiAppraisalsPerMonth"
          ? limits.aiAppraisalsPerMonth
          : limits.members;
  const allowed = used < limit;
  if (allowed) return { allowed, used, limit };
  const upgradeTo = PLANS.find((p) => {
    const l = PLAN_LIMITS[p];
    const cand =
      resource === "items"
        ? l.maxItems
        : resource === "sourcesPerMonth"
          ? l.maxSourcesPerMonth
          : resource === "aiAppraisalsPerMonth"
            ? l.aiAppraisalsPerMonth
            : l.members;
    return ORDER[p] > ORDER[plan] && used < cand;
  });
  return upgradeTo ? { allowed, used, limit, upgradeTo } : { allowed, used, limit };
}
