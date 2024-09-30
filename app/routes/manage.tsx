import { json, MetaFunction, redirect } from "@remix-run/node";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "react-router";
import { getSessionFromRequest } from "~/utils/auth.server";
import { getShopByHostName } from "~/utils/queries.server";
import { MdOutlinePowerSettingsNew } from "react-icons/md";

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

  return (
    <div>
      <h1 className="text-2xl">{shop.full_name} management portal</h1>

      <div>
        <p>Welcome {session.userName}</p>

        <Form method="POST" action="logout">
          <button
            type="submit"
            title="Logout"
            className="border rounded-full p-2 bg-white hover:bg-gray-100 transition-colors"
          >
            <MdOutlinePowerSettingsNew />
          </button>
        </Form>
      </div>

      <Outlet />
    </div>
  );
}
