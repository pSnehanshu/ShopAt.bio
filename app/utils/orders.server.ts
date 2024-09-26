import { InferOutput } from "valibot";
import { ShoppingCartCookieSchema } from "./cookies.server";
import { getProducts, getShopByUrlNameOrThrow } from "./queries.server";
import { getCurrencyAmtFormatted } from "./misc";

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
  shopOrUrlName: Awaited<ReturnType<typeof getShopByUrlNameOrThrow>> | string,
  locale: string,
  givenProducts?: Awaited<ReturnType<typeof getProducts>>
): Promise<OrderPriceSummary> {
  const shop =
    typeof shopOrUrlName === "string"
      ? await getShopByUrlNameOrThrow(shopOrUrlName)
      : shopOrUrlName;

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
    subtotal,
    subtotalDisplay: getCurrencyAmtFormatted(
      subtotal,
      multiplier,
      symbol,
      locale
    ),

    taxAmount,
    taxAmountDisplay: getCurrencyAmtFormatted(
      taxAmount,
      multiplier,
      symbol,
      locale
    ),

    deliveryAmount,
    deliveryAmountDisplay: getCurrencyAmtFormatted(
      deliveryAmount,
      multiplier,
      symbol,
      locale
    ),

    grandtotal,
    grandtotalDisplay: getCurrencyAmtFormatted(
      grandtotal,
      multiplier,
      symbol,
      locale
    ),
  };
}
