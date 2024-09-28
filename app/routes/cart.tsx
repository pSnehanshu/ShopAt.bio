import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { MdAdd, MdRemove } from "react-icons/md";
import invariant from "tiny-invariant";
import { PriceSummary } from "~/components/PriceSummary";
import { getCurrencyAmtFormatted, getUserLocale } from "~/utils/misc";
import { getOrderPriceSummary } from "~/utils/orders.server";
import {
  addToShoppingCart,
  getProducts,
  getShopByHostName,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import type { ArrayElement } from "~/utils/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const productUrlName = formData.get("product_url_name");
  const operation = formData.get("operation");
  const hostName = request.headers.get("Host");

  invariant(
    productUrlName,
    "product_url_name must be provided in request body"
  );
  invariant(hostName, "Host header must be set");

  const cookie = await addToShoppingCart(
    request,
    productUrlName.toString(),
    hostName,
    operation?.toString() === "remove" ? "remove" : "add"
  );

  return new Response(null, {
    headers: { "Set-Cookie": cookie },
    status: 201,
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getUserLocale(request.headers.get("Accept-Language"));

  const shop = await getShopByHostName(request.headers.get("Host"));
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  const products = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const priceSummary = await getOrderPriceSummary(
    shoppingCartContent,
    shop,
    locale,
    products
  );

  return json({ shoppingCartContent, products, shop, priceSummary, locale });
}

type LoaderDataType = SerializeFrom<typeof loader>;

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `Shopping Cart | ${data?.shop.full_name} | ShopAt.bio`,
  },
];

export default function ShoppingCart() {
  const { products, shop, shoppingCartContent, priceSummary, locale } =
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
                  locale={locale}
                />
              </li>
            ))}
          </ol>

          <PriceSummary summary={priceSummary} />

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
  locale,
}: {
  product: Product;
  cartContent: LoaderDataType["shoppingCartContent"];
  shop: LoaderDataType["shop"];
  locale: string;
}) {
  const qty =
    cartContent?.[shop.id]?.find((p) => p.productId === product.id)?.qty ?? 0;
  const link = `../p/${product.url_name}`;
  const taxRate = parseFloat(product.tax_rate?.rate ?? "0.00") * 100;

  const totalCost = getCurrencyAmtFormatted(
    product.price * qty,
    shop.base_currency_info.multiplier,
    shop.base_currency,
    locale
  );

  return (
    <div className="rounded-xl p-4 grid grid-cols-4 gap-2 border hover:shadow-lg bg-white bg-opacity-70">
      <div className="col-span-3">
        <Link to={link} className="hover:underline hover:text-blue-500">
          <h3 className="text-sm">{product.name}</h3>
        </Link>

        <div className="text-lg font-bold">
          {totalCost} <span className="text-xs font-normal">+{taxRate}%</span>
        </div>

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
