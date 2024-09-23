import { json, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "db";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const { shopName, productId } = params;
  invariant(shopName, "expected params.shopName");
  invariant(productId, "expected params.productId");

  const product = await db.query.products.findFirst({
    where: (fields, { eq }) => eq(fields.id, productId),
    with: {
      shop: true,
    },
  });

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ product });
}

export default function Index() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div>
      <pre>{JSON.stringify(product, null, 2)}</pre>
    </div>
  );
}
