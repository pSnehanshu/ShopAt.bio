import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  getShopByHostName,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import orderPlacedAnimation from "~/assets/order-placed.webm";
import { Link, useLoaderData } from "@remix-run/react";
import * as v from "valibot";
import { getUserLocale } from "~/utils/misc";
import { placeOrder, PlaceOrderFormDataSchema } from "~/utils/orders.server";
import invariant from "tiny-invariant";

export async function action({ request }: ActionFunctionArgs) {
  const hostName = request.headers.get("Host");
  invariant(hostName, "host header must be set");

  // Validate input
  const _raw_formData = await request.formData();
  const formData = v.parse(
    PlaceOrderFormDataSchema,
    Object.fromEntries(_raw_formData)
  );
  const shoppingCartContent = await parseShoppingCartCookie(request);
  const locale = getUserLocale(request.headers.get("Accept-Language"));

  try {
    const { orderId, cookie } = await placeOrder(
      hostName,
      formData,
      shoppingCartContent,
      locale
    );

    // Redirect to success page
    return redirect(`?order_id=${encodeURIComponent(orderId)}`, {
      headers: { "Set-Cookie": cookie },
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return json({ message: error.message }, { status: 400 });
    }
    return new Response("Something went wrong", { status: 500 });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const orderId = new URL(request.url).searchParams.get("order_id");
  if (!orderId) {
    return redirect("..");
  }

  const shoppingCartContent = await parseShoppingCartCookie(request);
  const shop = await getShopByHostName(request.headers.get("Host"));

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length > 0) {
    return redirect("../");
  }

  return json({ shop, orderId });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `Order success | ${data?.shop.full_name} | ShopAt.bio`,
  },
];

export default function CheckoutSuccess() {
  const { orderId } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-center gap-4 mt-16 text-center">
      <video
        src={orderPlacedAnimation}
        autoPlay
        muted
        playsInline
        className="h-32"
      />

      <h1 className="text-2xl font-light">Thank you for placing the order</h1>

      <p className="font-light text-sm">
        We will send you updates on your phone and/or email address
      </p>

      <Link
        to={`../order/${orderId}`}
        className="py-1 px-4 rounded-xl text-lg shadow-lg border-2 border-green-600 hover:border-transparent hover:bg-green-700 transition-all text-green-700 hover:text-white"
      >
        Order details
      </Link>
    </div>
  );
}
