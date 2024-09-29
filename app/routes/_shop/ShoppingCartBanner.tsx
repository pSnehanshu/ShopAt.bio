import type { ShopLayoutData } from "~/routes/_shop/route";
import { Link } from "@remix-run/react";
import { PiShoppingCartFill } from "react-icons/pi";
import { FaArrowRight } from "react-icons/fa6";
import { getCurrencyAmtFormatted } from "~/utils/misc";

export function ShoppingCartBanner({
  cartContent,
  productsInfo,
  shop,
  locale,
}: {
  cartContent: ShopLayoutData["shoppingCartContent"];
  productsInfo: ShopLayoutData["shoppinCartProducts"];
  shop: ShopLayoutData["shop"];
  locale: string;
}) {
  let total = 0;
  for (const productId in cartContent) {
    total += cartContent[productId]?.qty ?? 0;
  }

  let totalCost = 0;
  productsInfo.forEach((p) => {
    const qty = cartContent?.[p.id]?.qty ?? 0;
    totalCost += p.price * qty;
  });

  if (total <= 0) {
    return <></>;
  }

  const priceToDisplay = getCurrencyAmtFormatted(
    totalCost,
    shop.base_currency_info.multiplier,
    shop.base_currency,
    locale
  );

  const productsCount = Object.keys(cartContent ?? {}).length;

  return (
    <div className="grid grid-cols-6 min-h-16 fixed bottom-0 md:bottom-5 left-1/2 transform -translate-x-1/2 w-full md:max-w-xl shadow-xl bg-[#1b881a] bg-opacity-70 backdrop-blur-sm md:rounded-xl p-2">
      <div className="col-span-4 text-white p-2">
        <p className="text-sm">
          There are {productsCount} product(s) in your cart.
        </p>
        <p className="text-xl font-bold">
          {priceToDisplay} <span className="text-sm font-normal">+ taxes</span>
        </p>
      </div>

      <Link
        to="cart"
        className="col-span-2 border p-2 rounded-xl text-white hover:bg-white hover:text-[#1b881a] transition-colors flex justify-center items-center space-x-2"
      >
        <PiShoppingCartFill />
        <span className="font-bold">Go to cart</span>
        <FaArrowRight />
      </Link>
    </div>
  );
}
