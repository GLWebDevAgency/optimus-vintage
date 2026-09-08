/**
 * 🔐 AUTH SCHEMA — Users & Subscriptions tables
 *
 * PostgreSQL schema for authentication and subscription management.
 */

import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "starter",
  "premium",
  "pro",
  "business",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "apple",
  "google",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// 👤 USERS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"), // null for social logins
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),

  // Auth provider
  authProvider: authProviderEnum("auth_provider").notNull().default("email"),
  providerId: text("provider_id"), // External provider ID (Apple/Google)

  // Subscription
  plan: subscriptionPlanEnum("plan").notNull().default("starter"),

  // Status flags
  emailVerified: boolean("email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  // Metadata
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 SUBSCRIPTIONS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Plan info
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),

  // RevenueCat integration
  revenuecatId: text("revenuecat_id"), // RevenueCat customer ID
  storeProductId: text("store_product_id"), // IAP product identifier
  store: text("store"), // "app_store" | "play_store" | "stripe"

  // Dates
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEnd: timestamp("trial_end"),
  canceledAt: timestamp("canceled_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 REFRESH TOKENS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;

// Plan quotas for paywall enforcement
export const PLAN_QUOTAS = {
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
} as const;

export type PlanName = keyof typeof PLAN_QUOTAS;

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ TRIAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const TRIAL_CONFIG = {
  /** Trial duration in days */
  durationDays: 14,
  /** Plan granted during trial */
  trialPlan: "premium" as PlanName,
  /** Plan after trial expires (if no purchase) */
  fallbackPlan: "starter" as PlanName,
} as const;
