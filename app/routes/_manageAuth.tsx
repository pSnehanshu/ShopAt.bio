import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getSessionFromRequest } from "~/utils/auth.server";
import { getShopByHostName } from "~/utils/queries.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionFromRequest(request);

  if (session.isLoggedIn) {
    // Redirect to the home page if they are already signed in.
    return redirect("../manage");
  }

  const shop = await getShopByHostName(request.headers.get("Host"));
  return json({ shop });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `Login to Management portal | ${data?.shop.full_name} | ShopAt.bio`,
  },
];

export default function ManageAuthLayout() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen min-w-full flex justify-center items-center flex-col bg-blue-300">
      <div className="h-fit my-4 w-full max-w-96 px-2">
        <div className="flex flex-col items-center mb-8 gap-2">
          <img
            src={shop.iconUrl}
            alt={`${shop.full_name}'s LOGO`}
            className="rounded-full w-24 min-h-24 object-contain border"
          />

          <div className="text-center">
            <h1 className="text-lg">
              Login to <strong>{shop.full_name}</strong>
            </h1>
            <p className="text-sm font-light">Management portal</p>
          </div>
        </div>

        <div className="rounded-xl shadow-lg p-4 bg-gray-50 overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      <div className="my-16">
        <p className="text-xs">
          Powered by{" "}
          <a
            href="http://shopAt.bio"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            ShopAt.bio
          </a>
        </p>
      </div>
    </div>
  );
}
