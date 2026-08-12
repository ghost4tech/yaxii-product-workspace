import { toLanguageTag } from "./locale";

export interface LocaleFormatters {
  currency: (value: number, currency: string) => string;
  date: (value: Date) => string;
  number: (value: number) => string;
  unit: (value: number, unit: Intl.NumberFormatOptions["unit"]) => string;
}

export function createFormatters(locale: string): LocaleFormatters {
  const languageTag = toLanguageTag(locale);

  return {
    currency: (value, currency) =>
      new Intl.NumberFormat(languageTag, { style: "currency", currency }).format(value),
    date: (value) =>
      new Intl.DateTimeFormat(languageTag, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(value),
    number: (value) => new Intl.NumberFormat(languageTag).format(value),
    unit: (value, unit) =>
      new Intl.NumberFormat(languageTag, { style: "unit", unit }).format(value),
  };
}
