import { json, MetaFunction, redirect } from "@remix-run/node";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "react-router";
import { getSessionFromRequest } from "~/utils/auth.server";
import { getShopByHostName } from "~/utils/queries.server";
import { MdOutlinePowerSettingsNew } from "react-icons/md";
import clsx from "clsx";
import React, { useState } from "react";
import { is } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionFromRequest(request);
  if (!session.isLoggedIn) {
    return redirect("login");
  }

  const shop = await getShopByHostName(request.headers.get("Host"));
  return json({
    shop,
    session: session.plainObject,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Management portal | ${data?.shop.full_name} | ShopAt.bio` },
    {
      name: "description",
      content: data?.shop.tagline,
    },
  ];
};

export default function ManagementPortalLayout() {
  // const { shop, session } = useLoaderData<typeof loader>();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const topBarHeight = 50;

  return (
    <>
      <header
        className="bg-green-300 p-2 fixed w-full top-0"
        style={{ height: topBarHeight }}
      >
        Topbar
        <button
          className="border md:hidden p-2 rounded-md mx-2"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          Menu
        </button>
      </header>

      <div className="min-h-screen" style={{ paddingTop: topBarHeight }}>
        <SideBar
          className="fixed hidden md:block overflow-y-scroll overflow-x-hidden w-60 hover:scrollbar-thin scrollbar-none scrollbar-thumb-gray-500/40 scrollbar-track-transparent"
          style={{
            height: `calc(100vh - ${topBarHeight}px)`,
          }}
        />

        {/* WARNING: Margin-left must be equal to sidebar's width */}
        <main className="bg-yellow-200 p-2 md:ml-60">
          <Outlet />
          <ol>
            {Array.from({ length: 200 }).map((v, i) => (
              <li key={i}>Item #{i + 1}</li>
            ))}
          </ol>
        </main>
      </div>

      {isMobileMenuOpen && (
        <SideBar
          className="fixed top-0 w-full h-screen overflow-y-auto"
          onCloseClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

function SideBar({
  className,
  style,
  onCloseClick,
}: {
  className?: string;
  style?: React.CSSProperties;
  onCloseClick?: () => void;
}) {
  return (
    <aside className={clsx("bg-red-400 p-2", className)} style={style}>
      {onCloseClick && (
        <button className="border p-2 rounded-md mx-2" onClick={onCloseClick}>
          Close menu
        </button>
      )}
      Sidebar
      <ol>
        {Array.from({ length: 100 }).map((v, i) => (
          <li key={i}>Item #{i + 1}</li>
        ))}
      </ol>
    </aside>
  );
}
