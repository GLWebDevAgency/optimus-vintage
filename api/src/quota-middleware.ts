/**
 * 🛡️ QUOTA MIDDLEWARE — Plan-based resource limits
 *
 * Enforces subscription plan quotas on API routes.
 * Checks: lots count, items count, sales/month, AI scans/month.
 */

import { count, gte } from "drizzle-orm";
import type { NextFunction, Response } from "express";

import { PLAN_QUOTAS, type PlanName } from "./auth-schema";
import { db } from "./db";
import { items, lots, sales } from "./schema";

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 QUOTA CHECKER
// ═══════════════════════════════════════════════════════════════════════════════

interface QuotaContext {
  userId: number;
  plan: PlanName;
}

async function getUserQuotaUsage(ctx: QuotaContext) {
  const quotas = PLAN_QUOTAS[ctx.plan];

  // Count lots (all lots belong to the user — currently single-tenant)
  const [{ value: lotsCount }] = await db.select({ value: count() }).from(lots);

  // Count items
  const [{ value: itemsCount }] = await db
    .select({ value: count() })
    .from(items);

  // Count sales this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().split("T")[0];

  const [{ value: salesThisMonth }] = await db
    .select({ value: count() })
    .from(sales)
    .where(gte(sales.saleDate, monthStartStr));

  return {
    lots: { used: lotsCount, max: quotas.maxLots },
    items: { used: itemsCount, max: quotas.maxItems },
    salesPerMonth: { used: salesThisMonth, max: quotas.maxSalesPerMonth },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚧 MIDDLEWARE FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check lot creation quota
 */
export function checkLotQuota(req: any, res: Response, next: NextFunction) {
  if (!req.user) return next(); // Skip if no auth middleware

  const quotas = PLAN_QUOTAS[req.user.plan as PlanName];
  if (quotas.maxLots === Infinity) return next();

  // Async check
  (async () => {
    const [{ value: lotsCount }] = await db
      .select({ value: count() })
      .from(lots);
    if (lotsCount >= quotas.maxLots) {
      return res.status(403).json({
        error: {
          message: `Limite de ${quotas.maxLots} lots atteinte. Passez au plan Premium pour des lots illimités.`,
          code: "QUOTA_EXCEEDED",
          resource: "lots",
          current: lotsCount,
          limit: quotas.maxLots,
          requiredPlan: "premium",
        },
      });
    }
    next();
  })().catch(next);
}

/**
 * Check item creation quota
 */
export function checkItemQuota(req: any, res: Response, next: NextFunction) {
  if (!req.user) return next();

  const quotas = PLAN_QUOTAS[req.user.plan as PlanName];
  if (quotas.maxItems === Infinity) return next();

  (async () => {
    const [{ value: itemsCount }] = await db
      .select({ value: count() })
      .from(items);
    if (itemsCount >= quotas.maxItems) {
      return res.status(403).json({
        error: {
          message: `Limite de ${quotas.maxItems} articles atteinte. Passez au plan Premium pour des articles illimités.`,
          code: "QUOTA_EXCEEDED",
          resource: "items",
          current: itemsCount,
          limit: quotas.maxItems,
          requiredPlan: "premium",
        },
      });
    }
    next();
  })().catch(next);
}

/**
 * Check sale creation quota (monthly)
 */
export function checkSaleQuota(req: any, res: Response, next: NextFunction) {
  if (!req.user) return next();

  const quotas = PLAN_QUOTAS[req.user.plan as PlanName];
  if (quotas.maxSalesPerMonth === Infinity) return next();

  (async () => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const [{ value: salesThisMonth }] = await db
      .select({ value: count() })
      .from(sales)
      .where(gte(sales.saleDate, monthStartStr));

    if (salesThisMonth >= quotas.maxSalesPerMonth) {
      return res.status(403).json({
        error: {
          message: `Limite de ${quotas.maxSalesPerMonth} ventes/mois atteinte. Passez au plan Premium.`,
          code: "QUOTA_EXCEEDED",
          resource: "sales",
          current: salesThisMonth,
          limit: quotas.maxSalesPerMonth,
          requiredPlan: "premium",
        },
      });
    }
    next();
  })().catch(next);
}

/**
 * Check AI scan quota (monthly)
 */
export function checkAIQuota(req: any, res: Response, next: NextFunction) {
  if (!req.user) return next();

  const quotas = PLAN_QUOTAS[req.user.plan as PlanName];
  if (quotas.maxAIScansPerMonth === Infinity) return next();

  // For AI scans, we'd track in a separate counter or analytics
  // For now, pass through — RevenueCat will handle this
  next();
}

/**
 * Check feature access
 */
export function requireFeature(featureName: string) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return next();

    const quotas = PLAN_QUOTAS[req.user.plan as PlanName];
    const features = quotas.features as Record<string, boolean>;

    if (!features[featureName]) {
      return res.status(403).json({
        error: {
          message: `La fonctionnalité "${featureName}" nécessite un plan supérieur.`,
          code: "FEATURE_LOCKED",
          feature: featureName,
          currentPlan: req.user.plan,
        },
      });
    }
    next();
  };
}

/**
 * Get user's current quota usage — useful for the mobile app
 */
export async function getQuotaUsage(req: any, res: Response) {
  const plan = req.user?.plan || "starter";
  const quotas = PLAN_QUOTAS[plan as PlanName];

  const [{ value: lotsCount }] = await db.select({ value: count() }).from(lots);
  const [{ value: itemsCount }] = await db
    .select({ value: count() })
    .from(items);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().split("T")[0];
  const [{ value: salesThisMonth }] = await db
    .select({ value: count() })
    .from(sales)
    .where(gte(sales.saleDate, monthStartStr));

  res.json({
    plan,
    usage: {
      lots: { used: lotsCount, max: quotas.maxLots },
      items: { used: itemsCount, max: quotas.maxItems },
      salesPerMonth: { used: salesThisMonth, max: quotas.maxSalesPerMonth },
      aiScansPerMonth: { used: 0, max: quotas.maxAIScansPerMonth }, // TODO: track
    },
    features: quotas.features,
  });
}
