import {
  json,
  SerializeFrom,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import {
  getProducts,
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { useCallback } from "react";
import { LuShare } from "react-icons/lu";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { ShoppingCartBanner } from "./ShoppingCartBanner";
import { ShoppingCartButton } from "./ShoppingCartButton";
import { getUserLocale } from "~/utils/misc";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  const shoppinCartProducts = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ shop, shoppingCartContent, shoppinCartProducts, locale });
}

export type LoaderDataType = SerializeFrom<typeof loader>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.shop.full_name} | ShopAt.bio` },
    {
      name: "description",
      content: data?.shop.tagline,
    },
  ];
};

export default function ShopLayout() {
  const location = useLocation();

  const { shop, shoppingCartContent, shoppinCartProducts, locale } =
    useLoaderData<typeof loader>();

  const shareLink = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      console.log("Web Share API not supported.");
    }
  }, []);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto border border-y-0 min-h-screen">
        <style
          dangerouslySetInnerHTML={{
            __html: `body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          filter: blur(30px); 
          z-index: -1;
          background-image: url("${shop.bgUrl}");
        }`,
          }}
        />

        {/* Header */}
        <div
          className="border border-x-0 border-t-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${shop.coverUrl ?? ""})`,
          }}
        >
          <div className="flex justify-between p-2">
            <ShoppingCartButton
              cartContent={shoppingCartContent}
              shopId={shop.id}
            />
            <button
              className="border p-2 rounded-md bg-gray-200"
              onClick={() =>
                shareLink({
                  title: `${shop.full_name}'s shop at ShopAt.bio`,
                  text: shop.tagline ?? "",
                  url: window.location.href,
                })
              }
            >
              <LuShare className="text-gray-600" />
            </button>
          </div>

          <div className="mt-16 flex justify-center mb-4 mx-2">
            <Link to=".">
              <img
                className="rounded-full w-24 min-h-24 object-contain border"
                src={shop.iconUrl ?? "https://placehold.co/100"}
                alt={`${shop.url_name}'s logo`}
              />
            </Link>
          </div>

          <div className="text-center">
            <Link to="." className="hover:underline">
              <h1 className="text-lg font-bold">{shop.full_name}</h1>
            </Link>
            <p className="text-sm">{shop.tagline}</p>
          </div>

          <SocialMediaLinks links={shop.links} className="my-8" />
        </div>

        {/* Body */}
        <div className="p-2 overflow-x-hidden min-h-[50vh]">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="border border-x-0 border-b-0 p-2 py-8 bg-[#e5e7eb]">
          <p className="text-center">
            Powered by{" "}
            <a
              href={`/?utm_source=shopat.bio&utm_medium=shop&utm_campaign=footer_logo_cta&utm_content=${shop.url_name}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-blue-500"
            >
              ShopAt.bio
            </a>
          </p>
        </div>
      </div>

      {/* shopping cart banner (don't show on the cart page) */}
      {!location.pathname.endsWith("/cart") && (
        <ShoppingCartBanner
          shop={shop}
          cartContent={shoppingCartContent}
          productsInfo={shoppinCartProducts}
          locale={locale}
        />
      )}
    </>
  );
}
