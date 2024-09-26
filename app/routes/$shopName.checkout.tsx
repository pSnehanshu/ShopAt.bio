import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserLocale } from "~/utils/misc";
import { getOrderPriceSummary } from "~/utils/orders.server";
import {
  getProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const locale = getUserLocale(request.headers.get("Accept-Language"));

  const shoppingCartContent = await parseShoppingCartCookie(request);
  const shop = await getShopByUrlNameOrThrow(params.shopName);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length < 1) {
    return redirect("..");
  }

  const products = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const priceSummary = await getOrderPriceSummary(
    shoppingCartContent,
    shop,
    locale,
    products
  );

  return json({ shoppingCartContent, products, shop, priceSummary, locale });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `Checkout | ${data?.shop.full_name} | ShopAt.bio`,
  },
];

export default function Checkout() {
  const { products, shop, shoppingCartContent, priceSummary, locale } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Checkout ({locale})</h1>

      <pre>{JSON.stringify(shoppingCartContent, null, 2)}</pre>
      <hr />
      <pre>{JSON.stringify(priceSummary, null, 2)}</pre>
      <hr />
      <pre>{JSON.stringify(products, null, 2)}</pre>
      <hr />
      <pre>{JSON.stringify(shop, null, 2)}</pre>
    </div>
  );
}
