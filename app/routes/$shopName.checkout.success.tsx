import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { shoppingCart } from "~/utils/cookies.server";
import {
  getProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import orderPlacedAnimation from "~/assets/order-placed.webm";
import { Link, useLoaderData } from "@remix-run/react";

export async function action({ request, params }: ActionFunctionArgs) {
  const shoppingCartContent = await parseShoppingCartCookie(request);
  const shop = await getShopByUrlNameOrThrow(params.shopName);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length < 1 || !shoppingCartContent) {
    return new Response("Shopping cart is empty", { status: 403 });
  }

  const products = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const formData = await request.formData();
  const fullName = formData.get("full_name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const address = formData.get("address");
  const pin = formData.get("pin");
  const district = formData.get("district");
  const state = formData.get("state");
  const country = formData.get("country");
  const paymentMethod = formData.get("payment_method");

  // Validate required fields
  if (
    !fullName ||
    !phone ||
    !address ||
    !pin ||
    !state ||
    !country ||
    !paymentMethod
  ) {
    return json({ error: "Please fill all required fields" }, { status: 400 });
  }

  console.log(
    fullName,
    email,
    phone,
    address,
    pin,
    district,
    state,
    country,
    paymentMethod,
    products
  );

  // TODO: Process the order
  // This would typically involve:
  // 1. Creating an order in the database
  // 2. Handling payment (if not COD)
  // 3. Updating inventory
  // 4. Sending confirmation emails

  // Clear shopping cart
  delete shoppingCartContent[shop.id];
  const cookie = await shoppingCart.serialize(shoppingCartContent);

  // For now, we'll just redirect to a success page
  return redirect(`?order_id=123`, {
    headers: { "Set-Cookie": cookie },
  });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const orderId = new URL(request.url).searchParams.get("order_id");
  if (!orderId) {
    return redirect("..");
  }

  const shoppingCartContent = await parseShoppingCartCookie(request);
  const shop = await getShopByUrlNameOrThrow(params.shopName);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length > 0) {
    return redirect("../");
  }

  return json({ shop, orderId });
}

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
