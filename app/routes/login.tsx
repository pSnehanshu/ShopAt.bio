/* eslint-disable jsx-a11y/anchor-is-valid */
import { SyntheticEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "~/firebase.client";
import { serverAuth } from "~/firebase.server";
import { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { redirect, useFetcher } from "@remix-run/react";
import { session } from "~/utils/cookies.server";
import { FaFacebook, FaGoogle, FaEnvelope } from "react-icons/fa6";
import { SlSocialInstagram } from "react-icons/sl";
import { IoIosArrowBack } from "react-icons/io";
import { getAuthInfo } from "~/utils/queries.server";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const idToken = form.get("idToken")?.toString();

  invariant(idToken, "ID token not submitted");

  // Verify the idToken is actually valid
  await serverAuth.verifyIdToken(idToken);

  const jwt = await serverAuth.createSessionCookie(idToken, {
    // 5 days - can be up to 2 weeks
    expiresIn: 60 * 60 * 24 * 5 * 1000,
  });

  return redirect("/", {
    headers: {
      "Set-Cookie": await session.serialize(jwt),
    },
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthInfo(request);

  if (auth.isLoggedIn) {
    return redirect("/");
  }

  return null;
}

export default function Login() {
  const [showEmailPassLogin, setShowEmailPassLogin] = useState(false);

  return (
    <div className="lg:mt-20 lg:p-8">
      <div className="mx-auto w-[400px]">
        <SlSocialInstagram className="mx-auto h-10 w-auto" />
        <h2 className="mt-6 text-center text-2xl  leading-9 tracking-tight text-foreground">
          ShopAt.bio
        </h2>
      </div>

      {/* Login methods */}
      <div className="rounded-xl border bg-card text-card-foreground shadow mx-auto mt-10 w-[400px]">
        {showEmailPassLogin ? (
          <EmailPasswordLogin onBack={() => setShowEmailPassLogin(false)} />
        ) : (
          <>
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight text-center">
                Sign in to your account
              </h3>

              <p className="text-sm text-muted-foreground text-center">
                Use one of the following methods to sign in.
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="flex flex-col gap-4">
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-8"
                  type="button"
                >
                  <FaGoogle className="mr-2" />
                  Google
                </button>
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-8"
                  type="button"
                >
                  <FaFacebook className="mr-2" />
                  Facebook
                </button>
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-8"
                  type="button"
                  onClick={() => setShowEmailPassLogin(true)}
                >
                  <FaEnvelope className="mr-2" />
                  Email and password
                </button>
              </div>
            </div>
          </>
        )}

        {/* T&C and Privacy policy */}
        <div className="flex items-center p-6 pt-0">
          <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              target="_blank"
              className="underline underline-offset-4 hover:text-primary"
              rel="noreferrer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              target="_blank"
              className="underline underline-offset-4 hover:text-primary"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function EmailPasswordLogin({ onBack }: { onBack?: () => void }) {
  const fetcher = useFetcher();

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };

    const email = target.email.value;
    const password = target.password.value;

    try {
      const credential = await signInWithEmailAndPassword(
        clientAuth,
        email,
        password
      );
      const idToken = await credential.user.getIdToken();

      // Trigger a POST request which the action will handle
      fetcher.submit({ idToken }, { method: "post", action: "/login" });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="m-2 ">
      {onBack && (
        <button
          onClick={onBack}
          className="flex border p-1 px-2 rounded-xl gap-2"
        >
          <IoIosArrowBack className="relative top-1" />
          <span>Back</span>
        </button>
      )}

      <form
        className="m-2"
        action="login"
        method="post"
        onSubmit={handleSubmit}
      >
        <input type="email" name="email" placeholder="Email address" />
        <input type="password" name="password" placeholder="Password" />

        <button
          type="submit"
          className="block border rounded-md px-8 py-1 shadow-md"
        >
          Login
        </button>
      </form>
    </div>
  );
}
