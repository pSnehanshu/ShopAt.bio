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
  numeric,
  jsonb,
  smallint,
} from "drizzle-orm/pg-core";
import * as v from "valibot";

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 255 }).notNull().unique(),
  is_active: boolean("is_active").notNull().default(true),
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
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shopRelations = relations(shops, ({ many, one }) => ({
  products: many(products),
  owner: one(users, { fields: [shops.owner_id], references: [users.id] }),
  base_currency_info: one(currencies, {
    fields: [shops.base_currency],
    references: [currencies.symbol],
  }),
  links: many(socialMediaLinks),
  tax_rates: many(taxRates),
  orders: many(orders),
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
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
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
  email: varchar("email").unique(),
  is_email_verified: boolean("is_email_verified").default(false).notNull(),
  email_otp_hash: varchar("email_otp_hash", { length: 60 }),
  email_otp_expiry: timestamp("email_otp_expiry", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  shops: many(shops),
  sessions: many(userLoginSessions),
}));

export const userLoginSessions = pgTable("user_login_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  token_hash: varchar("token_hash", { length: 60 }).notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiry: timestamp("expiry", { withTimezone: true }).notNull(),
});

export const userLoginSessionRelation = relations(
  userLoginSessions,
  ({ one }) => ({
    user: one(users, {
      fields: [userLoginSessions.user_id],
      references: [users.id],
    }),
  })
);

export const currencies = pgTable("currencies", {
  symbol: varchar("symbol", { length: 3 }).primaryKey(),
  full_name: varchar("full_name", { length: 30 }).$default(
    (): SQL => sql`${currencies.symbol}`
  ),
  multiplier: smallint("multiplier").notNull(),
  one_usd_val: integer("one_usd_val").default(1).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
    is_visible: boolean("is_visible").default(true).notNull(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    qty: integer("qty").default(0).notNull(),
    price: integer("price").notNull(),
    tax_rate_id: uuid("tax_rate_id").references(() => taxRates.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    url_name_shop_id_unq: unique().on(t.url_name, t.shop_id),
  })
);

export const productRelations = relations(products, ({ many, one }) => ({
  shop: one(shops, { fields: [products.shop_id], references: [shops.id] }),
  photos: many(productPhotos),
  tax_rate: one(taxRates, {
    fields: [products.tax_rate_id],
    references: [taxRates.id],
  }),
}));

export const productPhotos = pgTable("product_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  is_visible: boolean("is_visible").default(true).notNull(),
  caption: varchar("caption", { length: 255 }),
  product_id: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  is_main: boolean("is_main").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const productPhotoRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.product_id],
    references: [products.id],
  }),
}));

export const taxRates = pgTable("tax_rates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 70 }).notNull(),
  rate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
  shop_id: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  shop: one(shops, { fields: [taxRates.id], references: [shops.id] }),
}));

const AddressSchema = v.object({
  address: v.string(),
  pin: v.optional(v.string()),
  state: v.optional(v.string()),
  district: v.optional(v.string()),
  country: v.string(),
});

export const ProductsSchema = v.array(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.string(),
    qty: v.pipe(v.number(), v.integer(), v.minValue(1)),
    price: v.pipe(v.number(), v.minValue(0)),
    tax: v.object({
      amount: v.pipe(v.number(), v.minValue(0)),
      rate: v.pipe(v.number(), v.minValue(0)),
      name: v.optional(v.string()),
    }),
  })
);

export const CurrencySchema = v.object({
  symbol: v.pipe(v.string(), v.length(3), v.toUpperCase()),
  full_name: v.optional(v.string()),
  multiplier: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export const BuyerSchema = v.object({
  name: v.string(),
  address: v.object({
    delivery: v.optional(AddressSchema),
    billing: v.optional(AddressSchema),
  }),
  contact: v.object({
    email: v.optional(v.string()),
    phone: v.optional(
      v.object({
        isd: v.pipe(v.number(), v.integer()),
        num: v.pipe(v.string(), v.digits()),
      })
    ),
  }),
});

export enum OrderStatusesEnum {
  placed = "placed",
  confirmed = "confirmed",
  shipped = "shipped",
  delivered = "delivered",
  cancelled = "cancelled",
  return_placed = "return_placed",
  return_shipped = "return_shipped",
  returned_refund_pending = "returned_refund_pending",
  returned_refund_done = "returned_refund_done",
}
export const orderStatusPgEnum = pgEnum(
  "order_status",
  Object.values(OrderStatusesEnum) as [string, ...string[]]
);
export const StatusHistorySchema = v.array(
  v.object({
    status: v.enum(OrderStatusesEnum),
    date: v.pipe(v.string(), v.isoTimestamp()),
    remarks: v.optional(v.pipe(v.string(), v.trim())),
  })
);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  shop_id: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  status: orderStatusPgEnum("status").default("placed").notNull(),
  status_history: jsonb("status_history")
    .$type<v.InferOutput<typeof StatusHistorySchema>>()
    .notNull(),
  order_date: timestamp("order_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  products: jsonb("products")
    .$type<v.InferOutput<typeof ProductsSchema>>()
    .notNull(),
  currency: jsonb("currency")
    .$type<v.InferOutput<typeof CurrencySchema>>()
    .notNull(),
  buyer: jsonb("buyer").$type<v.InferOutput<typeof BuyerSchema>>().notNull(),
  subtotal: integer("subtotal").notNull(),
  discounts: integer("discounts").notNull(),
  taxes: integer("taxes").notNull(),
  delivery_fee: integer("delivery_fee").notNull(),
  grandtotal: integer("grandtotal").notNull(),
  payment_method: varchar("payment_method", { length: 50 }).notNull(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  shop: one(shops, { fields: [orders.shop_id], references: [shops.id] }),
}));
