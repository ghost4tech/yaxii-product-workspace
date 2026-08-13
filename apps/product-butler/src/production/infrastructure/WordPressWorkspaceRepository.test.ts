import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateProductRequest } from "../domain/products";
import type { WorkspaceHostConfig } from "../domain/workspace";
import { WordPressWorkspaceRepository } from "./WordPressWorkspaceRepository";

const host: WorkspaceHostConfig = {
  direction: "ltr",
  environment: "wordpress",
  frontendAvailable: true,
  isWooCommerceAvailable: true,
  locale: "en-US",
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
          retry: { can_reconcile: true, safe_to_resubmit: true }, state: "processing", warnings: [],
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

  it("preserves structured operation failures returned with an error status", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({
      data: {
        errors: [{ code: "ypw_duplicate_sku", fields: { sku: ["Used"] }, message: "Invalid" }],
        operation_id: "11111111-1111-4111-8111-111111111111",
        product: null,
        replayed: false,
        retry: { can_reconcile: true, safe_to_resubmit: false },
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
});
