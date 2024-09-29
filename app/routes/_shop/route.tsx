import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ShopLayout as ShopLayoutComponent } from "./Layout";
import { getUserLocale } from "~/utils/misc";
import {
  getProducts,
  getShopByHostName,
  parseShoppingCartCookie,
} from "~/utils/queries.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await getShopByHostName(request.headers.get("Host"));
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const productsIds = Object.keys(shoppingCartContent ?? {});
  const shoppinCartProducts = await getProducts(productsIds, shop.id);

  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ shop, shoppingCartContent, shoppinCartProducts, locale });
}

export type ShopLayoutData = SerializeFrom<typeof loader>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.shop.full_name} | ShopAt.bio` },
    {
      name: "description",
      content: data?.shop.tagline,
    },
  ];
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <ShopLayoutComponent
      locale={data.locale}
      shop={data.shop}
      shoppinCartProducts={data.shoppinCartProducts}
      shoppingCartContent={data.shoppingCartContent}
    >
      <Outlet />
    </ShopLayoutComponent>
  );
}
