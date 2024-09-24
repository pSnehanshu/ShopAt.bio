import { json, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useMemo } from "react";
import {
  getHomepageProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { PiShoppingCartFill } from "react-icons/pi";
import { MdRemove, MdAdd } from "react-icons/md";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const products = await getHomepageProducts(shop.id);
  const shoppingCartContent = await parseShoppingCartCookie(request);

  return json({ shop, products, shoppingCartContent });
}

type LoaderDataType = SerializeFrom<typeof loader>;

export default function Index() {
  const { products, shop, shoppingCartContent } =
    useLoaderData<typeof loader>();

  return (
    <ul className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile
            product={product}
            shop={shop}
            cartContent={shoppingCartContent}
          />
        </li>
      ))}
    </ul>
  );
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type Product = ArrayElement<LoaderDataType["products"]>;
type CartContent = LoaderDataType["shoppingCartContent"];

function ProductTile({
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
  const price = useMemo(() => {
    const price = product.price / shop.base_currency_info.multiplier;
    const formatting = shop.base_currency_info.formatting;
    return formatting.replace("?", price.toLocaleString());
  }, [
    product.price,
    shop.base_currency_info.formatting,
    shop.base_currency_info.multiplier,
  ]);

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
          src={product.photoUrl ?? "https://placehold.co/600x400"}
          alt={`Illustration of ${product.name}`}
          className="w-full h-72 object-cover object-center"
        />
      </Link>

      <div className="p-2 bg-white bg-opacity-40 grid grid-cols-4 gap-2 justify-between">
        <div className="col-span-3">
          <Link to={link} className="hover:underline">
            <h2 className="text-md font-bold text-nowrap text-ellipsis overflow-hidden">
              {product.name}
            </h2>
          </Link>
          <span className="text-xs">{price}</span>
        </div>
        <div className="p-1">
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

function AddToCartBtn({
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
              className="bg-[#ff527b] hover:bg-[#fa3a67] hover:shadow-xl"
              name="operation"
              value="remove"
            >
              <MdRemove className="relative left-2" />
            </button>
            <button
              type="submit"
              className="bg-[#ff527b] hover:bg-[#fa3a67] hover:shadow-xl"
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
              ? "bg-[#ff527b] hover:bg-[#fa3a67] hover:shadow-xl"
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
