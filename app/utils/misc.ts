import acceptLanguage from "accept-language";

acceptLanguage.languages(["en-IN", "en-US"]);

export function getUserLocale(
  acceptLanguageHeader: string | null | undefined
): string {
  return acceptLanguage.get(acceptLanguageHeader) ?? "en-IN";
}

/** Format prices according to locale */
export function getCurrencyAmtFormatted(
  amount: number,
  multiplier: number,
  currency: string,
  locale: string
): string {
  const amt = amount / multiplier;
  return amt.toLocaleString(locale, { style: "currency", currency });
}
