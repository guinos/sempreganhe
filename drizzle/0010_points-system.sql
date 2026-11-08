CREATE TYPE "public"."point_ledger_entry_type" AS ENUM('earned', 'reserved', 'released', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."point_redemption_status" AS ENUM('pending', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."point_redemption_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('main_prize', 'points');--> statement-breakpoint
ALTER TABLE "participations" ADD COLUMN "reward_type" "reward_type" DEFAULT 'main_prize' NOT NULL;--> statement-breakpoint
ALTER TABLE "participations" ADD COLUMN "points_awarded" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "main_prize_probability" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "points_per_participation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "main_prize_max_redemptions" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "main_prize_redemptions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_main_prize_probability_check" CHECK ("promotions"."main_prize_probability" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_points_per_participation_check" CHECK ("promotions"."points_per_participation" >= 0);--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_main_prize_redemptions_check" CHECK ("promotions"."main_prize_redemptions" >= 0 AND "promotions"."main_prize_redemptions" <= "promotions"."main_prize_max_redemptions");--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_points_awarded_check" CHECK ("participations"."points_awarded" >= 0);--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_id_partner_unique" UNIQUE ("id", "partner_id");--> statement-breakpoint
CREATE TABLE "customer_point_balances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "customer_id" uuid NOT NULL,
  "available_points" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_point_balances_scope_unique" UNIQUE("partner_id", "customer_id"),
  CONSTRAINT "customer_point_balances_customer_partner_fk" FOREIGN KEY ("customer_id", "partner_id") REFERENCES "customers"("id", "partner_id"),
  CONSTRAINT "customer_point_balances_range_check" CHECK ("available_points" BETWEEN 0 AND 100)
);--> statement-breakpoint
CREATE TABLE "point_rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "title" text NOT NULL,
  "description" text,
  "redemption_type" "point_redemption_type" NOT NULL,
  "discount_value" integer NOT NULL,
  "cost_points" integer DEFAULT 100 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "point_rewards_id_partner_unique" UNIQUE("id", "partner_id"),
  CONSTRAINT "point_rewards_cost_check" CHECK ("cost_points" = 100),
  CONSTRAINT "point_rewards_value_check" CHECK ("discount_value" > 0)
);--> statement-breakpoint
CREATE TABLE "point_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "customer_id" uuid NOT NULL,
  "point_reward_id" uuid NOT NULL,
  "points_cost" integer NOT NULL,
  "status" "point_redemption_status" DEFAULT 'pending' NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "decided_at" timestamp with time zone,
  "decided_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "point_redemptions_id_partner_unique" UNIQUE("id", "partner_id"),
  CONSTRAINT "point_redemptions_customer_partner_fk" FOREIGN KEY ("customer_id", "partner_id") REFERENCES "customers"("id", "partner_id"),
  CONSTRAINT "point_redemptions_reward_partner_fk" FOREIGN KEY ("point_reward_id", "partner_id") REFERENCES "point_rewards"("id", "partner_id"),
  CONSTRAINT "point_redemptions_cost_check" CHECK ("points_cost" = 100)
);--> statement-breakpoint
CREATE TABLE "customer_points_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "customer_id" uuid NOT NULL,
  "participation_id" uuid,
  "redemption_id" uuid,
  "entry_type" "point_ledger_entry_type" NOT NULL,
  "points_delta" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_points_ledger_customer_partner_fk" FOREIGN KEY ("customer_id", "partner_id") REFERENCES "customers"("id", "partner_id"),
  CONSTRAINT "customer_points_ledger_participation_partner_fk" FOREIGN KEY ("participation_id", "partner_id") REFERENCES "participations"("id", "partner_id"),
  CONSTRAINT "customer_points_ledger_redemption_partner_fk" FOREIGN KEY ("redemption_id", "partner_id") REFERENCES "point_redemptions"("id", "partner_id"),
  CONSTRAINT "customer_points_ledger_balance_check" CHECK ("balance_after" BETWEEN 0 AND 100)
);--> statement-breakpoint
CREATE INDEX "point_rewards_partner_id_idx" ON "point_rewards" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "point_redemptions_partner_id_idx" ON "point_redemptions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "point_redemptions_customer_id_idx" ON "point_redemptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_points_ledger_scope_idx" ON "customer_points_ledger" USING btree ("partner_id", "customer_id", "created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_points_ledger_participation_unique" ON "customer_points_ledger" USING btree ("participation_id", "entry_type");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_points_ledger_redemption_unique" ON "customer_points_ledger" USING btree ("redemption_id", "entry_type");
