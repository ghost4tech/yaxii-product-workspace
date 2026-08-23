import { describe, expect, it } from "vitest";
import { buildRestUrl } from "./restUrl";

describe("buildRestUrl", () => {
  it("adds route and query parameters to a pretty-permalink REST base", () => {
    const result = buildRestUrl(
      "https://example.test/wp-json/yaxii-product-workspace/v1/",
      "operations?status=failed&page=2",
    );

    expect(result).toBe(
      "https://example.test/wp-json/yaxii-product-workspace/v1/operations?status=failed&page=2",
    );
  });

  it("preserves rest_route when adding parameters to a Plain-permalink REST base", () => {
    const result = buildRestUrl(
      "https://example.test/?rest_route=/yaxii-product-workspace/v1/",
      "operations?status=failed&page=2",
    );
    const url = new URL(result);

    expect(url.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/operations");
    expect(url.searchParams.get("status")).toBe("failed");
    expect(url.searchParams.get("page")).toBe("2");
    expect(result).not.toContain("%252F");
  });

  it("encodes search values and preserves repeated and existing parameters", () => {
    const params = new URLSearchParams({ search: "t shirts & caps" });
    params.append("include[]", "41");
    params.append("include[]", "72");
    const result = buildRestUrl(
      "https://example.test/index.php?rest_route=%2Fyaxii-product-workspace%2Fv1%2F&locale=fr%20FR",
      `categories?${params}`,
    );
    const url = new URL(result);

    expect(url.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/categories");
    expect(url.searchParams.get("locale")).toBe("fr FR");
    expect(url.searchParams.get("search")).toBe("t shirts & caps");
    expect(url.searchParams.getAll("include[]")).toEqual(["41", "72"]);
    expect(result).not.toContain("%252F");
  });
});
