CREATE TABLE "customer_password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_account_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD COLUMN "password_changed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "customer_password_reset_tokens" ADD CONSTRAINT "customer_password_reset_tokens_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_password_reset_tokens_hash_unique" ON "customer_password_reset_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "customer_password_reset_tokens_account_idx" ON "customer_password_reset_tokens" USING btree ("customer_account_id");
--> statement-breakpoint
CREATE INDEX "customer_password_reset_tokens_expiry_idx" ON "customer_password_reset_tokens" USING btree ("expires_at");
