CREATE TYPE "public"."allocation_policy" AS ENUM('EVEN', 'BY_WEIGHT', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('JACKET', 'COAT', 'KNITWEAR', 'SWEATSHIRT', 'SHIRT', 'TSHIRT', 'POLO', 'PANTS', 'JEANS', 'SHORTS', 'DRESS', 'SKIRT', 'SUIT', 'TRACKSUIT', 'SHOES', 'BOOTS', 'SNEAKERS', 'BAG', 'HAT', 'SCARF', 'BELT', 'JEWELRY', 'ACCESSORY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('NEW_WITH_TAGS', 'NEW', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY');--> statement-breakpoint
CREATE TYPE "public"."era" AS ENUM('1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('WOMEN', 'MEN', 'UNISEX', 'KIDS');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('IN_STOCK', 'LISTED', 'RESERVED', 'SOLD', 'RETURNED', 'LOST', 'DONATED');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('ACTIVE', 'ENDED', 'SOLD');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('fr', 'en', 'de');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'MANAGER', 'SELLER');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('FREE', 'PREMIUM', 'PRO', 'BUSINESS');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('VINTED', 'VESTIAIRE', 'LEBONCOIN', 'DEPOP', 'EBAY', 'ETSY', 'WHATNOT', 'INSTAGRAM', 'IN_PERSON', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('COMPLETED', 'PENDING', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('LOT', 'PALLET', 'PICKING', 'UNIT');--> statement-breakpoint
CREATE TYPE "public"."supplier_kind" AS ENUM('WHOLESALER', 'ONLINE_B2B', 'FLEA_MARKET', 'THRIFT_STORE', 'PERSONAL', 'AUCTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."target_margin_kind" AS ENUM('PERCENT', 'AMOUNT_MINOR');--> statement-breakpoint
CREATE TABLE "appraisals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"item_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"category" "category" NOT NULL,
	"gender" "gender",
	"size" text,
	"condition" "condition" NOT NULL,
	"era" "era",
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"measurements" jsonb,
	"acquisition_cost_minor" bigint NOT NULL,
	"retail_price_minor" bigint,
	"target_price_minor" bigint,
	"currency" "currency" NOT NULL,
	"status" "item_status" DEFAULT 'IN_STOCK' NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bin" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"listed_at" timestamp with time zone,
	"sold_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"price_minor" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"listed_at" date NOT NULL,
	"url" text,
	"status" "listing_status" DEFAULT 'ACTIVE' NOT NULL,
	"ended_at" date
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "source_kind" NOT NULL,
	"name" text NOT NULL,
	"supplier_name" text,
	"supplier_kind" "supplier_kind" NOT NULL,
	"purchased_at" date NOT NULL,
	"goods_cost_minor" bigint NOT NULL,
	"extra_costs_minor" bigint DEFAULT 0 NOT NULL,
	"currency" "currency" NOT NULL,
	"announced_quantity" integer,
	"received_quantity" integer,
	"weight_kg" double precision,
	"location" jsonb,
	"allocation_policy" "allocation_policy" DEFAULT 'EVEN' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"gross_price_minor" bigint NOT NULL,
	"platform_fees_minor" bigint DEFAULT 0 NOT NULL,
	"shipping_cost_minor" bigint DEFAULT 0 NOT NULL,
	"packaging_cost_minor" bigint DEFAULT 0 NOT NULL,
	"other_costs_minor" bigint DEFAULT 0 NOT NULL,
	"acquisition_cost_minor" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"sold_at" date NOT NULL,
	"status" "sale_status" DEFAULT 'COMPLETED' NOT NULL,
	"buyer" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refunded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'SELLER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"currency" "currency" NOT NULL,
	"locale" "locale" DEFAULT 'fr' NOT NULL,
	"target_margin_kind" "target_margin_kind" DEFAULT 'PERCENT' NOT NULL,
	"target_margin_value" integer DEFAULT 0 NOT NULL,
	"plan" "plan" DEFAULT 'FREE' NOT NULL,
	"sku_prefix" text NOT NULL,
	"sku_counter" integer DEFAULT 0 NOT NULL,
	"fee_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_goal_minor" integer,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_source_id_purchase_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."purchase_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_sources" ADD CONSTRAINT "purchase_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_source_id_purchase_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."purchase_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appraisals_workspace_created_idx" ON "appraisals" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "appraisals_workspace_item_idx" ON "appraisals" USING btree ("workspace_id","item_id");--> statement-breakpoint
CREATE INDEX "items_workspace_status_idx" ON "items" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "items_workspace_source_idx" ON "items" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "items_workspace_created_idx" ON "items" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "items_workspace_sku_idx" ON "items" USING btree ("workspace_id","sku");--> statement-breakpoint
CREATE INDEX "listings_workspace_item_idx" ON "listings" USING btree ("workspace_id","item_id");--> statement-breakpoint
CREATE INDEX "listings_workspace_status_idx" ON "listings" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "outbox_events_published_idx" ON "outbox_events" USING btree ("published_at","occurred_at");--> statement-breakpoint
CREATE INDEX "outbox_events_workspace_idx" ON "outbox_events" USING btree ("workspace_id","occurred_at");--> statement-breakpoint
CREATE INDEX "purchase_sources_workspace_idx" ON "purchase_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "purchase_sources_workspace_purchased_idx" ON "purchase_sources" USING btree ("workspace_id","purchased_at");--> statement-breakpoint
CREATE INDEX "purchase_sources_workspace_created_idx" ON "purchase_sources" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "sales_workspace_sold_idx" ON "sales" USING btree ("workspace_id","sold_at");--> statement-breakpoint
CREATE INDEX "sales_workspace_item_idx" ON "sales" USING btree ("workspace_id","item_id");--> statement-breakpoint
CREATE INDEX "sales_workspace_source_idx" ON "sales" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_idx" ON "workspaces" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_stripe_customer_idx" ON "workspaces" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");