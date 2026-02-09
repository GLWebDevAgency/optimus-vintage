/**
 * 💳 SUBSCRIPTION STORE — RevenueCat integration
 *
 * Manages in-app purchases, subscription status, and plan upgrades.
 * Uses RevenueCat SDK + RevenueCatUI for native paywalls & Customer Center.
 *
 * Architecture:
 * - Single entitlement: "Optimus Vintage Pro"
 * - 3 products: monthly, yearly, lifetime
 * - RevenueCatUI.presentPaywall() for native paywall
 * - RevenueCatUI.presentCustomerCenter() for subscription management
 * - Lazy-import on native only (web gets a no-op fallback)
 */

import { Platform } from "react-native";
import { create } from "zustand";

import { API_URL } from "@/constants/Config";
import { ENTITLEMENT_ID, REVENUECAT_API_KEY } from "@/constants/RevenueCat";
import { getAccessToken, useAuthStore } from "@/store/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SubscriptionState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  isPro: boolean;
  activeProductId: string | null;
  expirationDate: string | null;
  willRenew: boolean;
  isTrialing: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  presentPaywall: () => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<void>;
  checkEntitlements: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  syncWithServer: () => Promise<void>;
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ LAZY IMPORTS (native only)
// ═══════════════════════════════════════════════════════════════════════════════

async function getPurchases() {
  if (Platform.OS === "web") return null;
  try {
    return (await import("react-native-purchases")).default;
  } catch {
    console.warn("[Subscription] react-native-purchases not available");
    return null;
  }
}

async function getRevenueCatUI() {
  if (Platform.OS === "web") return null;
  try {
    return await import("react-native-purchases-ui");
  } catch {
    console.warn("[Subscription] react-native-purchases-ui not available");
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  isInitialized: false,
  isLoading: false,
  isPro: false,
  activeProductId: null,
  expirationDate: null,
  willRenew: false,
  isTrialing: false,
  error: null,

  // ─────────────────────────────────────────────────────────────────────────────
  // 🚀 Initialize RevenueCat SDK
  // ─────────────────────────────────────────────────────────────────────────────
  initialize: async () => {
    if (get().isInitialized) return;

    const Purchases = await getPurchases();
    if (!Purchases) {
      set({ isInitialized: true });
      return;
    }

    try {
      // Skip RevenueCat if using test key in non-dev build
      if (REVENUECAT_API_KEY.startsWith("test_") && !__DEV__) {
        console.warn(
          "[Subscription] Skipping RevenueCat init — test key detected in release build",
        );
        set({ isInitialized: true });
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      // Configure with API key
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: null, // Anonymous until login
      });

      // If user is authenticated, identify them
      const authState = useAuthStore.getState();
      if (authState.user) {
        await Purchases.logIn(`user_${authState.user.id}`);
      }

      // Check current entitlements
      await get().checkEntitlements();

      // Listen for real-time customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        const entitlement = info.entitlements.active[ENTITLEMENT_ID];
        set({
          isPro: !!entitlement,
          activeProductId: entitlement?.productIdentifier ?? null,
          expirationDate: entitlement?.expirationDate ?? null,
          willRenew: entitlement?.willRenew ?? false,
          isTrialing: entitlement?.periodType === "TRIAL",
        });

        // Sync with backend
        get().syncWithServer();
      });

      set({ isInitialized: true });
    } catch (e: any) {
      console.error("[Subscription] Init error:", e);
      set({ isInitialized: true, error: e.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 💎 Present RevenueCatUI Paywall (native modal)
  // ─────────────────────────────────────────────────────────────────────────────
  presentPaywall: async () => {
    const RevenueCatUI = await getRevenueCatUI();
    if (!RevenueCatUI) {
      set({ error: "Paywall non disponible sur le web" });
      return false;
    }

    try {
      const resultPromise = RevenueCatUI.default.presentPaywall({
        displayCloseButton: true,
      });

      // In Expo Go Preview API Mode, this returns null
      if (!resultPromise) {
        console.warn(
          "[Subscription] presentPaywall returned null (Preview API Mode). Use a dev build for full functionality.",
        );
        return false;
      }

      const result = await resultPromise;

      switch (result) {
        case RevenueCatUI.PAYWALL_RESULT.PURCHASED:
        case RevenueCatUI.PAYWALL_RESULT.RESTORED:
          // Entitlement listener will update state
          await get().checkEntitlements();
          await get().syncWithServer();
          return true;
        case RevenueCatUI.PAYWALL_RESULT.CANCELLED:
        case RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED:
        case RevenueCatUI.PAYWALL_RESULT.ERROR:
        default:
          return false;
      }
    } catch (e: any) {
      console.error("[Subscription] Paywall error:", e);
      set({ error: e.message });
      return false;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔒 Present Paywall only if entitlement is NOT active
  // ─────────────────────────────────────────────────────────────────────────────
  presentPaywallIfNeeded: async () => {
    const RevenueCatUI = await getRevenueCatUI();
    if (!RevenueCatUI) return false;

    try {
      const resultPromise = RevenueCatUI.default.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
        displayCloseButton: true,
      });

      if (!resultPromise) {
        console.warn(
          "[Subscription] presentPaywallIfNeeded returned null (Preview API Mode)",
        );
        return false;
      }

      const result = await resultPromise;

      if (result === RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED) {
        // User already has Pro — no paywall shown
        return true;
      }

      const success =
        result === RevenueCatUI.PAYWALL_RESULT.PURCHASED ||
        result === RevenueCatUI.PAYWALL_RESULT.RESTORED;

      if (success) {
        await get().checkEntitlements();
        await get().syncWithServer();
      }

      return success;
    } catch (e: any) {
      console.error("[Subscription] PaywallIfNeeded error:", e);
      return false;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 👤 Present Customer Center (manage subscription, refund, etc.)
  // ─────────────────────────────────────────────────────────────────────────────
  presentCustomerCenter: async () => {
    const RevenueCatUI = await getRevenueCatUI();
    if (!RevenueCatUI) return;

    try {
      const centerPromise = RevenueCatUI.default.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo }) => {
            const entitlement =
              customerInfo.entitlements.active[ENTITLEMENT_ID];
            set({
              isPro: !!entitlement,
              activeProductId: entitlement?.productIdentifier ?? null,
              expirationDate: entitlement?.expirationDate ?? null,
              willRenew: entitlement?.willRenew ?? false,
            });
          },
          onRestoreFailed: ({ error }) => {
            console.error("[CustomerCenter] Restore failed:", error);
          },
        },
      });

      // In Expo Go Preview API Mode, this returns null
      if (centerPromise) {
        await centerPromise;
      } else {
        console.warn(
          "[Subscription] presentCustomerCenter returned null (Preview API Mode). Use a dev build.",
        );
      }
    } catch (e: any) {
      console.error("[Subscription] Customer center error:", e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ Check current entitlement status
  // ─────────────────────────────────────────────────────────────────────────────
  checkEntitlements: async () => {
    const Purchases = await getPurchases();
    if (!Purchases) return;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      set({
        isPro: !!entitlement,
        activeProductId: entitlement?.productIdentifier ?? null,
        expirationDate: entitlement?.expirationDate ?? null,
        willRenew: entitlement?.willRenew ?? false,
        isTrialing: entitlement?.periodType === "TRIAL",
      });

      // Update auth store with pro status
      const authState = useAuthStore.getState();
      if (authState.user) {
        const plan = entitlement ? "pro" : "starter";
        if (authState.user.plan !== plan) {
          authState.setUser({ ...authState.user, plan }, authState.quotas!);
        }
      }
    } catch (e: any) {
      console.error("[Subscription] Check entitlements error:", e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔄 Restore purchases
  // ─────────────────────────────────────────────────────────────────────────────
  restorePurchases: async () => {
    const Purchases = await getPurchases();
    if (!Purchases) return false;

    set({ isLoading: true, error: null });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      set({
        isPro: !!entitlement,
        activeProductId: entitlement?.productIdentifier ?? null,
        expirationDate: entitlement?.expirationDate ?? null,
        willRenew: entitlement?.willRenew ?? false,
        isTrialing: entitlement?.periodType === "TRIAL",
        isLoading: false,
      });

      if (entitlement) {
        await get().syncWithServer();
      }

      return !!entitlement;
    } catch (e: any) {
      console.error("[Subscription] Restore error:", e);
      set({ isLoading: false, error: e.message });
      return false;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔄 Sync subscription status with backend
  // ─────────────────────────────────────────────────────────────────────────────
  syncWithServer: async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const state = get();
      await fetch(`${API_URL}/subscriptions/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: state.isPro ? "pro" : "starter",
          entitlements: state.isPro ? [ENTITLEMENT_ID] : [],
          expirationDate: state.expirationDate,
          isTrialing: state.isTrialing,
          productId: state.activeProductId,
        }),
      });

      // Refresh auth store to get updated quotas
      await useAuthStore.getState().fetchMe();
    } catch (e) {
      console.warn("[Subscription] Server sync failed:", e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 🗑️ Reset (on logout)
  // ─────────────────────────────────────────────────────────────────────────────
  reset: () => {
    set({
      isInitialized: false,
      isLoading: false,
      isPro: false,
      activeProductId: null,
      expirationDate: null,
      willRenew: false,
      isTrialing: false,
      error: null,
    });
  },
}));
