import { useMemo } from "react";
import type { LoaderDataType } from "./route";
import { Link } from "@remix-run/react";
import { PiShoppingCartFill } from "react-icons/pi";
import { FaArrowRight } from "react-icons/fa6";

export function ShoppingCartBanner({
  cartContent,
  productsInfo,
  shop,
}: {
  cartContent: LoaderDataType["shoppingCartContent"];
  productsInfo: LoaderDataType["shoppinCartProducts"];
  shop: LoaderDataType["shop"];
}) {
  const productsInCookie = cartContent?.[shop.id] ?? [];
  let total = 0;
  productsInCookie.forEach((p) => {
    total += p.qty;
  });

  let totalCost = 0;
  productsInfo.forEach((p) => {
    const prodInCookie = productsInCookie.find((pc) => pc.productId === p.id);
    const qty = prodInCookie?.qty ?? 0;

    totalCost += p.price * qty;
  });

  const priceToDisplay = useMemo(() => {
    const multiplier = shop.base_currency_info.multiplier ?? 1;
    const price = totalCost / multiplier;
    const sym = shop.base_currency ?? "";
    const formatting = shop.base_currency_info.formatting ?? `${sym} ?`;
    return formatting.replace("?", price.toLocaleString());
  }, [
    shop.base_currency,
    shop.base_currency_info.formatting,
    shop.base_currency_info.multiplier,
    totalCost,
  ]);

  if (total <= 0) {
    return <></>;
  }

  return (
    <div className="grid grid-cols-6 min-h-16 fixed bottom-0 md:bottom-5 left-1/2 transform -translate-x-1/2 w-full md:max-w-xl shadow-xl bg-[#1b881a] bg-opacity-70 backdrop-blur-sm md:rounded-xl p-2">
      <div className="col-span-4 text-white p-2">
        There are {productsInCookie.length} products in your cart (Cost:{" "}
        {priceToDisplay})
      </div>

      <Link
        to="cart"
        className="col-span-2 border p-2 rounded-xl text-white flex justify-center space-x-2"
      >
        <PiShoppingCartFill className="relative top-1" />
        <span>Go to cart</span>
        <FaArrowRight className="relative top-1" />
      </Link>
    </div>
  );
}
