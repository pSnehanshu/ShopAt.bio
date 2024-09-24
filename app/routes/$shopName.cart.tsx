import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useMemo } from "react";
import { MdAdd, MdRemove } from "react-icons/md";
import invariant from "tiny-invariant";
import {
  addToShoppingCart,
  getProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { ArrayElement } from "~/utils/types";

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

  return json({ shoppingCartContent, products, shop });
}

type LoaderDataType = SerializeFrom<typeof loader>;

export default function ShoppingCart() {
  const { products, shop, shoppingCartContent } =
    useLoaderData<typeof loader>();

  return (
    <>
      {products.length > 0 ? (
        <>
          <div className="p-4">
            <h1>
              <span className="font-bold mr-2">My shopping cart</span>
              <span className="font-light text-sm">
                {products.length} product(s)
              </span>
            </h1>
          </div>

          <ol className="mb-16">
            {products.map((product) => (
              <li key={product.id} className="mb-4">
                <ProductTile
                  product={product}
                  shop={shop}
                  cartContent={shoppingCartContent}
                />
              </li>
            ))}
          </ol>

          <PriceSummary
            products={products}
            shop={shop}
            cartContent={shoppingCartContent}
          />

          <div className="mt-8 mb-16 flex justify-center">
            <Link
              to="../checkout"
              className="py-4 px-16 rounded-xl text-2xl shadow-lg bg-green-600 hover:bg-green-700 transition-all text-white"
            >
              Proceed to checkout
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 my-16">
            <p className="font-light text-lg">Your shopping cart is empty!</p>

            <Link
              to=".."
              className="p-4 text-white block rounded-xl shadow hover:shadow-xl bg-[#1b881a] hover:bg-[#146113] transition-all"
            >
              Start shopping now
            </Link>
          </div>
        </>
      )}
    </>
  );
}

type Product = ArrayElement<LoaderDataType["products"]>;

function ProductTile({
  product,
  shop,
  cartContent,
}: {
  product: Product;
  cartContent: LoaderDataType["shoppingCartContent"];
  shop: LoaderDataType["shop"];
}) {
  const qty =
    cartContent?.[shop.id].find((p) => p.productId === product.id)?.qty ?? 0;
  const link = `../p/${product.url_name}`;

  const totalCost = useMemo(() => {
    const totalCost =
      (product.price * qty) / shop.base_currency_info.multiplier;
    return shop.base_currency_info.formatting.replace(
      "?",
      totalCost.toLocaleString()
    );
  }, [
    product.price,
    qty,
    shop.base_currency_info.formatting,
    shop.base_currency_info.multiplier,
  ]);

  return (
    <div className="rounded-xl p-4 grid grid-cols-4 gap-2 border hover:shadow-lg bg-white bg-opacity-70">
      <div className="col-span-3">
        <Link to={link} className="hover:underline hover:text-blue-500">
          <h3 className="text-sm">{product.name}</h3>
        </Link>

        <div className="text-lg font-bold">{totalCost}</div>

        <Form method="post">
          <input
            type="hidden"
            name="product_url_name"
            value={product.url_name}
          />

          <div className="my-4 w-40 bg-white bg-opacity-70 grid grid-cols-4 h-10 transition-all rounded-xl overflow-hidden shadow-md">
            <button
              type="submit"
              className="border border-transparent hover:border-gray-400 rounded-l-xl hover:shadow-xl transition-all"
              name="operation"
              value="remove"
            >
              <MdRemove className="relative left-3" />
            </button>

            <div className="col-span-2 flex justify-center items-center max-h-full">
              <div className="my-auto h-5 text-black">Qty: {qty}</div>
            </div>

            <button
              type="submit"
              className="border border-transparent hover:border-gray-400 rounded-r-xl hover:shadow-xl transition-all"
              name="operation"
              value="add"
            >
              <MdAdd className="relative left-2" />
            </button>
          </div>
        </Form>
      </div>

      <div>
        <Link to={link}>
          <img
            src={product.photoUrl}
            alt={`${product.name}'s illustration`}
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </div>
  );
}

function PriceSummary({
  products,
  shop,
  cartContent,
}: {
  products: Product[];
  cartContent: LoaderDataType["shoppingCartContent"];
  shop: LoaderDataType["shop"];
}) {
  const productsInCookie = cartContent?.[shop.id] ?? [];
  const multiplier = shop.base_currency_info.multiplier ?? 1;

  let subtotal = 0;
  products.forEach((p) => {
    const prodInCookie = productsInCookie.find((pc) => pc.productId === p.id);
    const qty = prodInCookie?.qty ?? 0;

    subtotal += p.price * qty;
  });

  const itemsSubtotal = useMemo(() => {
    const price = subtotal / multiplier;
    return shop.base_currency_info.formatting.replace(
      "?",
      price.toLocaleString()
    );
  }, [multiplier, shop.base_currency_info.formatting, subtotal]);

  const discountRate = 0.0;
  const taxRate = 0.18;
  const deliveryFee: number = 0;

  const deliveryDisplay =
    deliveryFee === 0
      ? "Free"
      : shop.base_currency_info.formatting.replace(
          "?",
          deliveryFee.toLocaleString()
        );

  const taxes = useMemo(() => {
    const amt = (subtotal * taxRate) / multiplier;

    return shop.base_currency_info.formatting.replace(
      "?",
      amt.toLocaleString()
    );
  }, [multiplier, shop.base_currency_info.formatting, subtotal]);

  const discount = useMemo(() => {
    const amt = (subtotal * discountRate) / multiplier;

    return shop.base_currency_info.formatting.replace(
      "?",
      amt.toLocaleString()
    );
  }, [multiplier, shop.base_currency_info.formatting, subtotal]);

  const grandTotal = useMemo(() => {
    let grandTotal = subtotal - subtotal * discountRate;
    grandTotal += grandTotal * taxRate;
    grandTotal += deliveryFee;
    grandTotal /= multiplier;

    return shop.base_currency_info.formatting.replace(
      "?",
      grandTotal.toLocaleString()
    );
  }, [multiplier, shop.base_currency_info.formatting, subtotal]);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-300">
        <h2 className="font-bold">Price summary</h2>
      </div>

      <table className="w-full text-sm">
        <tbody>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Subtotal</th>
            <td className="text-right px-4 py-2 font-bold">{itemsSubtotal}</td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Discounts</th>
            <td className="text-right px-4 py-2 font-bold text-green-600">
              - {discount}
            </td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">
              Taxes @ {taxRate * 100}%
            </th>
            <td className="text-right px-4 py-2 font-bold">{taxes}</td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Delivery fee</th>
            <td
              className={clsx("text-right px-4 py-2 font-bold", {
                "text-green-600": deliveryFee === 0,
              })}
            >
              {deliveryDisplay}
            </td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Grand total</th>
            <td className="text-right px-4 py-2 text-green-600 font-extrabold text-2xl">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
