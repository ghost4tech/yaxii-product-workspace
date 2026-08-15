import { toLanguageTag } from "./locale";

export function formattingLanguageTag(locale: string): string {
  const languageTag = toLanguageTag(locale);
  return languageTag.startsWith("ar")
    ? new Intl.Locale(languageTag, { numberingSystem: "latn" }).toString()
    : languageTag;
}

export interface LocaleFormatters {
  currency: (value: number, currency: string) => string;
  date: (value: Date) => string;
  number: (value: number) => string;
  unit: (value: number, unit: Intl.NumberFormatOptions["unit"]) => string;
}

export function createFormatters(locale: string): LocaleFormatters {
  const languageTag = formattingLanguageTag(locale);

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
