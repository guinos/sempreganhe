CREATE TYPE "public"."participation_status" AS ENUM('pending_registration', 'redeemed');--> statement-breakpoint
CREATE TYPE "public"."promotion_status" AS ENUM('draft', 'active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"promotion_id" uuid NOT NULL,
	"customer_id" uuid,
	"public_token" varchar(128) NOT NULL,
	"prize_description" text NOT NULL,
	"privacy_accepted_at" timestamp with time zone,
	"scraped_at" timestamp with time zone NOT NULL,
	"registered_at" timestamp with time zone,
	"status" "participation_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"prize_description" text NOT NULL,
	"public_code" varchar(128) NOT NULL,
	"status" "promotion_status" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_valid_period_check" CHECK ("promotions"."ends_at" > "promotions"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_promotion_restaurant_fk" FOREIGN KEY ("promotion_id","restaurant_id") REFERENCES "public"."promotions"("id","restaurant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_customer_restaurant_fk" FOREIGN KEY ("customer_id","restaurant_id") REFERENCES "public"."customers"("id","restaurant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_restaurant_phone_unique" ON "customers" USING btree ("restaurant_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_id_restaurant_unique" ON "customers" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE INDEX "customers_restaurant_id_idx" ON "customers" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participations_public_token_unique" ON "participations" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "participations_restaurant_id_idx" ON "participations" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "participations_promotion_id_idx" ON "participations" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "participations_customer_id_idx" ON "participations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_public_code_unique" ON "promotions" USING btree ("public_code");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_id_restaurant_unique" ON "promotions" USING btree ("id","restaurant_id");--> statement-breakpoint
CREATE INDEX "promotions_restaurant_id_idx" ON "promotions" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "promotions_status_idx" ON "promotions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotions_period_idx" ON "promotions" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_slug_unique" ON "restaurants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_restaurant_id_idx" ON "users" USING btree ("restaurant_id");
