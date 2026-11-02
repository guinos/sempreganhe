CREATE TABLE "promotion_customer_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"promotion_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"participation_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_customer_usage_scope_unique" UNIQUE("partner_id","promotion_id","customer_id"),
	CONSTRAINT "promotion_customer_usage_count_check" CHECK ("promotion_customer_usage"."participation_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "max_participations_per_customer" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotion_customer_usage" ADD CONSTRAINT "promotion_customer_usage_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_customer_usage" ADD CONSTRAINT "promotion_customer_usage_promotion_partner_fk" FOREIGN KEY ("promotion_id","partner_id") REFERENCES "public"."promotions"("id","partner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_customer_usage" ADD CONSTRAINT "promotion_customer_usage_customer_partner_fk" FOREIGN KEY ("customer_id","partner_id") REFERENCES "public"."customers"("id","partner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "promotion_customer_usage" ("partner_id", "promotion_id", "customer_id", "participation_count")
SELECT "partner_id", "promotion_id", "customer_id", COUNT(*)
FROM "participations"
WHERE "customer_id" IS NOT NULL AND "status" IN ('pending_confirmation', 'redeemed')
GROUP BY "partner_id", "promotion_id", "customer_id";--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_max_participations_check" CHECK ("promotions"."max_participations_per_customer" > 0);
