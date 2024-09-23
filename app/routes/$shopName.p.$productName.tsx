import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  getProductByUrlNameOrThrow,
  getShopByUrlNameOrThrow,
} from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const product = await getProductByUrlNameOrThrow(shop.id, params.productName);

  return json({ product, shop });
}

export default function Index() {
  const { product, shop } = useLoaderData<typeof loader>();

  return (
    <div>
      <pre>{JSON.stringify(product, null, 2)}</pre>
      <pre>{JSON.stringify(shop, null, 2)}</pre>
    </div>
  );
}
