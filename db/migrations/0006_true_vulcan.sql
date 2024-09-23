ALTER TABLE "social_media_links" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "social_media_links" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "social_media_links" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "social_media_links" ADD COLUMN "updated_at" timestamp;