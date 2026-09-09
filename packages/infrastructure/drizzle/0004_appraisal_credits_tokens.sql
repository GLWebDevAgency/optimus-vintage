ALTER TABLE "appraisals" ADD COLUMN "credits" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "appraisals" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "appraisals" ADD COLUMN "output_tokens" integer;