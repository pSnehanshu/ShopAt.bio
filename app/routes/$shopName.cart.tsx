import { ActionFunctionArgs, json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { addToShoppingCart } from "~/utils/queries.server";

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

  return json(null, { headers: { "Set-Cookie": cookie } });
}

export default function ShoppingCart() {
  return <h1>Shopping cart</h1>;
}
