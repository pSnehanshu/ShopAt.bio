import { json, MetaFunction } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "react-router";
import { getSessionFromRequest } from "~/utils/auth.server";
import { getShopByHostName } from "~/utils/queries.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionFromRequest(request);
  const shop = await getShopByHostName(request.headers.get("Host"));
  return json({
    shop,
    session: session.plainObject,
    isLoggedIn: session.isLoggedIn,
  });
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
  const { shop, session, isLoggedIn } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Management portal for {shop.full_name}</h1>
      {isLoggedIn ? (
        <div>
          <p>Welcome {session.userName}</p>

          <Form method="POST" action="logout">
            <button type="submit">Logout</button>
          </Form>
        </div>
      ) : (
        <Link to="login">Login</Link>
      )}

      <Outlet />
    </div>
  );
}
