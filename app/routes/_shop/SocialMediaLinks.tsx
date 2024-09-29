import { useMemo } from "react";
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
import type { ShopLayoutData } from "~/routes/_shop/route";
import { ArrayElement } from "~/utils/types";

type SocialMediaLink = ArrayElement<ShopLayoutData["shop"]["links"]>;

export function SocialMediaLinks({
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
