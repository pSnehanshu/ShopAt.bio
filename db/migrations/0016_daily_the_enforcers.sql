DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return_placed', 'return_shipped', 'returned_refund_pending', 'returned_refund_done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'placed' NOT NULL,
	"status_history" jsonb NOT NULL,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"products" jsonb NOT NULL,
	"currency" jsonb NOT NULL,
	"buyer" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"discounts" integer NOT NULL,
	"taxes" integer NOT NULL,
	"delivery_fee" integer NOT NULL,
	"grandtotal" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
