ALTER TABLE "shops" RENAME COLUMN "url_name" TO "subdomain";--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_subdomain_unique" UNIQUE("subdomain");