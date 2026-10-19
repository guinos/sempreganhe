ALTER TYPE "public"."participation_status" ADD VALUE 'pending_confirmation' BEFORE 'redeemed';--> statement-breakpoint
ALTER TYPE "public"."participation_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "participations_status_fields_check";--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_status_fields_check" CHECK ((
        "participations"."status"::text = 'pending_registration'
        AND "participations"."customer_id" IS NULL
        AND "participations"."registered_at" IS NULL
        AND "participations"."privacy_accepted_at" IS NULL
      ) OR (
        "participations"."status"::text IN ('pending_confirmation', 'redeemed', 'rejected')
        AND "participations"."customer_id" IS NOT NULL
        AND "participations"."registered_at" IS NOT NULL
        AND "participations"."privacy_accepted_at" IS NOT NULL
      ));
