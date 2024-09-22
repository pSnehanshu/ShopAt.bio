import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAuthInfo } from "~/utils/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthInfo(request);
  return json({ auth });
}

export const meta: MetaFunction = () => {
  return [
    { title: "ShopAt.bio" },
    {
      name: "description",
      content: "Your own online store in your Instagram bio",
    },
  ];
};

export default function Index() {
  const { auth } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-center justify-center">
      <pre>{JSON.stringify(auth, null, 2)}</pre>
    </div>
  );
}
