export function getCurrencyAmtFormatted(
  amount: number,
  multiplier: number,
  currency: string
): string {
  const amt = amount / multiplier;
  return amt.toLocaleString("en-IN", {
    style: "currency",
    currency,
  });
}
