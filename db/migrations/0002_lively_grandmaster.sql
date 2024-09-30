ALTER TABLE "user_login_sessions" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint
ALTER TABLE "user_login_sessions" ALTER COLUMN "token_hash" SET DATA TYPE varchar(60);