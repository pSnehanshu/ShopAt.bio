import clsx from "clsx";
import { MdAdd, MdRemove } from "react-icons/md";
import { PiShoppingCartFill } from "react-icons/pi";
import { LoaderDataType } from "./route";
import { ArrayElement } from "~/utils/types";
import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

type Product = ArrayElement<LoaderDataType["products"]>;
type CartContent = LoaderDataType["shoppingCartContent"];

export function AddToCartBtn({
  product,
  cartContent,
}: {
  product: Product;
  cartContent: CartContent;
}) {
  const isInStock = product.qty >= 1;
  const fetcher = useFetcher();

  const qtyInCart = useMemo(() => {
    const allProducts = cartContent?.[product.shop_id] ?? [];
    const cartProduct = allProducts.find((p) => p.productId === product.id);
    return cartProduct?.qty ?? 0;
  }, [cartContent, product.id, product.shop_id]);

  const isAddedToCart = qtyInCart > 0;

  return (
    <fetcher.Form method="post" action="cart">
      <input type="hidden" name="product_url_name" value={product.url_name} />

      {isAddedToCart ? (
        <>
          <div className="grid grid-cols-2 h-10 transition-all rounded-xl overflow-hidden shadow-md text-white">
            <button
              type="submit"
              className="bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl transition-all"
              name="operation"
              value="remove"
            >
              <MdRemove className="relative left-2" />
            </button>
            <button
              type="submit"
              className="bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl transition-all"
              name="operation"
              value="add"
            >
              <MdAdd className="relative left-1" />
            </button>
          </div>
          <div className="text-xs text-center text-green-600 mt-1">
            {qtyInCart} in cart
          </div>
        </>
      ) : (
        <button
          className={clsx(
            "h-10 flex space-x-1 p-2 transition-all rounded-xl shadow-md text-white",
            isInStock
              ? "bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl"
              : "bg-gray-300 cursor-not-allowed"
          )}
          disabled={!isInStock}
          type="submit"
          name="operation"
          value="add"
        >
          <PiShoppingCartFill className="h-full" />
          <span
            className={clsx(
              { "line-through	": !isInStock },
              "text-sm top-1 relative"
            )}
          >
            Add
          </span>
        </button>
      )}
    </fetcher.Form>
  );
}
