import { db } from "db";
import invariant from "tiny-invariant";
import { shoppingCart, ShoppingCartCookieSchema } from "~/utils/cookies.server";
import * as v from "valibot";
import SQLite from "better-sqlite3";
import url from "url";
import path from "path";

const defaultProductPhotoUrl = "https://placehold.co/600x400";

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
      base_currency_info: {
        columns: {
          created_at: false,
        },
      },
      links: {
        columns: {
          created_at: false,
          updated_at: false,
          shop_id: false,
        },
      },
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
    with: {
      photos: true,
      tax_rate: {
        columns: { id: true, name: true, rate: true },
      },
    },
  });

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    ...product,
    photoUrl: getFileURL(product.photos.at(0)?.path) ?? defaultProductPhotoUrl,
  };
}

export async function getProductById(
  productId: string | null | undefined
): ReturnType<typeof getProductByUrlNameOrThrow> {
  invariant(productId, "expected productId");

  const product = await db.query.products.findFirst({
    where: (fields, { eq }) => eq(fields.id, productId),
    with: {
      photos: true,
      tax_rate: {
        columns: { id: true, name: true, rate: true },
      },
    },
  });

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    ...product,
    photoUrl: getFileURL(product.photos.at(0)?.path) ?? defaultProductPhotoUrl,
  };
}

export async function getHomepageProducts(
  shopId: string
): ReturnType<typeof getProducts> {
  const products = await db.query.products.findMany({
    where: (fields, { eq, and }) =>
      and(eq(fields.is_visible, true), eq(fields.shop_id, shopId)),
    with: {
      photos: {
        where: (fields, { eq }) => eq(fields.is_main, true),
        limit: 1,
        orderBy: (fields, { desc }) => desc(fields.created_at),
      },
      tax_rate: {
        columns: { id: true, name: true, rate: true },
      },
    },
    limit: 20,
  });

  return products.map((p) => ({
    ...p,
    photoUrl: getFileURL(p.photos.at(0)?.path) ?? defaultProductPhotoUrl,
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

  const products = existingCart[shop.id];
  if (products) {
    const thisProductIndex = products.findIndex(
      (p) => p.productId === productId
    );

    if (thisProductIndex < 0) {
      if (operation === "add") {
        products.push({ productId, qty: 1 });
      }
    } else {
      if (operation === "add") {
        products[thisProductIndex]!.qty++;
      } else {
        products[thisProductIndex]!.qty--;
        if (products[thisProductIndex]!.qty <= 0) {
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

export async function getProducts(productIds: string[], shopId: string) {
  const products = await db.query.products.findMany({
    where: (fields, { eq, inArray, and }) =>
      and(eq(fields.shop_id, shopId), inArray(fields.id, productIds)),
    with: {
      photos: {
        where: (fields, { eq }) => eq(fields.is_main, true),
        limit: 1,
        orderBy: (fields, { desc }) => desc(fields.created_at),
      },
      tax_rate: {
        columns: { id: true, name: true, rate: true },
      },
    },
  });

  return products.map((p) => ({
    ...p,
    photoUrl: getFileURL(p.photos.at(0)?.path) ?? defaultProductPhotoUrl,
  }));
}

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const dbpath = path.join(__dirname, "../../db/data.sqlite");
const sqlite = new SQLite(dbpath, { fileMustExist: true });

const PincodeSchema = v.object({
  StateName: v.string(),
  District: v.string(),
  OfficeName: v.string(),
  Country: v.string(),
});

export function getPincodeDetails(pincode: string) {
  const result = sqlite
    .prepare("SELECT * FROM pincodes WHERE Pincode = ?")
    .all(pincode);

  return v.parse(v.array(PincodeSchema), result);
}

export function getFileURL(path: string | null | undefined): string | null {
  if (!path) return null;

  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    "shopat-bio.appspot.com" +
    "/o/" +
    encodeURIComponent(path) +
    "?alt=media"
  );
}

export async function getOrderDetails(orderId: string) {
  const order = await db.query.orders.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, orderId);
    },
    with: {
      shop: {
        columns: {
          created_at: false,
        },
      },
    },
  });

  return order;
}
