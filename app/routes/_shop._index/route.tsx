import { json, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  getHomepageProducts,
  getShopByHostName,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { ProductTile } from "./ProductTile";
import { getUserLocale } from "~/utils/misc";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await getShopByHostName(request.headers.get("Host"));
  const products = await getHomepageProducts(shop.id);
  const shoppingCartContent = await parseShoppingCartCookie(request);
  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ shop, products, shoppingCartContent, locale });
}

export type LoaderDataType = SerializeFrom<typeof loader>;

export default function Index() {
  const { products, shop, shoppingCartContent, locale } =
    useLoaderData<typeof loader>();

  return (
    <ul className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile
            product={product}
            shop={shop}
            cartContent={shoppingCartContent}
            locale={locale}
          />
        </li>
      ))}
    </ul>
  );
}
