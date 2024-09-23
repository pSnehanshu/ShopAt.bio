import { db } from "db";
import { users } from "db/schema";
import { InferSelectModel } from "drizzle-orm";
import { DecodedIdToken } from "firebase-admin/auth";
import invariant from "tiny-invariant";
import { session } from "~/utils/cookies";
import { getFileURL, serverAuth } from "~/firebase.server";

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

export async function getShopByUrlNameOrThrow(
  shopUrlName: string | null | undefined
) {
  invariant(shopUrlName, "expected shopUrlName");

  const shop = await db.query.shops.findFirst({
    where: (fields, { eq }) => eq(fields.url_name, shopUrlName),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
        },
      },
      base_currency_info: true,
      links: true,
    },
  });

  if (!shop) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    ...shop,
    iconUrl: getFileURL(shop.icon_path),
    coverUrl: getFileURL(shop.cover_path),
    bgUrl: getFileURL(shop.bg_path),
  };
}

export async function getProductByUrlNameOrThrow(
  shopId: string,
  productUrlName: string | null | undefined
) {
  invariant(productUrlName, "expected productUrlName");

  const product = await db.query.products.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.url_name, productUrlName), eq(fields.shop_id, shopId)),
  });

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return product;
}
