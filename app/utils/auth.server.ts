import { auth as serverAuth } from "~/firebase.server";
import { session } from "~/utils/cookies";
import { db } from "db";
import { users } from "db/schema";
import { type DecodedIdToken } from "firebase-admin/auth";
import { type InferSelectModel } from "drizzle-orm";

type AuthInfo =
  | {
      token: DecodedIdToken;
      user: InferSelectModel<typeof users>;
      isLoggedIn: true;
    }
  | {
      token?: DecodedIdToken;
      user?: InferSelectModel<typeof users>;
      isLoggedIn: false;
    };

export async function getAuthInfo(request: Request): Promise<AuthInfo> {
  // Get the cookie value (JWT)
  const jwt = await session.parse(request.headers.get("Cookie"));

  // No JWT found...
  if (typeof jwt !== "string") {
    return { isLoggedIn: false };
  }

  const token = await serverAuth.verifySessionCookie(jwt);

  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.firebase_id, token.uid),
  });

  if (!user) {
    return { token, user, isLoggedIn: false };
  }

  return { token, user, isLoggedIn: true };
}
