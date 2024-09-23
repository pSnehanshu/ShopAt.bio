ALTER TABLE "products" ADD COLUMN "url_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_url_name_shop_id_unique" UNIQUE("url_name","shop_id");