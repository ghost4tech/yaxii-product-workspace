import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateProductRequest, VariableProductRequest } from "../domain/products";
import type { WorkspaceHostConfig } from "../domain/workspace";
import { canonicalProduct, simpleProductFields } from "../test/workspaceFixtures";
import { WordPressWorkspaceRepository } from "./WordPressWorkspaceRepository";

const host: WorkspaceHostConfig = {
  direction: "ltr",
  environment: "wordpress",
  frontendAvailable: true,
  isWooCommerceAvailable: true,
  locale: "en-US",
  mediaRestUrl: "https://store.test/wp-json/wp/v2/media",
  nonce: "rest-nonce",
  pluginVersion: "0.2.0",
  restUrl: "https://store.test/wp-json/yaxii-product-workspace/v1/",
};

const request = { name: "Product" } as CreateProductRequest;

afterEach(() => vi.unstubAllGlobals());

describe("WordPressWorkspaceRepository", () => {
  it("uses the same-origin Yaxii route, REST nonce, and idempotency header", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
        data: {
          errors: [], operation_id: "11111111-1111-4111-8111-111111111111", product: null, replayed: false,
          retry: { can_reconcile: true, can_retry: false, safe_to_resubmit: false }, state: "processing", warnings: [],
        },
      }), { status: 202, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await new WordPressWorkspaceRepository(host).createProduct(request, "request-key");
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(url).toBe("https://store.test/wp-json/yaxii-product-workspace/v1/products");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBe("request-key");
    expect(headers.get("X-WP-Nonce")).toBe("rest-nonce");
  });

  it("submits all concrete variations in one variable-product request", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
      data: {
        combination_results: [], errors: [], operation_id: "11111111-1111-4111-8111-111111111111",
        product: null, replayed: false,
        retry: { can_reconcile: true, can_retry: false, safe_to_resubmit: false },
        state: "processing", warnings: [],
      },
      }), { status: 202, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const variable: VariableProductRequest = {
      attributes: [{ key: "custom:color", name: "Color", options: ["Black", "White"], position: 0, source: "custom", variation: true, visible: true }],
      combinations: ["Black", "White"].map((option, index) => ({
        clientId: `11111111-1111-4111-8111-11111111111${index}`, enabled: true, imageId: 0,
        manageStock: true, regularPrice: `${19 + index}.00`, salePrice: null,
        selections: [{ attributeKey: "custom:color", option }], sku: `COLOR-${index}`,
        stockQuantity: index + 1, stockStatus: "instock", variationId: 0,
      })),
      product: simpleProductFields,
    };

    await new WordPressWorkspaceRepository(host).createVariableProduct(variable, "variable-key");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://store.test/wp-json/yaxii-product-workspace/v1/variable-products");
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("variable-key");
    const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as Record<string, unknown>;
    expect(body).toMatchObject({
      attributes: [{ key: "custom:color", options: ["Black", "White"], source: "custom" }],
      combinations: [
        { client_id: variable.combinations[0]?.clientId, selections: [{ attribute_key: "custom:color", option: "Black" }] },
        { client_id: variable.combinations[1]?.clientId, selections: [{ attribute_key: "custom:color", option: "White" }] },
      ],
    });
  });

  it("hydrates global attributes and concrete variation values from WooCommerce", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      data: {
        ...simpleProductFields, attributes: [{
          attribute_id: 7, key: "global:7", name: "Color", option_ids: [101], position: 0,
          source: "global", taxonomy: "pa_color", variation: true, visible: true,
        }],
        combinations: [{
          client_id: "11111111-1111-4111-8111-111111111111", enabled: true, image_id: 42,
          manage_stock: true, regular_price: "29.00", sale_price: "25.00",
          selections: [{ attribute_key: "global:7", term_id: 101 }], sku: "BLACK-1",
          stock_quantity: 4, stock_status: "instock", variation_id: 900,
        }],
        created_at: "2026-08-13T12:00:00+00:00", id: 800, images: [],
        modified_at: "2026-08-13T12:00:00+00:00", projected_count: 1,
        type: "variable", version: "1".repeat(64),
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const product = await new WordPressWorkspaceRepository(host).getProduct(800);

    expect(product.type).toBe("variable");
    if (product.type !== "variable") throw new Error("Expected a variable product.");
    expect(product.attributes[0]).toMatchObject({ attributeId: 7, optionIds: [101], taxonomy: "pa_color" });
    expect(product.combinations[0]).toMatchObject({
      imageId: 42, regularPrice: "29.00", selections: [{ attributeKey: "global:7", termId: 101 }],
      sku: "BLACK-1", stockQuantity: 4, variationId: 900,
    });
  });

  it("preserves structured operation failures returned with an error status", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      data: {
        errors: [{ code: "ypw_duplicate_sku", fields: { sku: ["Used"] }, message: "Invalid" }],
        operation_id: "11111111-1111-4111-8111-111111111111",
        product: null,
        replayed: false,
        retry: { can_reconcile: false, can_retry: false, safe_to_resubmit: false },
        state: "failed",
        warnings: [],
      },
    }), { status: 422, headers: { "Content-Type": "application/json" } })));

    const result = await new WordPressWorkspaceRepository(host).createProduct(request, "request-key");
    expect(result.state).toBe("failed");
    expect(result.errors[0]?.fields.sku).toEqual(["Used"]);
  });

  it("marks a lost POST response as uncertain", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));
    const promise = new WordPressWorkspaceRepository(host).createProduct(request, "request-key");
    await expect(promise).rejects.toMatchObject({
      code: "ypw_network_error",
      outcomeUncertain: true,
    });
  });

  it("normalizes WordPress empty error fields without rejecting the operation queue", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      data: {
        counts: { all: 1, draft: 0, error: 1, pending: 0, synced: 0 },
        has_more: false,
        items: [{
          errors: [{ code: "ypw_product_write_failed", fields: [], message: "Write failed" }],
          operation_id: "11111111-1111-4111-8111-111111111111",
          product: null,
          replayed: false,
          retry: { can_reconcile: false, can_retry: true, safe_to_resubmit: false },
          state: "failed",
          warnings: [],
        }],
        page: 1,
        per_page: 25,
        total: 1,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const page = await new WordPressWorkspaceRepository(host).listOperations({ perPage: 25 });
    expect(page.items[0]?.errors[0]?.fields).toEqual({});
  });

  it("accepts the durable Phase 2 product summary in operation history", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      data: {
        counts: { all: 1, draft: 0, error: 0, pending: 0, synced: 1 },
        has_more: false,
        items: [{
          created_at: "2026-08-13 13:03:32",
          errors: [],
          input: null,
          operation_id: "a655dc97-a337-41c2-8d63-14c9b43aa51a",
          product: {
            catalog_visibility: "visible",
            category_ids: [16],
            created_at: "2026-08-13T13:03:32+00:00",
            id: 314,
            image_ids: [],
            manage_stock: true,
            name: "Product 1",
            regular_price: "200",
            sale_price: "180",
            sku: "SG2233",
            status: "publish",
            stock_quantity: 22,
            stock_status: "instock",
          },
          replayed: false,
          retry: { can_reconcile: false, can_retry: false, safe_to_resubmit: false },
          state: "succeeded",
          updated_at: "2026-08-13 13:03:33",
          warnings: [],
        }],
        page: 1,
        per_page: 25,
        total: 1,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const page = await new WordPressWorkspaceRepository(host).listOperations({ perPage: 25 });
    expect(page.items[0]?.product).toMatchObject({ id: 314, name: "Product 1", status: "publish" });
  });

  it("passes cancellation through bounded product search", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
        data: { has_more: false, items: [], page: 1, per_page: 20, total: 0 },
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await new WordPressWorkspaceRepository(host).searchProducts({
      page: 1, perPage: 20, search: "canvas", signal: controller.signal,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://store.test/wp-json/yaxii-product-workspace/v1/products?page=1&per_page=20&search=canvas");
    expect(init?.signal).toBe(controller.signal);
  });

  it("requests bounded category roots, children, selected ids, and search context", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
      data: { has_more: false, items: [], page: 1, per_page: 25 },
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const repository = new WordPressWorkspaceRepository(host);

    await repository.listCategories({ parent: 0, perPage: 25 });
    await repository.listCategories({ include: [41, 72], perPage: 20 });
    await repository.listCategories({ search: "hoodies", signal: new AbortController().signal });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://store.test/wp-json/yaxii-product-workspace/v1/categories?page=1&per_page=25&search=&parent=0",
    );
    const selectedUrl = fetchMock.mock.calls[1]?.[0];
    if (typeof selectedUrl !== "string") throw new Error("Expected a string category URL.");
    expect(selectedUrl).toContain("include%5B%5D=41");
    expect(selectedUrl).toContain("include%5B%5D=72");
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://store.test/wp-json/yaxii-product-workspace/v1/categories?page=1&per_page=25&search=hoodies",
    );
  });

  it("sends the version contract for update and trash", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      const [, init] = args;
      return Promise.resolve(new Response(JSON.stringify({
        data: init?.method === "DELETE" ? { id: 321, status: "trash" } : canonicalProduct,
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const repository = new WordPressWorkspaceRepository(host);

    await repository.updateProduct(321, canonicalProduct.version, simpleProductFields);
    await repository.trashProduct(321, canonicalProduct.version);

    const [updateUrl, updateInit] = fetchMock.mock.calls[0] ?? [];
    expect(updateUrl).toBe("https://store.test/wp-json/yaxii-product-workspace/v1/products/321");
    expect(updateInit?.method).toBe("PUT");
    const updateBody = typeof updateInit?.body === "string" ? updateInit.body : "";
    expect(JSON.parse(updateBody)).toEqual({
      expected_version: canonicalProduct.version,
      product: simpleProductFields,
    });
    const [trashUrl, trashInit] = fetchMock.mock.calls[1] ?? [];
    expect(trashUrl).toContain(`expected_version=${canonicalProduct.version}`);
    expect(trashInit?.method).toBe("DELETE");
  });

  it("uses a read-only duplicate-prefill route", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
      data: simpleProductFields,
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await new WordPressWorkspaceRepository(host).duplicateProduct(321);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://store.test/wp-json/yaxii-product-workspace/v1/products/321/duplicate");
    expect(init?.method).toBeUndefined();
  });
});
