/**
 * 💰 REVENUECAT CONFIG — In-App Purchase Configuration
 *
 * Product IDs, entitlements, and RevenueCat API keys.
 * Uses RevenueCat SDK + RevenueCatUI for native paywalls.
 *
 * Dashboard: https://app.revenuecat.com — Project "Optimus Vintage"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🔑 API KEY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RevenueCat API key for the "Optimus Vintage" project.
 * In production, swap to platform-specific keys via env vars:
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 *
 * Current key is the test/sandbox key from RevenueCat dashboard.
 */
export const REVENUECAT_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  "test_jnfbtSOhiXNvbUOJegdwHrIvngr";

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ ENTITLEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The single entitlement configured in RevenueCat Dashboard.
 * Grants access to all Pro features when active.
 */
export const ENTITLEMENT_ID = "Optimus Vintage Pro";

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 PRODUCT IDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Product identifiers matching RevenueCat Products dashboard.
 * Must also match App Store Connect / Google Play Console products.
 */
export const PRODUCT_IDS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const REVENUECAT_CONFIG = {
  /** Free trial duration in days */
  trialDays: 7,

  /** Whether to verify purchases server-side */
  serverSideVerification: true,

  /** Webhook endpoint for RevenueCat events */
  webhookEndpoint: "/api/subscriptions/webhook",
} as const;
