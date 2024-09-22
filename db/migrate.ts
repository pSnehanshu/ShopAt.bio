import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

await migrate(drizzle(migrationClient, { schema, logger: true }), {
  migrationsFolder: "./db/migrations",
});

await migrationClient.end();
