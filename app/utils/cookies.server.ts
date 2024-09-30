import { createCookie } from "@remix-run/node";
import * as v from "valibot";

/** Key=ProductId, Value=Object of properties */
export const ShoppingCartCookieSchema = v.record(
  v.string(), // <- Product Id
  v.object({
    qty: v.pipe(v.number(), v.integer(), v.toMinValue(0)),
  })
);

export const shoppingCart = createCookie("shopping-cart", {
  path: "/",
  maxAge: 3 * 30 * 24 * 60 * 60, // 3 months
  secure: false,
});
