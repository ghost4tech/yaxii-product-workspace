import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceHostConfig } from "../domain/workspace";
import { WordPressWorkspaceRepository } from "./WordPressWorkspaceRepository";

const host: WorkspaceHostConfig = {
  direction: "ltr", environment: "wordpress", frontendAvailable: true,
  isWooCommerceAvailable: true, locale: "en-US",
  mediaRestUrl: "https://store.test/wp-json/wp/v2/media", nonce: "rest-nonce",
  pluginVersion: "0.2.0", restUrl: "https://store.test/wp-json/yaxii-product-workspace/v1/",
};

afterEach(() => vi.unstubAllGlobals());

describe("WordPress media repository", () => {
  it("uploads to core media with credentials and parses a durable attachment", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
        alt_text: "Canvas", id: 81, source_url: "https://store.test/uploads/canvas.jpg",
      }), { status: 201, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const media = await new WordPressWorkspaceRepository(host).uploadMedia(
      new File(["image"], "canvas.jpg", { type: "image/jpeg" }),
    );

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(host.mediaRestUrl);
    expect(init?.credentials).toBe("same-origin");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("X-WP-Nonce")).toBe("rest-nonce");
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
    expect(media).toEqual({ alt: "Canvas", id: 81, url: "https://store.test/uploads/canvas.jpg" });
  });

  it("loads an existing attachment by id for edit-state previews", async () => {
    const fetchMock = vi.fn((...args: [RequestInfo | URL, RequestInit?]) => {
      void args;
      return Promise.resolve(new Response(JSON.stringify({
      alt_text: "Variation", id: 82, source_url: "https://store.test/uploads/variation.jpg",
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const media = await new WordPressWorkspaceRepository(host).getMedia(82);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${host.mediaRestUrl}/82`);
    expect(media.id).toBe(82);
  });
});
