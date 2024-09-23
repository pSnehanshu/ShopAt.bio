import { json, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useMemo } from "react";
import {
  getHomepageProducts,
  getShopByUrlNameOrThrow,
} from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const products = await getHomepageProducts(shop.id);
  return json({ shop, products });
}

export default function Index() {
  const { products, shop } = useLoaderData<typeof loader>();

  return (
    <ul className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} shop={shop} />
        </li>
      ))}
    </ul>
  );
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type Product = SerializeFrom<
  ArrayElement<Awaited<ReturnType<typeof getHomepageProducts>>>
>;

type Shop = SerializeFrom<Awaited<ReturnType<typeof getShopByUrlNameOrThrow>>>;

function ProductTile({
  product,
  shop,
  className,
}: {
  product: Product;
  shop: Shop;
  className?: string;
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

  return (
    <Link to={`p/${product.url_name}`}>
      <div
        className={clsx(
          "relative rounded-xl overflow-hidden shadow-sm",
          className
        )}
      >
        <img
          src={product.photoUrl ?? "https://placehold.co/600x400"}
          alt={`Illustration of ${product.name}`}
          className="w-full h-72 object-cover object-center"
        />

        <div className="p-2 bg-white bg-opacity-40">
          <h2 className="text-md font-bold">{product.name}</h2>
          <span className="text-xs">{price}</span>
        </div>

        {product.qty <= 0 && (
          <span className="absolute px-2 py-1 inline-block top-0 right-0 text-red-500 shadow bg-white bg-opacity-40 rounded-bl-xl">
            Out of stock
          </span>
        )}
      </div>
    </Link>
  );
}
