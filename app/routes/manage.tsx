import clsx from "clsx";
import React, { useState } from "react";
import { json, MetaFunction, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "react-router";
import { getSessionFromRequest } from "~/utils/auth.server";
import { getShopByHostName } from "~/utils/queries.server";
import { AiOutlineMenu } from "react-icons/ai";
import { FaPowerOff } from "react-icons/fa6";

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
  const { shop, session } = useLoaderData<typeof loader>();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const topBarHeight = 64;

  return (
    <>
      <header
        className="bg-gray-300 bg-opacity-60 backdrop-blur-xl shadow-xl p-2 fixed w-full top-0 overflow-hidden flex justify-between"
        style={{ height: topBarHeight }}
      >
        <div className="flex items-center gap-2">
          <Link to="." className="h-full">
            <img
              src={shop.iconUrl}
              alt="LOGO"
              className="rounded-full object-cover h-full max-w-16 hover:shadow-2xl"
            />
          </Link>

          <div>
            <Link to="." className="hover:underline">
              <h1>{shop.full_name}</h1>
            </Link>
            <p className="text-xs font-light">Management portal</p>
          </div>
        </div>

        <div className="hidden md:block py-1 text-center max-h-full">
          <p className="font-light text-xl">Welcome {session.userName}!</p>
          <Link
            to="/"
            className="text-xs font-light hover:underline hover:text-blue-500"
          >
            Visit the store
          </Link>
        </div>

        <div className="flex gap-2">
          <Form action="logout" method="POST">
            <button
              type="submit"
              className="border border-red-400 text-red-400 p-4 rounded-md hover:bg-gray-300"
            >
              <FaPowerOff className="text-sm" />
            </button>
          </Form>

          <button
            className="border border-gray-400 text-gray-600 p-4 rounded-md md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <AiOutlineMenu />
          </button>
        </div>
      </header>

      <div className="min-h-screen" style={{ paddingTop: topBarHeight }}>
        <SideBar
          className="fixed hidden md:block overflow-y-scroll overflow-x-hidden w-60 hover:scrollbar-thin scrollbar-none scrollbar-thumb-gray-500/40 scrollbar-track-transparent"
          style={{
            height: `calc(100vh - ${topBarHeight}px)`,
          }}
        />

        {/* WARNING: Margin-left must be equal to sidebar's width */}
        <main className="p-2 md:ml-60">
          <Outlet />
          <ol>
            {Array.from({ length: 200 }).map((v, i) => (
              <li key={i}>Item #{i + 1}</li>
            ))}
          </ol>

          <footer className="text-center font-light mt-16 p-2 border-t text-sm">
            Powered by{" "}
            <a
              href="http://ShopAt.bio"
              className="underline hover:text-blue-500"
              target="_blank"
              rel="noreferrer"
            >
              ShopAt.bio
            </a>
          </footer>
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
