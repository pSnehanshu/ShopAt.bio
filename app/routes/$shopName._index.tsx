import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getShopByUrlNameOrThrow } from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  return json({ shop });
}

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Storefront main page</h1>
      <pre>{JSON.stringify(shop, null, 2)}</pre>
    </div>
  );
}
