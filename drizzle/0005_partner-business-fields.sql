ALTER TABLE "partners" ADD COLUMN "whatsapp_phone" varchar(32);--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "hide_address" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "currency" varchar(3) DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "language" varchar(10) DEFAULT 'pt-BR' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "business_type" varchar(80);--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "business_hours" text;