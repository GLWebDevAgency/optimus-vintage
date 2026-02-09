/**
 * 🔒 PLAN ACCESS — Client-side feature gating & quota enforcement
 *
 * Mirrors the server-side PLAN_QUOTAS to provide instant UI feedback
 * before API calls. The server always has the final word.
 *
 * Usage:
 *   const { canAccess, isFeatureLocked, quotaStatus, planName } = usePlanAccess();
 *   if (isFeatureLocked("analytics")) showPaywall();
 *   if (!canAccess("lots")) showQuotaExceededModal();
 */

import { useCallback, useMemo } from "react";

import { useAuthStore, type PlanName } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 PLAN QUOTAS (mirrors server auth-schema.ts)
// ═══════════════════════════════════════════════════════════════════════════════

export type FeatureName =
  | "analytics"
  | "csvExport"
  | "pdfReports"
  | "offline"
  | "pushNotifications"
  | "iaPricing"
  | "iosWidget"
  | "apiAccess"
  | "multiDevice"
  | "customBranding";

export type ResourceName =
  | "lots"
  | "items"
  | "salesPerMonth"
  | "aiScansPerMonth";

interface PlanQuotaConfig {
  maxLots: number;
  maxItems: number;
  maxSalesPerMonth: number;
  maxAIScansPerMonth: number;
  maxPlatforms: number;
  features: Record<FeatureName, boolean>;
}

export const PLAN_QUOTAS: Record<PlanName, PlanQuotaConfig> = {
  starter: {
    maxLots: 3,
    maxItems: 50,
    maxSalesPerMonth: 20,
    maxAIScansPerMonth: 5,
    maxPlatforms: 1,
    features: {
      analytics: false,
      csvExport: false,
      pdfReports: false,
      offline: false,
      pushNotifications: false,
      iaPricing: false,
      iosWidget: false,
      apiAccess: false,
      multiDevice: false,
      customBranding: false,
    },
  },
  premium: {
    maxLots: Infinity,
    maxItems: Infinity,
    maxSalesPerMonth: Infinity,
    maxAIScansPerMonth: 30,
    maxPlatforms: Infinity,
    features: {
      analytics: true,
      csvExport: true,
      pdfReports: false,
      offline: true,
      pushNotifications: true,
      iaPricing: false,
      iosWidget: false,
      apiAccess: false,
      multiDevice: false,
      customBranding: false,
    },
  },
  pro: {
    maxLots: Infinity,
    maxItems: Infinity,
    maxSalesPerMonth: Infinity,
    maxAIScansPerMonth: Infinity,
    maxPlatforms: Infinity,
    features: {
      analytics: true,
      csvExport: true,
      pdfReports: true,
      offline: true,
      pushNotifications: true,
      iaPricing: true,
      iosWidget: true,
      apiAccess: false,
      multiDevice: true,
      customBranding: false,
    },
  },
  business: {
    maxLots: Infinity,
    maxItems: Infinity,
    maxSalesPerMonth: Infinity,
    maxAIScansPerMonth: Infinity,
    maxPlatforms: Infinity,
    features: {
      analytics: true,
      csvExport: true,
      pdfReports: true,
      offline: true,
      pushNotifications: true,
      iaPricing: true,
      iosWidget: true,
      apiAccess: true,
      multiDevice: true,
      customBranding: true,
    },
  },
};

/** Minimum plan required for each feature */
export const FEATURE_REQUIRED_PLAN: Record<FeatureName, PlanName> = {
  analytics: "premium",
  csvExport: "premium",
  pdfReports: "pro",
  offline: "premium",
  pushNotifications: "premium",
  iaPricing: "pro",
  iosWidget: "pro",
  apiAccess: "business",
  multiDevice: "pro",
  customBranding: "business",
};

/** Plan display names for UI */
export const PLAN_DISPLAY_NAMES: Record<PlanName, string> = {
  starter: "Starter",
  premium: "Premium",
  pro: "Pro",
  business: "Business",
};

/** Plan hierarchy for comparison */
const PLAN_ORDER: PlanName[] = ["starter", "premium", "pro", "business"];

export function isPlanAtLeast(
  currentPlan: PlanName,
  requiredPlan: PlanName,
): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🪝 HOOK: usePlanAccess
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlanAccessResult {
  /** Current plan name */
  planName: PlanName;
  /** Display name for current plan */
  planDisplayName: string;
  /** Whether user is on a trial */
  isTrialing: boolean;
  /** Days remaining in trial (null if not trialing) */
  trialDaysRemaining: number | null;
  /** Trial end date ISO string */
  trialEnd: string | null;
  /** Check if a feature is accessible on current plan */
  hasFeature: (feature: FeatureName) => boolean;
  /** Check if a feature is locked (inverse of hasFeature) */
  isFeatureLocked: (feature: FeatureName) => boolean;
  /** Get the required plan name for a locked feature */
  requiredPlanFor: (feature: FeatureName) => PlanName;
  /** Get quota config for current plan */
  quotas: PlanQuotaConfig;
  /** Check if plan is at least the given level */
  isPlanAtLeast: (plan: PlanName) => boolean;
  /** Present paywall if feature is locked — returns true if access granted */
  gateFeature: (feature: FeatureName) => Promise<boolean>;
}

export function usePlanAccess(): PlanAccessResult {
  const user = useAuthStore((s) => s.user);
  const quotas = useAuthStore((s) => s.quotas);
  const { isTrialing, expirationDate, presentPaywall } = useSubscriptionStore();

  const planName: PlanName = user?.plan ?? "starter";
  const planConfig = PLAN_QUOTAS[planName];

  const hasFeature = useCallback(
    (feature: FeatureName): boolean => {
      // Use server quotas if available, else fall back to local config
      if (quotas?.features) {
        return quotas.features[feature] ?? false;
      }
      return planConfig.features[feature] ?? false;
    },
    [planConfig, quotas],
  );

  const isFeatureLocked = useCallback(
    (feature: FeatureName): boolean => !hasFeature(feature),
    [hasFeature],
  );

  const requiredPlanFor = useCallback((feature: FeatureName): PlanName => {
    return FEATURE_REQUIRED_PLAN[feature];
  }, []);

  const checkPlanAtLeast = useCallback(
    (plan: PlanName): boolean => isPlanAtLeast(planName, plan),
    [planName],
  );

  const gateFeature = useCallback(
    async (feature: FeatureName): Promise<boolean> => {
      if (hasFeature(feature)) return true;
      // Feature locked → show paywall
      const purchased = await presentPaywall();
      return purchased;
    },
    [hasFeature, presentPaywall],
  );

  // Calculate trial days remaining
  const trialDaysRemaining = useMemo(() => {
    if (!isTrialing || !expirationDate) return null;
    const now = new Date();
    const end = new Date(expirationDate);
    const days = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, days);
  }, [isTrialing, expirationDate]);

  return {
    planName,
    planDisplayName: PLAN_DISPLAY_NAMES[planName],
    isTrialing,
    trialDaysRemaining,
    trialEnd: isTrialing ? expirationDate : null,
    hasFeature,
    isFeatureLocked,
    requiredPlanFor,
    quotas: planConfig,
    isPlanAtLeast: checkPlanAtLeast,
    gateFeature,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧱 UTILITY: Quota check helpers (for use outside React components)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the current plan's quota for a resource.
 * Used in non-React contexts (e.g., before API calls).
 */
export function getQuotaLimit(resource: ResourceName): number {
  const plan = useAuthStore.getState().user?.plan ?? "starter";
  const config = PLAN_QUOTAS[plan];
  switch (resource) {
    case "lots":
      return config.maxLots;
    case "items":
      return config.maxItems;
    case "salesPerMonth":
      return config.maxSalesPerMonth;
    case "aiScansPerMonth":
      return config.maxAIScansPerMonth;
  }
}

/**
 * Check if a feature is accessible on the current plan.
 * Used in non-React contexts.
 */
export function checkFeatureAccess(feature: FeatureName): boolean {
  const plan = useAuthStore.getState().user?.plan ?? "starter";
  return PLAN_QUOTAS[plan].features[feature] ?? false;
}
