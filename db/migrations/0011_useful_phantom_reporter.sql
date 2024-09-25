ALTER TABLE "products" ADD COLUMN "tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "default_tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL;