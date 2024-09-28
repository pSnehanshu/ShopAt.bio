import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import invariant from "tiny-invariant";

invariant(process.env.DATABASE_URL, "DATABASE_URL must be set");

const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});
