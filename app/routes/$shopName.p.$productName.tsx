import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  getProductById,
  getProductByUrlNameOrThrow,
  getShopByUrlNameOrThrow,
} from "~/utils/queries.server";

function isUUID(str: string | null | undefined): boolean {
  if (!str) return false;

  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);

  const product = await (isUUID(params.productName)
    ? getProductById(params.productName)
    : getProductByUrlNameOrThrow(shop.id, params.productName));

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
