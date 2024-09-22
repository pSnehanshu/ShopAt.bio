ALTER TABLE "users" ADD COLUMN "firebase_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_firebase_id_unique" UNIQUE("firebase_id");