import { createCookie } from "@remix-run/node";
import { addMilliseconds, addMonths } from "date-fns";
import * as v from "valibot";

const cookieSecrets: string[] = ["some-secret"];

export const session = createCookie("login-session", {
  secrets: cookieSecrets,
  // Ensure this is the same as the expiry date on the JWT!!
  expires: addMilliseconds(Date.now(), 60 * 60 * 24 * 5 * 1000),
  path: "/",
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
});

/** Key=ShopId, Value=Array of ProductId's */
export const ShoppingCartCookieSchema = v.record(
  v.string(),
  v.array(
    v.object({
      productId: v.string(),
      qty: v.pipe(v.number(), v.integer(), v.toMinValue(1)),
    })
  )
);
export const shoppingCart = createCookie("shopping-cart", {
  path: "/",
  // sameSite: "none",
  expires: addMonths(new Date(), 3),
  secure: false,
});
