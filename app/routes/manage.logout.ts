import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { getSessionFromRequest } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionFromRequest(request);
  return redirect("..", {
    headers: {
      "Set-Cookie": await session.delete(),
    },
  });
}
