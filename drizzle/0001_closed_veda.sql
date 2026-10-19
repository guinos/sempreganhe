ALTER TABLE "participations" ADD CONSTRAINT "participations_status_fields_check" CHECK ((
        "participations"."status" = 'pending_registration'
        AND "participations"."customer_id" IS NULL
        AND "participations"."registered_at" IS NULL
        AND "participations"."privacy_accepted_at" IS NULL
      ) OR (
        "participations"."status" = 'redeemed'
        AND "participations"."customer_id" IS NOT NULL
        AND "participations"."registered_at" IS NOT NULL
        AND "participations"."privacy_accepted_at" IS NOT NULL
      ));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("users"."email" = lower("users"."email"));