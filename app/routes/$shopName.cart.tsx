import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import {
  addToShoppingCart,
  getProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const productUrlName = formData.get("product_url_name");
  const operation = formData.get("operation");
  const shopUrlName = params.shopName;

  invariant(
    productUrlName,
    "product_url_name must be provided in request body"
  );
  invariant(shopUrlName, "params.shopName must be set");

  const cookie = await addToShoppingCart(
    request,
    productUrlName.toString(),
    shopUrlName,
    operation?.toString() === "remove" ? "remove" : "add"
  );

  return new Response(null, {
    headers: { "Set-Cookie": cookie },
    status: 201,
  });
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  const products = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  return json({ products, shop });
}

export default function ShoppingCart() {
  return <h1>Shopping cart</h1>;
}
