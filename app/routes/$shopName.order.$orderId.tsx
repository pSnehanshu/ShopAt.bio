import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getShopByUrlNameOrThrow } from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const orderId = params.orderId;
  invariant(orderId, "orderId must be given");
  const shop = await getShopByUrlNameOrThrow(params.shopName);

  return json({ orderId, shop });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `Order details | ${data?.shop.full_name} | ShopAt.bio` },
];

export default function OrderDetails() {
  const { orderId } = useLoaderData<typeof loader>();

  return <h1>Order details #{orderId}</h1>;
}
