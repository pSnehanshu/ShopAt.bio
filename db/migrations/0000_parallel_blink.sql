CREATE TABLE IF NOT EXISTS "currencies" (
	"symbol" varchar(3) PRIMARY KEY NOT NULL,
	"full_name" varchar(30),
	"multiplier" integer NOT NULL,
	"one_usd_val" integer DEFAULT 1,
	"formatting" varchar(10),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_visible" boolean DEFAULT true,
	"caption" varchar(255),
	"product_id" uuid NOT NULL,
	"file_path" varchar GENERATED ALWAYS AS ('product-photos/' || "product_photos"."product_id" || '/shopat_pic_' || "product_photos"."id") STORED
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_visible" boolean DEFAULT true,
	"shop_id" uuid NOT NULL,
	"qty" integer DEFAULT 0,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"url_name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"base_currency" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shops_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_photos" ADD CONSTRAINT "product_photos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shops" ADD CONSTRAINT "shops_base_currency_currencies_symbol_fk" FOREIGN KEY ("base_currency") REFERENCES "public"."currencies"("symbol") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
