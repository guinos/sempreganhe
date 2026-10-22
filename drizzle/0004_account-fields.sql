ALTER TABLE "users" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "document_type" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "document_number" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_address" text;