import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

export async function loader({ params }: LoaderFunctionArgs) {
  const orderId = params.orderId;
  invariant(orderId, "orderId must be given");

  return json({ orderId });
}

export default function OrderDetails() {
  const { orderId } = useLoaderData<typeof loader>();

  return <h1>Order details #{orderId}</h1>;
}
