import { relations, SQL, sql } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  boolean,
  integer,
  text,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  url_name: varchar("url_name", { length: 255 }).notNull(),
  tagline: text("tagline").default("Shop at our online store"),
  owner_id: uuid("owner_id")
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
    .notNull()
    .unique(),
  base_currency: varchar("base_currency")
    .references(() => currencies.symbol, {
      onDelete: "restrict",
      onUpdate: "cascade",
    })
    .notNull(),
  icon_path: varchar("icon_path", { length: 255 }),
  cover_path: varchar("cover_path", { length: 255 }),
  bg_path: varchar("bg_path", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const shopRelations = relations(shops, ({ many, one }) => ({
  products: many(products),
  owner: one(users, { fields: [shops.owner_id], references: [users.id] }),
  base_currency_info: one(currencies, {
    fields: [shops.base_currency],
    references: [currencies.symbol],
  }),
  links: many(socialMediaLinks),
}));

export const socialMediaPlatformEnum = pgEnum("social_media_platform_enum", [
  "youtube",
  "facebook",
  "instagram",
  "x",
  "threads",
  "tiktok",
  "linkedin",
  "quora",
  "email",
  "generic_link",
]);

export const socialMediaLinks = pgTable("social_media_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  shop_id: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  platform: socialMediaPlatformEnum("platform").notNull(),
  url: text("url").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const socialMediaLinkRelations = relations(
  socialMediaLinks,
  ({ one }) => ({
    shop: one(shops, {
      fields: [socialMediaLinks.shop_id],
      references: [shops.id],
    }),
  })
);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  firebase_id: varchar("firebase_id", { length: 50 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  shops: many(shops),
}));

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

export const currencyRelations = relations(currencies, ({ many }) => ({
  shops: many(shops),
}));

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    url_name: varchar("url_name", { length: 255 }).notNull(),
    description: text("description"),
    is_visible: boolean("is_visible").default(true),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    qty: integer("qty").default(0),
    price: integer("price").notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    url_name_shop_id_unq: unique().on(t.url_name, t.shop_id),
  })
);

export const productRelations = relations(products, ({ many, one }) => ({
  shop: one(shops, { fields: [products.shop_id], references: [shops.id] }),
  photos: many(productPhotos),
}));

export const productPhotos = pgTable("product_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  is_visible: boolean("is_visible").default(true),
  caption: varchar("caption", { length: 255 }),
  product_id: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  path: varchar("path", { length: 255 }).notNull(),
});

export const productPhotoRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.product_id],
    references: [products.id],
  }),
}));
