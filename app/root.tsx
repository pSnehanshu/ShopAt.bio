import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";

import "./tailwind.css";
import {
  getProducts,
  getShopByHostName,
  parseShoppingCartCookie,
} from "./utils/queries.server";
import { getUserLocale } from "./utils/misc";
import { ShopLayout } from "./components/ShopLayout";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="relative z-[1]">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await getShopByHostName(request.headers.get("Host"));
  const shoppingCartContent = await parseShoppingCartCookie(request);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  const shoppinCartProducts = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ shop, shoppingCartContent, shoppinCartProducts, locale });
}

export type RootLoaderData = SerializeFrom<typeof loader>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.shop.full_name} | ShopAt.bio` },
    {
      name: "description",
      content: data?.shop.tagline,
    },
  ];
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <ShopLayout
      locale={data.locale}
      shop={data.shop}
      shoppinCartProducts={data.shoppinCartProducts}
      shoppingCartContent={data.shoppingCartContent}
    >
      <Outlet />
    </ShopLayout>
  );
}
