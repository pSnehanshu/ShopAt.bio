ALTER TABLE "currencies" ALTER COLUMN "one_usd_val" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_photos" ALTER COLUMN "is_visible" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_visible" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_photos" ADD COLUMN "is_main" boolean DEFAULT false NOT NULL;