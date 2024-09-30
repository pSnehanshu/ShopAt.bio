import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { getSessionFromRequest } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionFromRequest(request);

  if (session.isLoggedIn) {
    // Redirect to the home page if they are already signed in.
    return redirect("..");
  }

  return null;
}

export default function ManagementPortalLogin() {
  return (
    <div>
      <h1>Login</h1>

      <Form method="post" action="otp">
        <input type="hidden" name="intent" value="send_otp" />
        <div>
          <label>
            <span>Email</span>
            <input type="email" name="email" />
          </label>
        </div>

        <button type="submit">Send OTP</button>
      </Form>
    </div>
  );
}
