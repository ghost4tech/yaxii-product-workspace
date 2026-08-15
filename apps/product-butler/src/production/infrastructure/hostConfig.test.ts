import { describe, expect, it } from "vitest";
import { parseHostConfig } from "./hostConfig";

describe("parseHostConfig", () => {
  it("accepts the complete WordPress bootstrap contract", () => {
    expect(
      parseHostConfig({
        direction: "rtl",
        environment: "wordpress",
        frontendAvailable: true,
        isWooCommerceAvailable: true,
        locale: "ar",
        mediaRestUrl: "https://example.test/wp-json/wp/v2/media",
        nonce: "nonce",
        pluginVersion: "0.1.0",
        restUrl: "https://example.test/wp-json/yaxii-product-workspace/v1/",
      }),
    ).toEqual({
      direction: "rtl",
      environment: "wordpress",
      frontendAvailable: true,
      isWooCommerceAvailable: true,
      locale: "ar",
      mediaRestUrl: "https://example.test/wp-json/wp/v2/media",
      nonce: "nonce",
      pluginVersion: "0.1.0",
      restUrl: "https://example.test/wp-json/yaxii-product-workspace/v1/",
    });
  });

  it("rejects incomplete host data", () => {
    expect(
      parseHostConfig({
        direction: "ltr",
        environment: "wordpress",
        frontendAvailable: true,
        isWooCommerceAvailable: true,
        locale: "en-US",
      }),
    ).toBeNull();
  });
});
