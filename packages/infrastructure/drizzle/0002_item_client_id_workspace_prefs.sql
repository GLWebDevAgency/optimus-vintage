ALTER TABLE "items" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "dormant_threshold_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "items_workspace_client_idx" ON "items" USING btree ("workspace_id","client_id");