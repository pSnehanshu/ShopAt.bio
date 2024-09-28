import { Link } from "@remix-run/react";
import { PiShoppingCartLight } from "react-icons/pi";
import type { RootLoaderData } from "~/root";

export function ShoppingCartButton({
  cart,
}: {
  cart: RootLoaderData["shoppingCartContent"];
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
