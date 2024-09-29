import clsx from "clsx";
import { MdAdd, MdRemove } from "react-icons/md";
import { PiShoppingCartFill } from "react-icons/pi";
import { LoaderDataType } from "~/routes/_shop._index/route";
import { ArrayElement } from "~/utils/types";
import { useFetcher } from "@remix-run/react";

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
  const fetcher = useFetcher();
  const isLoading = fetcher.state === "submitting";

  const isInStock = product.qty >= 1;
  const qtyInCart = cartContent?.[product.id]?.qty ?? 0;
  const isAddedToCart = qtyInCart > 0;

  return (
    <fetcher.Form
      method="post"
      action={cartLocation}
      className={clsx({ "animate-pulse": isLoading })}
    >
      <input type="hidden" name="product_url_name" value={product.url_name} />

      {isAddedToCart ? (
        <>
          <div
            className={clsx(
              "grid grid-cols-2 h-10 transition-all rounded-xl overflow-hidden shadow-md text-white",
              { "pointer-events-none": isLoading }
            )}
          >
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
            {isLoading ? (
              <span className="text-gray-600">Processing</span>
            ) : (
              `${qtyInCart} in cart`
            )}
          </div>
        </>
      ) : (
        <button
          className={clsx(
            "h-10 w-full flex space-x-1 justify-center p-2 transition-all rounded-xl shadow-md text-white",
            isInStock
              ? "bg-[#1b881a] hover:bg-[#146113] hover:shadow-xl"
              : "bg-gray-300 cursor-not-allowed",
            { "pointer-events-none": isLoading }
          )}
          disabled={!isInStock || isLoading}
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
