ALTER TABLE "product_photos" ADD COLUMN "path" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "icon_path" varchar(255);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "cover_path" varchar(255);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "bg_path" varchar(255);--> statement-breakpoint
ALTER TABLE "product_photos" DROP COLUMN IF EXISTS "file_path";