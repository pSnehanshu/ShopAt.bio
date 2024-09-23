import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getShopByUrlNameOrThrow } from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  return json({ shop });
}

export default function ShopLayout() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Shop {shop.full_name}</h1>
      <Outlet />
    </div>
  );
}
