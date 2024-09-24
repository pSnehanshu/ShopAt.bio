import { db } from "db";
import { users } from "db/schema";
import { InferSelectModel } from "drizzle-orm";
import { DecodedIdToken } from "firebase-admin/auth";
import invariant from "tiny-invariant";
import {
  session,
  shoppingCart,
  ShoppingCartCookieSchema,
} from "~/utils/cookies.server";
import { getFileURL, serverAuth } from "~/firebase.server";
import * as v from "valibot";

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

export async function getHomepageProducts(shopId: string) {
  const products = await db.query.products.findMany({
    where: (fields, { eq, and }) =>
      and(eq(fields.is_visible, true), eq(fields.shop_id, shopId)),
    with: {
      photos: {
        where: (fields, { eq }) => eq(fields.is_main, true),
        limit: 1,
        orderBy: (fields, { desc }) => desc(fields.created_at),
      },
    },
    limit: 20,
  });

  return products.map((p) => ({
    ...p,
    photoUrl: getFileURL(p.photos.at(0)?.path),
  }));
}

/** Get contents of shopping cart */
export async function parseShoppingCartCookie(request: Request) {
  const shoppingCartCookie = await shoppingCart.parse(
    request.headers.get("Cookie")
  );

  const cartContentParseResult = v.safeParse(
    ShoppingCartCookieSchema,
    shoppingCartCookie
  );

  if (!cartContentParseResult.success) {
    console.warn(
      "Cart content couldn't be parsed",
      cartContentParseResult.issues
    );
  }

  return cartContentParseResult.success ? cartContentParseResult.output : null;
}

export async function addToShoppingCart(
  request: Request,
  productUrlName: string,
  shopUrlName: string,
  operation: "add" | "remove"
): Promise<string> {
  const existingCart = await parseShoppingCartCookie(request);
  const shop = await getShopByUrlNameOrThrow(shopUrlName);
  const product = await getProductByUrlNameOrThrow(shop.id, productUrlName);
  const productId = product.id;

  if (!existingCart) {
    if (operation === "add") {
      const cart: v.InferOutput<typeof ShoppingCartCookieSchema> = {
        [shop.id]: [{ productId, qty: 1 }],
      };

      return shoppingCart.serialize(cart);
    } else {
      return shoppingCart.serialize(null);
    }
  }

  if (existingCart[shop.id]) {
    const products = existingCart[shop.id];

    const thisProductIndex = products.findIndex(
      (p) => p.productId === productId
    );

    if (thisProductIndex < 0) {
      if (operation === "add") {
        products.push({ productId, qty: 1 });
      }
    } else {
      if (operation === "add") {
        products[thisProductIndex].qty++;
      } else {
        products[thisProductIndex].qty--;
        if (products[thisProductIndex].qty <= 0) {
          products.splice(thisProductIndex, 1);
        }
      }
    }
  } else {
    if (operation === "add") {
      existingCart[shop.id] = [{ productId, qty: 1 }];
    }
  }

  return shoppingCart.serialize(existingCart);
}
