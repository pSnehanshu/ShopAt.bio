import { json, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "db";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const { shopName, productName } = params;
  invariant(shopName, "expected params.shopName");
  invariant(productName, "expected params.productName");

  const shop = await db.query.shops.findFirst({
    where: (fields, { eq }) => eq(fields.url_name, shopName),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
        },
      },
      base_currency_info: true,
    },
  });

  if (!shop) {
    throw new Response("Not Found", { status: 404 });
  }

  const product = await db.query.products.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.url_name, productName), eq(fields.shop_id, shop.id)),
  });

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

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
