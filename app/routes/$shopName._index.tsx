import { json, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { db } from "db";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const { shopName } = params;
  invariant(shopName, "expected params.shopName");

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

  return json({ shop });
}

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div>
      <pre>{JSON.stringify(shop, null, 2)}</pre>
    </div>
  );
}
