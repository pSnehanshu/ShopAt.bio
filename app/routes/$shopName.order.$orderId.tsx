import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getOrderDetails } from "~/utils/queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const orderId = params.orderId;
  invariant(orderId, "orderId must be given");

  const order = await getOrderDetails(orderId);

  if (!order) {
    throw new Response("Not found", { status: 404 });
  }

  return json({ order });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `Order details | ${data?.order.shop.full_name} | ShopAt.bio` },
];

export default function OrderDetails() {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Order details #{order.id}</h1>

      <pre>{JSON.stringify(order, null, 2)}</pre>
    </div>
  );
}
