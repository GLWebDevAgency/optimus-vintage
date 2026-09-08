/**
 * 🔐 AUTH STORE — Client-side authentication state
 *
 * Features:
 * - JWT access token + refresh token management
 * - Secure storage via expo-secure-store (native) / localStorage (web)
 * - Auto-refresh on token expiry
 * - User profile & plan info
 * - Login/Register/Logout flows
 */

import { Platform } from "react-native";
import { create } from "zustand";

import { API_URL } from "@/constants/Config";

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PlanName = "starter" | "premium" | "pro" | "business";

export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  plan: PlanName;
  authProvider: "email" | "apple" | "google";
  emailVerified: boolean;
  createdAt: string;
}

export interface TrialInfo {
  isTrialing: boolean;
  trialEnd?: string;
  daysRemaining?: number;
  trialPlan?: PlanName;
  expired?: boolean;
}

export interface PlanQuotas {
  maxLots: number;
  maxItems: number;
  maxSalesPerMonth: number;
  maxAIScansPerMonth: number;
  maxPlatforms: number;
  features: Record<string, boolean>;
}

interface AuthState {
  // State
  user: AuthUser | null;
  quotas: PlanQuotas | null;
  trial: TrialInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser, quotas: PlanQuotas) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 SECURE TOKEN STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem("ov_access_token");
    }
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync("ov_access_token");
  },

  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem("ov_access_token", token);
      return;
    }
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync("ov_access_token", token);
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem("ov_refresh_token");
    }
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync("ov_refresh_token");
  },

  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem("ov_refresh_token", token);
      return;
    }
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync("ov_refresh_token", token);
  },

  async clearAll(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem("ov_access_token");
      localStorage.removeItem("ov_refresh_token");
      return;
    }
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync("ov_access_token");
    await SecureStore.deleteItemAsync("ov_refresh_token");
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌐 API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const AUTH_URL = API_URL.replace(/\/api$/, "/api/auth");

async function authFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${AUTH_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function authFetchWithToken(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await TokenStorage.getAccessToken();
  return authFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  quotas: null,
  trial: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authFetch("/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || "Erreur d'inscription",
        });
        return false;
      }

      await TokenStorage.setAccessToken(data.accessToken);
      await TokenStorage.setRefreshToken(data.refreshToken);

      set({
        user: data.user,
        quotas: data.quotas,
        trial: data.trial ?? null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({ isLoading: false, error: e.message || "Erreur réseau" });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || "Erreur de connexion",
        });
        return false;
      }

      await TokenStorage.setAccessToken(data.accessToken);
      await TokenStorage.setRefreshToken(data.refreshToken);

      set({
        user: data.user,
        quotas: data.quotas,
        trial: data.trial ?? null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({ isLoading: false, error: e.message || "Erreur réseau" });
      return false;
    }
  },

  logout: async () => {
    try {
      await authFetchWithToken("/logout", { method: "POST" });
    } catch {
      // Proceed even if API call fails
    }
    await TokenStorage.clearAll();
    set({
      user: null,
      quotas: null,
      trial: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshSession: async () => {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const res = await authFetch("/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Refresh failed — clear tokens
        await TokenStorage.clearAll();
        set({ user: null, quotas: null, isAuthenticated: false });
        return false;
      }

      await TokenStorage.setAccessToken(data.accessToken);
      await TokenStorage.setRefreshToken(data.refreshToken);

      if (data.quotas) {
        set({ quotas: data.quotas });
      }
      return true;
    } catch {
      return false;
    }
  },

  fetchMe: async () => {
    try {
      const res = await authFetchWithToken("/me");
      const data = await res.json();

      if (res.ok) {
        set({
          user: data.user,
          quotas: data.quotas,
          trial: data.trial ?? null,
          isAuthenticated: true,
        });
      } else if (res.status === 401) {
        // Try refresh
        const refreshed = await get().refreshSession();
        if (refreshed) {
          // Retry fetchMe after refresh
          const retryRes = await authFetchWithToken("/me");
          const retryData = await retryRes.json();
          if (retryRes.ok) {
            set({
              user: retryData.user,
              quotas: retryData.quotas,
              trial: retryData.trial ?? null,
              isAuthenticated: true,
            });
          }
        }
      }
    } catch {
      // Silently fail — user stays unauthenticated
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user, quotas) => set({ user, quotas, isAuthenticated: true }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY: Get fresh access token (for API client use)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAccessToken(): Promise<string | null> {
  const token = await TokenStorage.getAccessToken();
  if (!token) return null;

  // Check if token is about to expire (decode without verify)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresIn = payload.exp * 1000 - Date.now();

    // If token expires in less than 2 minutes, refresh
    if (expiresIn < 120_000) {
      const refreshed = await useAuthStore.getState().refreshSession();
      if (refreshed) {
        return TokenStorage.getAccessToken();
      }
      return null;
    }
    return token;
  } catch {
    return token; // Return as-is if decoding fails
  }
}
