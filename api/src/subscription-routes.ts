/**
 * 💳 SUBSCRIPTION ROUTES — RevenueCat webhook & subscription management
 *
 * Handles:
 * - RevenueCat webhook events (purchases, renewals, cancellations)
 * - Client-side subscription sync
 * - Subscription status queries
 */

import { eq } from "drizzle-orm";
import { Router, type Request, type Response } from "express";

import { requireAuth } from "./auth-routes";
import type { NewSubscription } from "./auth-schema";
import { subscriptions, users } from "./auth-schema";
import { db } from "./db";
import { asyncHandler } from "./middleware";

export const subscriptionRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string; // "TRIAL" | "NORMAL" | "INTRO"
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    store: string; // "APP_STORE" | "PLAY_STORE" | "STRIPE"
    environment: string; // "PRODUCTION" | "SANDBOX"
    is_family_share: boolean;
    country_code: string;
    currency: string;
    price: number;
    price_in_purchased_currency: number;
    transaction_id: string;
    original_transaction_id: string;
    subscriber_attributes: Record<string, { value: string }>;
    // Additional fields per event type
    cancel_reason?: string;
    expiration_reason?: string;
    new_product_id?: string;
  };
}

/**
 * Resolves plan name from RevenueCat entitlements.
 * With single entitlement "Optimus Vintage Pro" → "pro"
 */
function planFromEntitlements(
  entitlementIds: string[],
): "starter" | "premium" | "pro" | "business" {
  // Single entitlement model: any active entitlement = "pro"
  if (entitlementIds.length > 0) {
    return "pro";
  }
  return "starter";
}

/**
 * Extract numeric user ID from RevenueCat app_user_id.
 * Format: "user_123" → 123
 */
function extractUserId(appUserId: string): number | null {
  const match = appUserId.match(/^user_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 WEBHOOK: RevenueCat events
// ═══════════════════════════════════════════════════════════════════════════════

subscriptionRouter.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    // Verify webhook authorization (shared secret)
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${webhookSecret}`) {
        console.warn("[Webhook] Unauthorized webhook attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const body = req.body as RevenueCatWebhookEvent;
    const event = body.event;

    if (!event) {
      return res.status(400).json({ error: "Missing event payload" });
    }

    console.log(`[Webhook] Received: ${event.type} for ${event.app_user_id}`);

    // Skip sandbox events in production
    if (
      process.env.NODE_ENV === "production" &&
      event.environment === "SANDBOX"
    ) {
      console.log("[Webhook] Skipping sandbox event in production");
      return res.status(200).json({ status: "skipped" });
    }

    const userId = extractUserId(event.app_user_id);
    if (!userId) {
      console.warn(`[Webhook] Invalid app_user_id: ${event.app_user_id}`);
      return res.status(200).json({ status: "ignored" });
    }

    try {
      switch (event.type) {
        // ─── Purchase / Renewal events ──────────────────────────────────
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE":
        case "UNCANCELLATION": {
          const plan = planFromEntitlements(event.entitlement_ids);

          // Upsert subscription record
          const existing = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          const subscriptionData: Partial<NewSubscription> = {
            userId,
            plan,
            status: event.period_type === "TRIAL" ? "trialing" : "active",
            storeProductId: event.product_id,
            store: event.store.toLowerCase(),
            currentPeriodStart: new Date(event.purchased_at_ms),
            currentPeriodEnd: event.expiration_at_ms
              ? new Date(event.expiration_at_ms)
              : null,
            trialEnd:
              event.period_type === "TRIAL" && event.expiration_at_ms
                ? new Date(event.expiration_at_ms)
                : null,
            canceledAt: null,
            updatedAt: new Date(),
          };

          if (existing.length > 0) {
            await db
              .update(subscriptions)
              .set(subscriptionData)
              .where(eq(subscriptions.userId, userId));
          } else {
            await db.insert(subscriptions).values({
              ...subscriptionData,
              userId,
              plan,
              createdAt: new Date(),
            } as NewSubscription);
          }

          // Update user plan
          await db
            .update(users)
            .set({ plan, updatedAt: new Date() })
            .where(eq(users.id, userId));

          console.log(`[Webhook] ${event.type}: user ${userId} → plan ${plan}`);
          break;
        }

        // ─── Cancellation events ────────────────────────────────────────
        case "CANCELLATION":
        case "EXPIRATION": {
          // Set subscription to canceled/expired but don't downgrade yet
          // User keeps access until expiration_at_ms
          const status = event.type === "CANCELLATION" ? "canceled" : "expired";

          await db
            .update(subscriptions)
            .set({
              status: status as "canceled" | "expired",
              canceledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));

          // If expired, downgrade to starter
          if (event.type === "EXPIRATION") {
            await db
              .update(users)
              .set({ plan: "starter", updatedAt: new Date() })
              .where(eq(users.id, userId));

            console.log(
              `[Webhook] EXPIRATION: user ${userId} → downgraded to starter`,
            );
          } else {
            console.log(
              `[Webhook] CANCELLATION: user ${userId} — access until expiration`,
            );
          }
          break;
        }

        // ─── Billing issues ────────────────────────────────────────────
        case "BILLING_ISSUE": {
          await db
            .update(subscriptions)
            .set({
              status: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));

          console.log(`[Webhook] BILLING_ISSUE: user ${userId} → past_due`);
          break;
        }

        // ─── Transfer events ────────────────────────────────────────────
        case "TRANSFER": {
          // RevenueCat transferred subscription to a different user
          console.log(
            `[Webhook] TRANSFER: ${event.app_user_id} — handled by RevenueCat`,
          );
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Webhook] Error processing ${event.type}:`, error);
      // Return 200 to prevent RevenueCat retries for unrecoverable errors
      return res.status(200).json({ status: "error_logged" });
    }

    res.status(200).json({ status: "ok" });
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 SYNC: Client-side subscription sync
// ═══════════════════════════════════════════════════════════════════════════════

subscriptionRouter.post(
  "/sync",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { plan, entitlements, expirationDate, isTrialing, productId } =
      req.body;

    if (!plan) {
      return res.status(400).json({ error: "Missing plan" });
    }

    // Update user plan
    await db
      .update(users)
      .set({
        plan: plan as "starter" | "premium" | "pro" | "business",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Upsert subscription record
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const subscriptionData = {
      plan: plan as "starter" | "premium" | "pro" | "business",
      status: (isTrialing ? "trialing" : "active") as "active" | "trialing",
      currentPeriodEnd: expirationDate ? new Date(expirationDate) : null,
      storeProductId: productId ?? null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        userId,
        ...subscriptionData,
        createdAt: new Date(),
      } as NewSubscription);
    }

    res.json({ status: "synced", plan });
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STATUS: Get current subscription status
// ═══════════════════════════════════════════════════════════════════════════════

subscriptionRouter.get(
  "/status",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId));

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    res.json({
      plan: user?.plan ?? "starter",
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEnd: subscription.trialEnd,
            canceledAt: subscription.canceledAt,
            store: subscription.store,
          }
        : null,
    });
  }),
);
