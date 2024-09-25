import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getCurrencyAmtFormatted, getUserLocale } from "~/utils/misc";
import {
  getProductById,
  getProductByUrlNameOrThrow,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { AddToCartBtn } from "~/components/AddToCartBtn";

function isUUID(str: string | null | undefined): boolean {
  if (!str) return false;

  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const product = await (isUUID(params.productName)
    ? getProductById(params.productName)
    : getProductByUrlNameOrThrow(shop.id, params.productName));

  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ product, shop, shoppingCartContent, locale });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `${data?.product.name} | ${data?.shop.full_name} | ShopAt.bio`,
    description: data?.product.description,
  },
];

export default function Index() {
  const { product, shop, shoppingCartContent, locale } =
    useLoaderData<typeof loader>();

  const price = getCurrencyAmtFormatted(
    product.price,
    shop.base_currency_info.multiplier,
    shop.base_currency,
    locale
  );

  const taxes = parseFloat(product.tax_rate ?? shop.default_tax_rate) * 100;

  return (
    <div className="mb-16">
      <div className="rounded-t-xl overflow-hidden">
        <img src={product.photoUrl} alt={product.name} className="w-full" />
      </div>

      <div className="bg-white bg-opacity-40 rounded-b-xl p-4">
        <h1 className="text-lg uppercase mb-4">{product.name}</h1>
        <p className="font-light mb-4">{product.description}</p>

        <div>
          <span className="text-xl font-bold">{price}</span>
          <span className="text-xs font-light ml-1">+{taxes}% taxes</span>
        </div>

        <div className="my-4 max-w-64">
          <AddToCartBtn
            product={product}
            cartContent={shoppingCartContent}
            cartLocation="../cart"
            btnTextFull
          />
        </div>
      </div>
    </div>
  );
}
