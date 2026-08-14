import { afterEach, expect, it, vi } from "vitest";
import type { WorkspaceHostConfig } from "../domain/workspace";
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

afterEach(() => vi.unstubAllGlobals());

it("loads and validates the bounded operation summary", async () => {
  const counts = { eligible: 3, needs_attention: 1, operations: 4, published: 2, succeeded: 2 };
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
    data: {
      buckets: Array.from({ length: 7 }, () => counts),
      current: counts,
      previous: counts,
      window: {
        bucket_hours: 24,
        ends_at: "2026-08-14T12:00:00+00:00",
        previous_starts_at: "2026-07-31T12:00:00+00:00",
        starts_at: "2026-08-07T12:00:00+00:00",
      },
    },
  }), { status: 200, headers: { "Content-Type": "application/json" } })));
  vi.stubGlobal("fetch", fetchMock);

  const summary = await new WordPressWorkspaceRepository(host).getOperationSummary();

  expect(summary.current).toEqual(counts);
  expect(summary.buckets).toHaveLength(7);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://store.test/wp-json/yaxii-product-workspace/v1/operations/summary",
    expect.objectContaining({ credentials: "same-origin" }),
  );
});
