import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import {
  getSessionFromRequest,
  sendLoginOTP,
  submitOTPandGetSessionCookie,
} from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  switch (intent) {
    case "send_otp": {
      const email = formData.get("email")?.toString();
      invariant(email, "Email must be submitted");
      const userId = await sendLoginOTP(email);
      const session = await getSessionFromRequest(request);
      return json(
        { user_id: userId },
        // We need to delete current session, so that login succeeds
        { headers: { "Set-Cookie": await session.delete() } }
      );
    }
    case "submit_otp": {
      const userId = formData.get("user_id")?.toString();
      const otp = formData.get("otp")?.toString();
      invariant(userId && otp, "User id and OTP must be submitted");
      const cookie = await submitOTPandGetSessionCookie(request, userId, otp);
      return redirect("../manage", { headers: { "Set-Cookie": cookie } });
    }
    default:
      throw new Response("invalid intent", { status: 400 });
  }
}

export default function ManagementPortalLogin() {
  const data = useActionData<typeof action>();

  return (
    <div>
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value="submit_otp" />
        <input type="hidden" name="user_id" value={data?.user_id} />
        <div>
          <label className="space-y-1">
            <div className="ml-1">Enter OTP</div>
            <input
              type="number"
              name="otp"
              className="border bg-white p-2 rounded-xl w-full"
            />
          </label>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="border px-4 py-2 rounded-xl bg-white hover:bg-gray-100 transition-colors"
          >
            Submit OTP
          </button>
        </div>
      </Form>
    </div>
  );
}
