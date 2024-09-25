ALTER TABLE "products" ALTER COLUMN "tax_rate" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tax_rate" DROP NOT NULL;