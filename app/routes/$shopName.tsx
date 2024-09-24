import {
  json,
  SerializeFrom,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import type { socialMediaLinks } from "db/schema";
import { InferSelectModel } from "drizzle-orm";
import {
  getShopByUrlNameOrThrow,
  parseShoppingCartCookie,
} from "~/utils/queries.server";
import { useCallback, useMemo } from "react";
import type { InferOutput } from "valibot";
import clsx from "clsx";
import {
  PiYoutubeLogo,
  PiFacebookLogo,
  PiGlobeLight,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiThreadsLogo,
  PiTiktokLogo,
  PiShoppingCartLight,
  PiShoppingCartFill,
} from "react-icons/pi";
import { MdOutlineEmail } from "react-icons/md";
import { FaQuora, FaXTwitter, FaArrowRight } from "react-icons/fa6";
import { LuShare } from "react-icons/lu";
import { ShoppingCartCookieSchema } from "~/utils/cookies.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  const shoppingCartContent = await parseShoppingCartCookie(request);

  return json({ shop, shoppingCartContent });
}

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
  const { shop, shoppingCartContent } = useLoaderData<typeof loader>();

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
            backgroundImage: `url(${shop.coverUrl})` ?? "",
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
            <img
              className="rounded-full w-24 min-h-24 object-contain border"
              src={shop.iconUrl ?? "https://placehold.co/100"}
              alt={`${shop.url_name}'s logo`}
            />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold">{shop.full_name}</h1>
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

      {/* shopping cart banner */}
      <ShoppingCartBanner cartContent={shoppingCartContent} shopId={shop.id} />
    </>
  );
}

type SocialMediaLink = SerializeFrom<InferSelectModel<typeof socialMediaLinks>>;

function SocialMediaLinks({
  links,
  className,
}: {
  links: SocialMediaLink[];
  className?: string;
}) {
  return (
    <ul className={clsx("flex space-x-4 justify-center", className)}>
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={(link.platform === "email" ? "mailto:" : "") + link.url}
            target="_blank"
            rel="noopener noreferrer"
            // className="transition-transform "
          >
            <PlatformIcon platformName={link.platform} className="h-8 w-8" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function PlatformIcon({
  platformName,
  className,
}: {
  platformName: SocialMediaLink["platform"];
  className?: string;
}) {
  const Icon = useMemo(() => {
    switch (platformName) {
      case "email":
        return MdOutlineEmail;
      case "facebook":
        return PiFacebookLogo;
      case "generic_link":
        return PiGlobeLight;
      case "instagram":
        return PiInstagramLogo;
      case "linkedin":
        return PiLinkedinLogo;
      case "quora":
        return FaQuora;
      case "threads":
        return PiThreadsLogo;
      case "tiktok":
        return PiTiktokLogo;
      case "x":
        return FaXTwitter;
      case "youtube":
        return PiYoutubeLogo;
    }
  }, [platformName]);

  return <Icon className={clsx(className)} />;
}

function ShoppingCartButton({
  cartContent,
  shopId,
}: {
  cartContent: InferOutput<typeof ShoppingCartCookieSchema> | null;
  shopId: string;
}) {
  const products = cartContent?.[shopId] ?? [];

  let total = 0;
  products.forEach((p) => {
    total += p.qty;
  });

  return (
    <Link to="cart" className="border p-2 rounded-md bg-gray-200 flex gap-2">
      <PiShoppingCartLight className="relative top-1" />{" "}
      <span>Cart ({total})</span>
    </Link>
  );
}

function ShoppingCartBanner({
  cartContent,
  shopId,
}: {
  cartContent: InferOutput<typeof ShoppingCartCookieSchema> | null;
  shopId: string;
}) {
  const products = cartContent?.[shopId] ?? [];

  let total = 0;
  products.forEach((p) => {
    total += p.qty;
  });

  if (total <= 0) {
    return <></>;
  }

  return (
    <div className="grid grid-cols-6 min-h-16 fixed bottom-0 md:bottom-5 left-1/2 transform -translate-x-1/2 w-full md:max-w-xl shadow-xl bg-[#ff527b] bg-opacity-70 backdrop-blur-sm md:rounded-xl p-2">
      <div className="col-span-4 text-white p-2">
        There are {total} items are in your cart
      </div>

      <Link
        to="cart"
        className="col-span-2 border p-2 rounded-xl text-white flex justify-center space-x-2"
      >
        <PiShoppingCartFill className="relative top-1" />
        <span>Go to cart</span>
        <FaArrowRight className="relative top-1" />
      </Link>
    </div>
  );
}
