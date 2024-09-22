import { SQL, sql } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  url_name: varchar("url_name", { length: 255 }).notNull(),
  owner_id: uuid("owner_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  base_currency: varchar("base_currency")
    .references(() => currencies.symbol)
    .notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  firebase_id: varchar("firebase_id", { length: 50 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const currencies = pgTable("currencies", {
  symbol: varchar("symbol", { length: 3 }).primaryKey(),
  full_name: varchar("full_name", { length: 30 }).$default(
    (): SQL => sql`${currencies.symbol}`
  ),
  multiplier: integer("multiplier").notNull(),
  one_usd_val: integer("one_usd_val").default(1),
  /** Can be of format `$?` or `₹?` or `? EUR`, where ? is the placeholder for the amount */
  formatting: varchar("formatting", { length: 10 }).$default(
    (): SQL => sql`${currencies.symbol} ?`
  ),
  created_at: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  is_visible: boolean("is_visible").default(true),
  shop_id: uuid("shop_id")
    .references(() => shops.id)
    .notNull(),
  qty: integer("qty").default(0),
  price: integer("price").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const productPhotos = pgTable("product_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  is_visible: boolean("is_visible").default(true),
  caption: varchar("caption", { length: 255 }),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  file_path: varchar("file_path").generatedAlwaysAs(
    (): SQL =>
      sql`'product-photos/' || ${productPhotos.product_id} || '/shopat_pic_' || ${productPhotos.id}`
  ),
});
