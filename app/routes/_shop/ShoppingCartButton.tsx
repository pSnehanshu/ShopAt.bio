import { Link } from "@remix-run/react";
import { PiShoppingCartLight } from "react-icons/pi";
import type { ShopLayoutData } from "~/routes/_shop/route";

export function ShoppingCartButton({
  cart,
}: {
  cart: ShopLayoutData["shoppingCartContent"];
}) {
  let total = 0;
  for (const productId in cart) {
    total += cart[productId]?.qty ?? 0;
  }

  return (
    <Link to="cart" className="border p-2 rounded-md bg-gray-200 flex gap-2">
      <PiShoppingCartLight className="relative top-1" />{" "}
      <span>Cart ({total})</span>
    </Link>
  );
}
