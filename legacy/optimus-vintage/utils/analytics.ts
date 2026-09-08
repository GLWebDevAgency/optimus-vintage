/**
 * 📊 ANALYTICS & MONITORING - Standalone Edition
 *
 * Analytics légers sans dépendances externes (pas de Sentry/PostHog)
 * Utilise le console logging et le stockage local
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AnalyticsEvent =
  // Navigation
  | "screen_view"
  | "tab_change"
  // Lots
  | "lot_created"
  | "lot_viewed"
  | "lot_edited"
  | "lot_deleted"
  // Items
  | "item_created"
  | "item_viewed"
  | "item_edited"
  | "item_deleted"
  | "item_photo_added"
  // Sales
  | "sale_created"
  | "sale_viewed"
  | "sale_cancelled"
  // Features
  | "search_performed"
  | "filter_applied"
  | "sort_changed"
  | "export_requested"
  | "share_performed"
  // Onboarding
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_skipped"
  // Errors
  | "error_occurred"
  | "api_error"
  // Performance
  | "app_launched"
  | "app_backgrounded"
  | "app_foregrounded";

export interface AnalyticsEventProperties {
  screen_name?: string;
  previous_screen?: string;
  lot_id?: number;
  lot_type?: string;
  item_id?: number;
  item_brand?: string;
  sale_id?: number;
  sale_amount?: number;
  duration_ms?: number;
  error_message?: string;
  [key: string]: unknown;
}

interface StoredEvent {
  event: AnalyticsEvent;
  properties: AnalyticsEventProperties;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "@optimus_analytics";
const MAX_STORED_EVENTS = 500;

class AnalyticsService {
  private isInitialized = false;
  private sessionId: string;
  private userId: string | null = null;
  private events: StoredEvent[] = [];
  private appStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Charger les events stockés
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }

      // Écouter les changements d'état de l'app
      AppState.addEventListener("change", this.handleAppStateChange);

      this.isInitialized = true;
      console.log("[Analytics] ✅ Initialized - Local storage mode");
    } catch (error) {
      console.warn("[Analytics] Failed to initialize:", error);
      this.isInitialized = true; // Continue sans storage
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.userId = userId;
    console.log("[Analytics] 👤 User identified:", userId, traits);
  }

  /**
   * Reset user identity
   */
  reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    console.log("[Analytics] 🔄 Session reset");
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsEventProperties): void {
    const enrichedEvent: StoredEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        platform: Platform.OS,
      },
      timestamp: new Date().toISOString(),
    };

    // Log to console in dev
    if (__DEV__) {
      console.log(`[Analytics] 📊 ${event}`, enrichedEvent.properties);
    }

    // Store event
    this.events.push(enrichedEvent);

    // Trim if too many events
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
    }

    // Persist asynchronously
    this.persistEvents();
  }

  /**
   * Track screen view
   */
  screen(screenName: string, properties?: AnalyticsEventProperties): void {
    this.track("screen_view", {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, unknown>): void {
    console.error("[Analytics] ❌ Error:", error.message, context);

    this.track("error_occurred", {
      error_message: error.message,
      error_stack: error.stack?.slice(0, 500), // Limiter la taille
      ...context,
    });
  }

  /**
   * Log breadcrumb (for debugging)
   */
  breadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>,
  ): void {
    if (__DEV__) {
      console.log(`[Breadcrumb] 🍞 ${category}: ${message}`, data);
    }
  }

  /**
   * Start timing an event
   */
  startTiming(eventName: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.track(eventName as AnalyticsEvent, { duration_ms: duration });
    };
  }

  /**
   * Get analytics summary (for debugging/settings screen)
   */
  async getSummary(): Promise<{
    totalEvents: number;
    sessionDuration: number;
    eventsByType: Record<string, number>;
  }> {
    const eventsByType: Record<string, number> = {};

    this.events.forEach((e) => {
      eventsByType[e.event] = (eventsByType[e.event] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      sessionDuration: Date.now() - this.appStartTime,
      eventsByType,
    };
  }

  /**
   * Clear all stored events
   */
  async clearEvents(): Promise<void> {
    this.events = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("[Analytics] 🗑️ Events cleared");
  }

  /**
   * Export events (for debugging)
   */
  async exportEvents(): Promise<StoredEvent[]> {
    return [...this.events];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────────────────────────

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private handleAppStateChange = (state: string) => {
    if (state === "background") {
      this.track("app_backgrounded");
    } else if (state === "active") {
      this.track("app_foregrounded");
    }
  };

  private async persistEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {
      // Ignore storage errors
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ PERFORMANCE MONITOR
// ═══════════════════════════════════════════════════════════════════════════════

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Record a timing metric
   */
  record(name: string, durationMs: number): void {
    const existing = this.metrics.get(name) || [];
    existing.push(durationMs);

    // Garder seulement les 100 dernières mesures
    if (existing.length > 100) {
      existing.shift();
    }

    this.metrics.set(name, existing);

    if (__DEV__ && durationMs > 1000) {
      console.warn(`[Perf] ⚠️ Slow operation "${name}": ${durationMs}ms`);
    }
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.record(name, Date.now() - start);
    }
  }

  /**
   * Get stats for a metric
   */
  getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  /**
   * Get all metrics summary
   */
  getAllStats(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const result: Record<
      string,
      { avg: number; min: number; max: number; count: number }
    > = {};

    this.metrics.forEach((_, name) => {
      const stats = this.getStats(name);
      if (stats) result[name] = stats;
    });

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎣 HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook to track screen views
 */
export function useTrackScreen(
  screenName: string,
  properties?: AnalyticsEventProperties,
): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      analytics.screen(screenName, properties);
      hasTracked.current = true;
    }
  }, [screenName]);
}

/**
 * Hook to measure component render time
 */
export function useTrackTiming(
  metricName: string,
): (durationMs: number) => void {
  return (durationMs: number) => {
    performanceMonitor.record(metricName, durationMs);
  };
}

/**
 * Hook to create a timing function
 */
export function useTimedAction(eventName: AnalyticsEvent): () => () => void {
  return () => analytics.startTiming(eventName);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const analytics = new AnalyticsService();
export const performanceMonitor = new PerformanceMonitor();

export default analytics;
