import { InferOutput } from "valibot";
import { shoppingCart, ShoppingCartCookieSchema } from "./cookies.server";
import {
  getProducts,
  getShopByHostName,
  parseShoppingCartCookie,
} from "./queries.server";
import { getCurrencyAmtFormatted } from "./misc";
import * as v from "valibot";
import {
  BuyerSchema,
  CurrencySchema,
  orders as ordersDbSchema,
  products as productsDbSchema,
  OrderStatusesEnum,
  ProductsSchema,
  StatusHistorySchema,
} from "db/schema";
import { db } from "db";
import { inArray, sql } from "drizzle-orm";

interface OrderPriceSummary {
  subtotal: number;
  subtotalDisplay: string;

  taxAmount: number;
  taxAmountDisplay: string;

  deliveryAmount: number;
  deliveryAmountDisplay: string;

  grandtotal: number;
  grandtotalDisplay: string;
}

export async function getOrderPriceSummary(
  cartContent: InferOutput<typeof ShoppingCartCookieSchema> | null,
  shopOrHostName: Awaited<ReturnType<typeof getShopByHostName>> | string,
  locale: string,
  givenProducts?: Awaited<ReturnType<typeof getProducts>>
): Promise<OrderPriceSummary> {
  const shop =
    typeof shopOrHostName === "string"
      ? await getShopByHostName(shopOrHostName)
      : shopOrHostName;

  const cart = cartContent?.[shop.id] ?? [];
  const products =
    givenProducts ??
    (await getProducts(
      cart.map((item) => item.productId),
      shop.id
    ));

  const { multiplier, symbol } = shop.base_currency_info;

  let subtotal = 0;
  let taxAmount = 0;
  products.forEach((p) => {
    const qty = cart.find((pc) => pc.productId === p.id)?.qty ?? 0;
    const taxRate = parseFloat(p.tax_rate?.rate ?? "0.00");
    const priceBeforeTax = p.price * qty;
    subtotal += priceBeforeTax;
    taxAmount += priceBeforeTax * taxRate;
  });

  const deliveryAmount = 0;
  const grandtotal = subtotal + taxAmount + deliveryAmount;

  return {
    subtotal: Math.round(subtotal),
    subtotalDisplay: getCurrencyAmtFormatted(
      subtotal,
      multiplier,
      symbol,
      locale
    ),

    taxAmount: Math.round(taxAmount),
    taxAmountDisplay: getCurrencyAmtFormatted(
      taxAmount,
      multiplier,
      symbol,
      locale
    ),

    deliveryAmount: Math.round(deliveryAmount),
    deliveryAmountDisplay: getCurrencyAmtFormatted(
      deliveryAmount,
      multiplier,
      symbol,
      locale
    ),

    grandtotal: Math.round(grandtotal),
    grandtotalDisplay: getCurrencyAmtFormatted(
      grandtotal,
      multiplier,
      symbol,
      locale
    ),
  };
}

export const PlaceOrderFormDataSchema = v.object({
  full_name: v.string(),
  email: v.optional(v.string()),
  phone: v.pipe(v.string(), v.digits()),
  address: v.string(),
  pin: v.pipe(v.string(), v.digits(), v.length(6)),
  district: v.optional(v.string()),
  state: v.string(),
  country: v.string(),
  payment_method: v.literal("COD"),
});

export async function placeOrder(
  hostName: string,
  formData: v.InferOutput<typeof PlaceOrderFormDataSchema>,
  shoppingCartContent: Awaited<ReturnType<typeof parseShoppingCartCookie>>,
  locale: string
): Promise<{ orderId: string; cookie: string }> {
  const shop = await getShopByHostName(hostName);

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length < 1 || !shoppingCartContent) {
    throw new Error("Shopping cart is empty");
  }

  const productIds = productsInCart.map((p) => p.productId);
  const products = await getProducts(productIds, shop.id);

  if (productsInCart.length !== products.length) {
    throw new Error("Some products not found!");
  }

  // Process the order
  // 1. Creating an order in the database

  // Ensure products are in stock
  const allInStock = products.every((p) => p.qty > 0);
  if (!allInStock) {
    throw new Error("Some products are out of stock");
  }

  const productsColumnInput: v.InferInput<typeof ProductsSchema> = products.map(
    (p) => {
      const taxRate = parseFloat(p.tax_rate?.rate ?? "0.00");
      const qty = productsInCart.find((pc) => pc.productId === p.id)?.qty ?? 0;

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        qty,
        tax: {
          amount: p.price * qty * taxRate,
          rate: taxRate,
          name: p.tax_rate?.name,
        },
      };
    }
  );
  const productsColumn = v.parse(ProductsSchema, productsColumnInput);

  const currencyColumnInput: v.InferInput<typeof CurrencySchema> = {
    symbol: shop.base_currency,
    multiplier: shop.base_currency_info.multiplier,
    full_name: shop.base_currency_info.full_name ?? undefined,
  };
  const currencyColumn = v.parse(CurrencySchema, currencyColumnInput);

  const buyerColumnInput: v.InferInput<typeof BuyerSchema> = {
    name: formData.full_name,
    address: {
      delivery: {
        address: formData.address,
        country: formData.country,
        district: formData.district,
        state: formData.state,
        pin: formData.pin,
      },
    },
    contact: {
      email: formData.email,
      phone: {
        num: formData.phone,
        isd: 91,
      },
    },
  };
  const buyerColumn = v.parse(BuyerSchema, buyerColumnInput);

  const statusHistoryColumn: v.InferInput<typeof StatusHistorySchema> = [
    {
      date: new Date().toISOString(),
      status: OrderStatusesEnum.placed,
      remarks: "Order received by seller",
    },
  ];

  const prices = await getOrderPriceSummary(
    shoppingCartContent,
    shop,
    locale,
    products
  );

  // Create order
  const [order] = await db
    .insert(ordersDbSchema)
    .values({
      buyer: buyerColumn,
      currency: currencyColumn,
      products: productsColumn,
      status_history: statusHistoryColumn,
      shop_id: shop.id,
      status: OrderStatusesEnum.placed,
      delivery_fee: prices.deliveryAmount,
      discounts: 0,
      subtotal: prices.subtotal,
      taxes: prices.taxAmount,
      grandtotal: prices.grandtotal,
      payment_method: formData.payment_method,
    })
    .returning({ id: ordersDbSchema.id });

  if (!order) {
    throw new Error("Order couldn't be fetched");
  }

  // TODO: 2. Handling payment (if not COD)

  // 3. Updating inventory
  await db
    .update(productsDbSchema)
    .set({ qty: sql`qty-1` })
    .where(inArray(productsDbSchema.id, productIds));

  // TODO: 4. Sending confirmation emails

  // Clear shopping cart
  delete shoppingCartContent[shop.id];
  const cookie = await shoppingCart.serialize(shoppingCartContent);

  return { cookie, orderId: order.id };
}
