import { db } from "db";
import * as v from "valibot";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { addMinutes, isPast } from "date-fns";
import { users, userLoginSessions } from "db/schema";
import { CookieSerializeOptions, createSessionStorage } from "@remix-run/node";

type LoginSessionData = {
  userId: string;
  userName: string;
};

const SESSION_EXPIRY_SECONDS = 1 * 365 * 24 * 60 * 60; // 1 year

const loginSession = createSessionStorage<LoginSessionData>({
  cookie: {
    name: "login-session",
    sameSite: "strict",
    path: "/manage",
    httpOnly: true,
    maxAge: SESSION_EXPIRY_SECONDS,
    secure: process.env.NODE_ENV === "production",
  },
  async createData(data, expires) {
    if (!data.userId || !expires) {
      throw new Error("userId and expires must be present");
    }

    const token = nanoid(8);
    const tokenHash = await bcrypt.hash(token, 8);

    const [session] = await db
      .insert(userLoginSessions)
      .values({
        token_hash: tokenHash,
        user_id: data.userId,
        expiry: expires,
      })
      .returning({ uuid: userLoginSessions.id });

    if (!session) {
      throw new Error("Failed to create session");
    }

    return serializeSessionId(session.uuid, token);
  },
  async readData(id) {
    const sessionId = parseSessionId(id);
    if (!sessionId) {
      return null;
    }

    const { uuid, token } = sessionId;

    const session = await db.query.userLoginSessions.findFirst({
      where(fields, { eq, and, gt }) {
        return and(eq(fields.id, uuid), gt(fields.expiry, new Date()));
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            is_email_verified: true,
          },
        },
      },
      columns: {
        user_id: false,
      },
    });

    if (!session) return null;

    const doesTokenMatch = await bcrypt.compare(token, session.token_hash);
    if (!doesTokenMatch) return null;

    return {
      userId: session.user.id,
      userName: session.user.name,
    };
  },
  async updateData(id, data, expires) {
    const sessionId = parseSessionId(id);
    invariant(sessionId, "invalid session id");

    const { uuid } = sessionId;

    await db
      .update(userLoginSessions)
      .set({
        user_id: data.userId,
        expiry: expires,
      })
      .where(eq(userLoginSessions.id, uuid));
  },
  async deleteData(id) {
    const sessionId = parseSessionId(id);
    if (!sessionId) return;

    const { uuid } = sessionId;
    await db.delete(userLoginSessions).where(eq(userLoginSessions.id, uuid));
  },
});

function serializeSessionId(uuid: string, token: string): string {
  return JSON.stringify([uuid, token]);
}

const SessionIdSchma = v.pipe(
  v.string(),
  v.transform((s) => {
    try {
      return JSON.parse(s);
    } catch (error) {
      return null;
    }
  }),
  v.tuple([v.pipe(v.string(), v.uuid()), v.pipe(v.string(), v.nonEmpty())])
);

function parseSessionId(
  sessionId: string
): null | { uuid: string; token: string } {
  const parsed = v.safeParse(SessionIdSchma, sessionId);
  if (!parsed.success) {
    return null;
  }

  const [uuid, token] = parsed.output;
  return { uuid, token };
}

async function generateOTP(length: number) {
  // Ensure the length is a positive number
  if (length <= 0) {
    throw new Error("Length must be a positive number");
  }

  const min = Math.pow(10, length - 1); // Smallest number with the given length
  const max = Math.pow(10, length) - 1; // Largest number with the given length

  // Generates a random number between min and max and converts it to a string
  const otp = Math.floor(min + Math.random() * (max - min + 1)).toString();

  // Generate hash
  const hash = await bcrypt.hash(otp, 10);

  return { otp, hash };
}

export async function getSessionFromRequest(request: Request) {
  const session = await loginSession.getSession(request.headers.get("Cookie"));

  return {
    sessionObj: session,
    get userId() {
      return session.get("userId");
    },
    get userName() {
      return session.get("userName");
    },
    get isLoggedIn() {
      return !!this.userId;
    },
    commit(options?: CookieSerializeOptions) {
      return loginSession.commitSession(session, options);
    },
    get plainObject() {
      return { userId: this.userId, userName: this.userName };
    },
    delete() {
      return loginSession.destroySession(session);
    },
  };
}

export async function sendLoginOTP(email: string) {
  const user = await db.query.users.findFirst({
    where(fields, { and, eq }) {
      return and(eq(fields.email, email), eq(fields.is_email_verified, true));
    },
  });

  if (user) {
    const { otp, hash } = await generateOTP(6);

    // TODO: Remove this
    console.log("The OTP is:", otp);

    await db
      .update(users)
      .set({
        email_otp_hash: hash,
        email_otp_expiry: addMinutes(Date.now(), 10),
      })
      .where(eq(users.id, user.id));
  }

  return user?.id;
}

export async function submitOTPandGetSessionCookie(
  request: Request,
  userId: string,
  otp: string
) {
  const user = await db.query.users.findFirst({
    where(fields, { and, eq }) {
      return and(eq(fields.id, userId), eq(fields.is_email_verified, true));
    },
  });

  if (
    !user ||
    !user.email_otp_expiry ||
    isPast(user.email_otp_expiry) ||
    !user.email_otp_hash
  ) {
    throw new Response(null, { status: 401 });
  }

  // Verify OTP
  const isOTPMatching = await bcrypt.compare(otp, user.email_otp_hash);
  if (!isOTPMatching) {
    throw new Response(null, { status: 401 });
  }

  const session = await getSessionFromRequest(request);

  session.sessionObj.set("userId", user.id);
  session.sessionObj.set("userName", user.name);

  const cookie = await session.commit();

  // Remove old otp
  await db
    .update(users)
    .set({
      email_otp_hash: null,
      email_otp_expiry: null,
      is_email_verified: true,
    })
    .where(eq(users.id, user.id));

  return cookie;
}
