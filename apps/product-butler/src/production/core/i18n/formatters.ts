export interface LocaleFormatters {
  currency: (value: number, currencyCode: string) => string;
  date: (value: Date) => string;
  number: (value: number) => string;
}

export function normalizeLocale(locale: string): string {
  const candidate = locale.replaceAll("_", "-");

  try {
    return Intl.getCanonicalLocales(candidate)[0] ?? "en-US";
  } catch {
    return "en-US";
  }
}

export function createFormatters(locale: string): LocaleFormatters {
  const normalized = normalizeLocale(locale);

  return {
    currency: (value, currencyCode) =>
      new Intl.NumberFormat(normalized, {
        currency: currencyCode,
        style: "currency",
      }).format(value),
    date: (value) =>
      new Intl.DateTimeFormat(normalized, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(value),
    number: (value) => new Intl.NumberFormat(normalized).format(value),
  };
}
