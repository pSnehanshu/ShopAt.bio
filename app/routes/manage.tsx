import { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import { getShopByHostName } from "~/utils/queries.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await getShopByHostName(request.headers.get("Host"));
  return json({ shop });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Management portal (${data?.shop.full_name}) | ShopAt.bio` },
    {
      name: "description",
      content: data?.shop.tagline,
    },
  ];
};

export default function ManagementPortalLayout() {
  return (
    <div>
      <h1>Management portal layout</h1>
      <Outlet />
    </div>
  );
}
