export type SupportedLanguage = "ar" | "en" | "fr";

export function toLanguageTag(locale: string): string {
  const candidate = locale.trim().replaceAll("_", "-");

  try {
    return Intl.getCanonicalLocales(candidate)[0] ?? "en-US";
  } catch (error) {
    if (error instanceof RangeError) {
      return "en-US";
    }
    throw error;
  }
}

export function supportedLanguage(locale: string): SupportedLanguage {
  const language = toLanguageTag(locale).split("-")[0];
  return language === "ar" || language === "fr" ? language : "en";
}
