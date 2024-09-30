import { Form } from "@remix-run/react";

export default function ManagementPortalLogin() {
  return (
    <Form method="post" action="otp" className="space-y-4">
      <input type="hidden" name="intent" value="send_otp" />
      <div>
        <label className="space-y-1">
          <div className="ml-1">Email address</div>
          <input
            type="email"
            name="email"
            required
            className="border bg-white p-2 rounded-xl w-full"
          />
        </label>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          className="border px-4 py-2 rounded-xl bg-white hover:bg-gray-100 transition-colors"
        >
          Send OTP
        </button>
      </div>
    </Form>
  );
}
