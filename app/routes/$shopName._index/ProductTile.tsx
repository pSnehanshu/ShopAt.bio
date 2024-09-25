import type { LoaderDataType } from "./route";
import clsx from "clsx";
import { Link } from "@remix-run/react";
import { ArrayElement } from "~/utils/types";
import { AddToCartBtn } from "./AddToCartBtn";
import { getCurrencyAmtFormatted } from "~/utils/misc";

type Product = ArrayElement<LoaderDataType["products"]>;
type CartContent = LoaderDataType["shoppingCartContent"];

export function ProductTile({
  product,
  shop,
  className,
  cartContent,
}: {
  product: Product;
  shop: LoaderDataType["shop"];
  className?: string;
  cartContent: CartContent;
}) {
  const price = getCurrencyAmtFormatted(
    product.price,
    shop.base_currency_info.multiplier,
    shop.base_currency
  );

  const link = `p/${product.url_name}`;
  const isInStock = product.qty >= 1;

  return (
    <div
      className={clsx(
        "relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow",
        className
      )}
    >
      <Link to={link}>
        <img
          src={product.photoUrl}
          alt={`Illustration of ${product.name}`}
          className="w-full h-72 object-cover object-center"
        />
      </Link>

      <div className="p-2 bg-white bg-opacity-40 grid grid-cols-4 gap-2 justify-between">
        <div className="col-span-2 md:col-span-3">
          <Link to={link} className="hover:underline">
            <h2 className="text-md font-bold text-nowrap text-ellipsis overflow-hidden">
              {product.name}
            </h2>
          </Link>
          <span className="text-xs">{price}</span>
        </div>
        <div className="p-1 col-span-2 md:col-span-1">
          <AddToCartBtn product={product} cartContent={cartContent} />
        </div>
      </div>

      {!isInStock && (
        <span className="absolute px-2 py-1 inline-block top-0 right-0 text-red-500 shadow bg-white bg-opacity-40 rounded-bl-xl">
          Out of stock
        </span>
      )}
    </div>
  );
}
