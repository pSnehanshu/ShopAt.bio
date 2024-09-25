ALTER TABLE "shops" ADD COLUMN "locale" varchar(10) DEFAULT 'en-IN' NOT NULL;--> statement-breakpoint
ALTER TABLE "currencies" DROP COLUMN IF EXISTS "formatting";