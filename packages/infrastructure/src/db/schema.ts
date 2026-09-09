/**
 * Schéma Drizzle (PostgreSQL) de Chiné — multi-tenant natif.
 * Chaque table métier porte un `workspace_id` indexé ; l'argent est stocké en unités mineures
 * entières (bigint) accompagné de sa devise, jamais en flottant.
 */
import {
  CATEGORIES,
  CONDITIONS,
  CURRENCIES,
  ERAS,
  GENDERS,
  ITEM_STATUSES,
  type Measurements,
  type PhotoRef,
  PLANS,
  PLATFORMS,
  SALE_STATUSES,
  SOURCE_KINDS,
  type SourceLocation,
  SUPPLIER_KINDS,
} from "@chine/domain";
import {
  bigint,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Énumérations (alignées sur les constantes du domaine) ──────────────────
export const currencyEnum = pgEnum("currency", CURRENCIES);
export const localeEnum = pgEnum("locale", ["fr", "en", "de"]);
export const planEnum = pgEnum("plan", PLANS);
export const targetMarginKindEnum = pgEnum("target_margin_kind", ["PERCENT", "AMOUNT_MINOR"]);
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "MANAGER", "SELLER"]);
export const sourceKindEnum = pgEnum("source_kind", SOURCE_KINDS);
export const supplierKindEnum = pgEnum("supplier_kind", SUPPLIER_KINDS);
export const allocationPolicyEnum = pgEnum("allocation_policy", ["EVEN", "BY_WEIGHT", "MANUAL"]);
export const itemStatusEnum = pgEnum("item_status", ITEM_STATUSES);
export const categoryEnum = pgEnum("category", CATEGORIES);
export const conditionEnum = pgEnum("condition", CONDITIONS);
export const genderEnum = pgEnum("gender", GENDERS);
export const eraEnum = pgEnum("era", ERAS);
export const platformEnum = pgEnum("platform", PLATFORMS);
export const listingStatusEnum = pgEnum("listing_status", ["ACTIVE", "ENDED", "SOLD"]);
export const saleStatusEnum = pgEnum("sale_status", SALE_STATUSES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

/** Grille de frais surchargée par plateforme (forme de `FeeSchedule` du domaine). */
export type FeeOverridesJson = Partial<
  Record<string, { percent: number; fixedMinor: number; minMinor?: number; note?: string }>
>;

// ── Espaces de travail ─────────────────────────────────────────────────────
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    name: text("name").notNull(),
    currency: currencyEnum("currency").notNull(),
    locale: localeEnum("locale").notNull().default("fr"),
    targetMarginKind: targetMarginKindEnum("target_margin_kind").notNull().default("PERCENT"),
    targetMarginValue: integer("target_margin_value").notNull().default(0),
    plan: planEnum("plan").notNull().default("FREE"),
    skuPrefix: text("sku_prefix").notNull(),
    skuCounter: integer("sku_counter").notNull().default(0),
    feeOverrides: jsonb("fee_overrides").$type<FeeOverridesJson>().notNull().default({}),
    monthlyGoalMinor: integer("monthly_goal_minor"),
    /** Seuil (jours) au-delà duquel une pièce vendable est considérée dormante. */
    dormantThresholdDays: integer("dormant_threshold_days").notNull().default(30),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    /** Statut Stripe brut (trialing, active, past_due, canceled…) ; null sans abonnement. */
    subscriptionStatus: text("subscription_status"),
    subscriptionInterval: text("subscription_interval"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "date" }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true, mode: "date" }),
    /** Un seul essai gratuit par espace. */
    trialUsedAt: timestamp("trial_used_at", { withTimezone: true, mode: "date" }),
    /** Horodatage Stripe (`event.created`) du dernier événement appliqué : ignore les retards. */
    billingSyncedAt: timestamp("billing_synced_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [
    // Produit mono-espace : un propriétaire = un espace (empêche la course à la première connexion).
    uniqueIndex("workspaces_owner_idx").on(t.ownerUserId),
    uniqueIndex("workspaces_stripe_customer_idx").on(t.stripeCustomerId),
  ],
);

// ── Événements Stripe traités (idempotence des webhooks) ────────────────────
export const stripeEvents = pgTable(
  "stripe_events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stripe_events_processed_idx").on(t.processedAt)],
);

// ── Clés d'idempotence des mutations (rejeu de la file hors ligne) ─────────
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    /** Réponse mémorisée ; null tant que la requête d'origine est en cours. */
    status: integer("status"),
    body: jsonb("body").$type<unknown>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.key] }),
    index("idempotency_keys_created_idx").on(t.createdAt),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: memberRoleEnum("role").notNull().default("SELLER"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index("workspace_members_user_idx").on(t.userId),
  ],
);

// ── Sources d'achat ────────────────────────────────────────────────────────
export const purchaseSources = pgTable(
  "purchase_sources",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: sourceKindEnum("kind").notNull(),
    name: text("name").notNull(),
    supplierName: text("supplier_name"),
    supplierKind: supplierKindEnum("supplier_kind").notNull(),
    purchasedAt: date("purchased_at", { mode: "string" }).notNull(),
    goodsCostMinor: bigint("goods_cost_minor", { mode: "number" }).notNull(),
    extraCostsMinor: bigint("extra_costs_minor", { mode: "number" }).notNull().default(0),
    currency: currencyEnum("currency").notNull(),
    announcedQuantity: integer("announced_quantity"),
    receivedQuantity: integer("received_quantity"),
    weightKg: doublePrecision("weight_kg"),
    location: jsonb("location").$type<SourceLocation>(),
    allocationPolicy: allocationPolicyEnum("allocation_policy").notNull().default("EVEN"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("purchase_sources_workspace_idx").on(t.workspaceId),
    index("purchase_sources_workspace_purchased_idx").on(t.workspaceId, t.purchasedAt),
    index("purchase_sources_workspace_created_idx").on(t.workspaceId, t.createdAt),
  ],
);

// ── Pièces (inventaire) ────────────────────────────────────────────────────
export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => purchaseSources.id, { onDelete: "restrict" }),
    sku: text("sku").notNull(),
    title: text("title").notNull(),
    brand: text("brand"),
    category: categoryEnum("category").notNull(),
    gender: genderEnum("gender"),
    size: text("size"),
    condition: conditionEnum("condition").notNull(),
    era: eraEnum("era"),
    colors: jsonb("colors").$type<readonly string[]>().notNull().default([]),
    materials: jsonb("materials").$type<readonly string[]>().notNull().default([]),
    measurements: jsonb("measurements").$type<Measurements>(),
    acquisitionCostMinor: bigint("acquisition_cost_minor", { mode: "number" }).notNull(),
    retailPriceMinor: bigint("retail_price_minor", { mode: "number" }),
    targetPriceMinor: bigint("target_price_minor", { mode: "number" }),
    currency: currencyEnum("currency").notNull(),
    status: itemStatusEnum("status").notNull().default("IN_STOCK"),
    photos: jsonb("photos").$type<readonly PhotoRef[]>().notNull().default([]),
    bin: text("bin"),
    notes: text("notes"),
    /**
     * Identifiant local fourni par le client (capture hors ligne) : rend la création idempotente
     * lors de la synchronisation. Hors du modèle de domaine, géré par le repository.
     */
    clientId: text("client_id"),
    ...timestamps,
    listedAt: timestamp("listed_at", { withTimezone: true, mode: "date" }),
    soldAt: timestamp("sold_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("items_workspace_status_idx").on(t.workspaceId, t.status),
    index("items_workspace_source_idx").on(t.workspaceId, t.sourceId),
    index("items_workspace_created_idx").on(t.workspaceId, t.createdAt),
    uniqueIndex("items_workspace_sku_idx").on(t.workspaceId, t.sku),
    uniqueIndex("items_workspace_client_idx").on(t.workspaceId, t.clientId),
  ],
);

// ── Annonces ───────────────────────────────────────────────────────────────
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
    currency: currencyEnum("currency").notNull(),
    listedAt: date("listed_at", { mode: "string" }).notNull(),
    url: text("url"),
    status: listingStatusEnum("status").notNull().default("ACTIVE"),
    endedAt: date("ended_at", { mode: "string" }),
  },
  (t) => [
    index("listings_workspace_item_idx").on(t.workspaceId, t.itemId),
    index("listings_workspace_status_idx").on(t.workspaceId, t.status),
  ],
);

// ── Ventes ─────────────────────────────────────────────────────────────────
export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => purchaseSources.id, { onDelete: "restrict" }),
    platform: platformEnum("platform").notNull(),
    grossPriceMinor: bigint("gross_price_minor", { mode: "number" }).notNull(),
    platformFeesMinor: bigint("platform_fees_minor", { mode: "number" }).notNull().default(0),
    shippingCostMinor: bigint("shipping_cost_minor", { mode: "number" }).notNull().default(0),
    packagingCostMinor: bigint("packaging_cost_minor", { mode: "number" }).notNull().default(0),
    otherCostsMinor: bigint("other_costs_minor", { mode: "number" }).notNull().default(0),
    acquisitionCostMinor: bigint("acquisition_cost_minor", { mode: "number" }).notNull(),
    currency: currencyEnum("currency").notNull(),
    soldAt: date("sold_at", { mode: "string" }).notNull(),
    status: saleStatusEnum("status").notNull().default("COMPLETED"),
    buyer: text("buyer"),
    notes: text("notes"),
    ...timestamps,
    refundedAt: timestamp("refunded_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("sales_workspace_sold_idx").on(t.workspaceId, t.soldAt),
    index("sales_workspace_item_idx").on(t.workspaceId, t.itemId),
    index("sales_workspace_source_idx").on(t.workspaceId, t.sourceId),
  ],
);

// ── Expertises IA ──────────────────────────────────────────────────────────
/** Corps d'une expertise tel que stocké en JSON (Money sérialisé en `{ minor, currency }`). */
export type AppraisalPayloadJson = Record<string, unknown>;

export const appraisals = pgTable(
  "appraisals",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    latencyMs: integer("latency_ms").notNull().default(0),
    /** Crédits IA décomptés du quota mensuel (1 par expertise ; le studio photo en coûtera plus). */
    credits: integer("credits").notNull().default(1),
    /** Jetons facturés par le fournisseur (entrée / sortie, réflexion incluse) ; null si inconnus. */
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    payload: jsonb("payload").$type<AppraisalPayloadJson>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("appraisals_workspace_created_idx").on(t.workspaceId, t.createdAt),
    index("appraisals_workspace_item_idx").on(t.workspaceId, t.itemId),
  ],
);

// ── Boîte d'envoi des événements de domaine (outbox) ───────────────────────
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    attempts: integer("attempts").notNull().default(0),
  },
  (t) => [
    index("outbox_events_published_idx").on(t.publishedAt, t.occurredAt),
    index("outbox_events_workspace_idx").on(t.workspaceId, t.occurredAt),
  ],
);

// ── Limiteur de débit persistant (fenêtre fixe par clé) ────────────────────
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    windowStart: timestamp("window_start", { withTimezone: true, mode: "date" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [index("rate_limits_window_idx").on(t.windowStart)],
);

// ── Types de lignes ────────────────────────────────────────────────────────
export type RateLimitRow = typeof rateLimits.$inferSelect;
export type StripeEventRow = typeof stripeEvents.$inferSelect;
export type IdempotencyKeyRow = typeof idempotencyKeys.$inferSelect;
export type WorkspaceRow = typeof workspaces.$inferSelect;
export type NewWorkspaceRow = typeof workspaces.$inferInsert;
export type WorkspaceMemberRow = typeof workspaceMembers.$inferSelect;
export type PurchaseSourceRow = typeof purchaseSources.$inferSelect;
export type NewPurchaseSourceRow = typeof purchaseSources.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;
export type SaleRow = typeof sales.$inferSelect;
export type NewSaleRow = typeof sales.$inferInsert;
export type AppraisalRow = typeof appraisals.$inferSelect;
export type NewAppraisalRow = typeof appraisals.$inferInsert;
export type OutboxEventRow = typeof outboxEvents.$inferSelect;
export type NewOutboxEventRow = typeof outboxEvents.$inferInsert;
