import { describe, expect, it } from "vitest";
import { createFormatters } from "./formatters";
import { supportedLanguage, toLanguageTag } from "./locale";
import { availabilityCopy } from "./messages";

describe("locale infrastructure", () => {
  it("normalizes WordPress locale identifiers", () => {
    expect(toLanguageTag("fr_FR")).toBe("fr-FR");
    expect(toLanguageTag("not a locale")).toBe("en-US");
    expect(supportedLanguage("ar_DZ")).toBe("ar");
  });

  it("provides representative English, French, and Arabic content", () => {
    expect(availabilityCopy("host-unavailable", "en_US").title).toBe("Workspace unavailable");
    expect(availabilityCopy("host-unavailable", "fr_FR").title).toBe("Espace de travail indisponible");
    expect(availabilityCopy("host-unavailable", "ar").title).toBe("مساحة العمل غير متاحة");
  });

  it("formats locale-aware numbers, dates, currency, and units", () => {
    const formatters = createFormatters("fr_FR");
    expect(formatters.number(1234.5)).toBe(new Intl.NumberFormat("fr-FR").format(1234.5));
    expect(formatters.date(new Date("2026-08-12T00:00:00Z"))).toBe(
      new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date("2026-08-12T00:00:00Z"),
      ),
    );
    expect(formatters.currency(12, "EUR")).toContain("12");
    expect(formatters.unit(2, "kilogram")).toContain("2");
  });
});
