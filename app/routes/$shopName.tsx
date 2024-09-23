import {
  json,
  SerializeFrom,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { socialMediaLinks } from "db/schema";
import { InferSelectModel } from "drizzle-orm";
import { getShopByUrlNameOrThrow } from "~/utils/queries.server";
import { useCallback, useMemo } from "react";
import clsx from "clsx";
import {
  PiYoutubeLogo,
  PiFacebookLogo,
  PiGlobeLight,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiThreadsLogo,
  PiTiktokLogo,
} from "react-icons/pi";
import { MdOutlineEmail } from "react-icons/md";
import { FaQuora, FaXTwitter } from "react-icons/fa6";
import { LuShare } from "react-icons/lu";

export async function loader({ params }: LoaderFunctionArgs) {
  const shop = await getShopByUrlNameOrThrow(params.shopName);
  return json({ shop });
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
  const { shop } = useLoaderData<typeof loader>();

  const shareLink = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      console.log("Web Share API not supported.");
    }
  }, []);

  return (
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
        <div className="flex justify-end p-2">
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
