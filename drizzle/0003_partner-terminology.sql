ALTER TABLE "restaurants" RENAME TO "partners";--> statement-breakpoint
ALTER TABLE "customers" RENAME COLUMN "restaurant_id" TO "partner_id";--> statement-breakpoint
ALTER TABLE "participations" RENAME COLUMN "restaurant_id" TO "partner_id";--> statement-breakpoint
ALTER TABLE "promotions" RENAME COLUMN "restaurant_id" TO "partner_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "restaurant_id" TO "partner_id";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_restaurant_id_restaurants_id_fk";--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "participations_restaurant_id_restaurants_id_fk";--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "participations_promotion_restaurant_fk";--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "participations_customer_restaurant_fk";--> statement-breakpoint
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_restaurant_id_restaurants_id_fk";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_restaurant_id_restaurants_id_fk";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_id_restaurant_unique";--> statement-breakpoint
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_id_restaurant_unique";--> statement-breakpoint
DROP INDEX "customers_restaurant_phone_unique";--> statement-breakpoint
DROP INDEX "customers_restaurant_id_idx";--> statement-breakpoint
DROP INDEX "participations_restaurant_id_idx";--> statement-breakpoint
DROP INDEX "promotions_restaurant_id_idx";--> statement-breakpoint
DROP INDEX "restaurants_slug_unique";--> statement-breakpoint
DROP INDEX "users_restaurant_id_idx";--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_id_partner_unique" UNIQUE("id","partner_id");--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_id_partner_unique" UNIQUE("id","partner_id");--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_promotion_partner_fk" FOREIGN KEY ("promotion_id","partner_id") REFERENCES "public"."promotions"("id","partner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_customer_partner_fk" FOREIGN KEY ("customer_id","partner_id") REFERENCES "public"."customers"("id","partner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_partner_phone_unique" ON "customers" USING btree ("partner_id","phone");--> statement-breakpoint
CREATE INDEX "customers_partner_id_idx" ON "customers" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "participations_partner_id_idx" ON "participations" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "promotions_partner_id_idx" ON "promotions" USING btree ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_slug_unique" ON "partners" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_partner_id_idx" ON "users" USING btree ("partner_id");
