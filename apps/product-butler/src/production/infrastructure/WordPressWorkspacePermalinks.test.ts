import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceHostConfig } from "../domain/workspace";
import { WordPressWorkspaceRepository } from "./WordPressWorkspaceRepository";

const plainHost: WorkspaceHostConfig = {
  direction: "ltr",
  environment: "wordpress",
  frontendAvailable: true,
  isWooCommerceAvailable: true,
  locale: "en-US",
  mediaRestUrl: "https://example.test/index.php?rest_route=/wp/v2/media",
  nonce: "rest-nonce",
  pluginVersion: "1.1.0",
  restUrl: "https://example.test/index.php?rest_route=/yaxii-product-workspace/v1/",
};

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function requestedUrl(fetchMock: ReturnType<typeof vi.fn>, index: number): URL {
  const value: unknown = fetchMock.mock.calls[index]?.[0];
  if (typeof value !== "string") throw new Error("Expected fetch to receive a string URL.");
  return new URL(value);
}

afterEach(() => vi.unstubAllGlobals());

describe("WordPressWorkspaceRepository Plain permalink URLs", () => {
  it("keeps Queue and product-search parameters outside rest_route", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ has_more: false, items: [], page: 2, per_page: 20, total: 0 }))
      .mockResolvedValueOnce(jsonResponse({
        counts: { all: 0, draft: 0, error: 0, pending: 0, synced: 0 },
        has_more: false, items: [], page: 2, per_page: 10, total: 0,
      }));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new WordPressWorkspaceRepository(plainHost);

    await repository.searchProducts({ page: 2, perPage: 20, search: "linen shirt & cap" });
    await repository.listOperations({ page: 2, perPage: 10, status: "failed" });

    const products = requestedUrl(fetchMock, 0);
    expect(products.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/products");
    expect(products.searchParams.get("search")).toBe("linen shirt & cap");
    expect(products.searchParams.get("page")).toBe("2");

    const operations = requestedUrl(fetchMock, 1);
    expect(operations.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/operations");
    expect(operations.searchParams.get("status")).toBe("failed");
    expect(operations.searchParams.get("page")).toBe("2");
  });

  it("preserves category, tag, shipping-class, and attribute-term queries", async () => {
    const termPage = { has_more: false, items: [], page: 1, per_page: 20 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(termPage))
      .mockResolvedValueOnce(jsonResponse(termPage))
      .mockResolvedValueOnce(jsonResponse(termPage))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new WordPressWorkspaceRepository(plainHost);

    await repository.listCategories({ include: [41, 72], perPage: 20, search: "été & été" });
    await repository.searchTags("summer shirts & caps");
    await repository.searchShippingClasses("next day");
    await repository.listAttributeTerms(7);

    const categories = requestedUrl(fetchMock, 0);
    expect(categories.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/categories");
    expect(categories.searchParams.get("search")).toBe("été & été");
    expect(categories.searchParams.getAll("include[]")).toEqual(["41", "72"]);

    const tags = requestedUrl(fetchMock, 1);
    expect(tags.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/tags");
    expect(tags.searchParams.get("search")).toBe("summer shirts & caps");

    const shipping = requestedUrl(fetchMock, 2);
    expect(shipping.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/shipping-classes");
    expect(shipping.searchParams.get("search")).toBe("next day");

    const terms = requestedUrl(fetchMock, 3);
    expect(terms.searchParams.get("rest_route")).toBe("/yaxii-product-workspace/v1/attributes/7/terms");
    expect(terms.searchParams.get("limit")).toBe("100");
  });

  it("joins WordPress media item paths without corrupting its Plain rest_route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      alt_text: "Product", id: 82, source_url: "https://example.test/uploads/product.jpg",
    }), { headers: { "Content-Type": "application/json" }, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new WordPressWorkspaceRepository(plainHost).getMedia(82);

    const media = requestedUrl(fetchMock, 0);
    expect(media.searchParams.get("rest_route")).toBe("/wp/v2/media/82");
  });
});
