CREATE TABLE "customer_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "first_name" varchar(80) NOT NULL,
  "last_name" varchar(120) NOT NULL,
  "email" varchar(320) NOT NULL,
  "phone" varchar(15) NOT NULL,
  "birth_date" date NOT NULL,
  "password_hash" text NOT NULL,
  "privacy_accepted_at" timestamp with time zone NOT NULL,
  "privacy_policy_version" varchar(32) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_accounts_email_unique" UNIQUE("email"),
  CONSTRAINT "customer_accounts_phone_unique" UNIQUE("phone"),
  CONSTRAINT "customer_accounts_email_lowercase_check" CHECK ("customer_accounts"."email" = lower("customer_accounts"."email"))
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "account_id" uuid;
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "customers_account_id_idx" ON "customers" USING btree ("account_id");
