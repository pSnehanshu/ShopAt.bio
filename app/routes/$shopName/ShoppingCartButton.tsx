import { Link } from "@remix-run/react";
import { PiShoppingCartLight } from "react-icons/pi";
import type { LoaderDataType } from "./route";

export function ShoppingCartButton({
  cartContent,
  shopId,
}: {
  cartContent: LoaderDataType["shoppingCartContent"];
  shopId: string;
}) {
  const products = cartContent?.[shopId] ?? [];

  let total = 0;
  products.forEach((p) => {
    total += p.qty;
  });

  return (
    <Link to="cart" className="border p-2 rounded-md bg-gray-200 flex gap-2">
      <PiShoppingCartLight className="relative top-1" />{" "}
      <span>Cart ({total})</span>
    </Link>
  );
}
