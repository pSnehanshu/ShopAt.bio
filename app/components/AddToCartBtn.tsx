import clsx from "clsx";
import { MdAdd, MdRemove } from "react-icons/md";
import { PiShoppingCartFill } from "react-icons/pi";
import { LoaderDataType } from "../routes/$shopName._index/route";
import { ArrayElement } from "~/utils/types";
import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

type Product = ArrayElement<LoaderDataType["products"]>;
type CartContent = LoaderDataType["shoppingCartContent"];

export function AddToCartBtn({
  product,
  cartContent,
  cartLocation,
  btnTextFull = false,
}: {
  product: Product;
  cartContent: CartContent;
  cartLocation: string;
  btnTextFull?: boolean;
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
    <fetcher.Form method="post" action={cartLocation}>
      <input type="hidden" name="product_url_name" value={product.url_name} />

      {isAddedToCart ? (
        <>
          <div className="grid grid-cols-2 h-10 transition-all rounded-xl overflow-hidden shadow-md text-white">
            <button
              type="submit"
              className="bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl transition-all flex justify-center gap-2 items-center"
              name="operation"
              value="remove"
            >
              {btnTextFull ? (
                <>
                  <MdRemove /> <span>Remove 1</span>
                </>
              ) : (
                <MdRemove />
              )}
            </button>
            <button
              type="submit"
              className="bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl transition-all flex justify-center gap-2 items-center"
              name="operation"
              value="add"
            >
              {btnTextFull ? (
                <>
                  <MdAdd />
                  <span>Add 1</span>
                </>
              ) : (
                <MdAdd />
              )}
            </button>
          </div>
          <div className="text-xs text-center text-green-600 mt-1">
            {qtyInCart} in cart
          </div>
        </>
      ) : (
        <button
          className={clsx(
            "h-10 w-full flex space-x-1 justify-center p-2 transition-all rounded-xl shadow-md text-white",
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
            {btnTextFull ? "Add to cart" : "Add"}
          </span>
        </button>
      )}
    </fetcher.Form>
  );
}
