import { describe, expect, it } from "vitest";
import { createFormatters, normalizeLocale } from "./formatters";
import { createTranslator } from "./messages";

describe("locale foundation", () => {
  it("normalizes WordPress locales and falls back safely", () => {
    expect(normalizeLocale("fr_FR")).toBe("fr-FR");
    expect(normalizeLocale("not a locale")).toBe("en-US");
  });

  it("formats values with the supplied locale", () => {
    const french = createFormatters("fr_FR");
    const arabic = createFormatters("ar");

    expect(french.number(1234.5)).not.toBe("1,234.5");
    expect(arabic.number(1234)).toBe(new Intl.NumberFormat("ar").format(1234));
    expect(french.date(new Date("2026-08-12T00:00:00.000Z"))).toContain("2026");
  });

  it("provides a central message boundary with representative fallback content", () => {
    expect(createTranslator("ar")("localeSample")).toBe("معاينة اللغة");
    expect(createTranslator("fr_FR")("localeSample")).toBe("Aperçu de la langue");
    expect(createTranslator("de_DE")("entry")).toBe("Entry");
  });
});
