import { describe, expect, it } from "vitest";
import { parseHostConfig } from "./hostConfig";

describe("parseHostConfig", () => {
  it("accepts the bounded WordPress bootstrap shape", () => {
    expect(
      parseHostConfig({
        direction: "rtl",
        environment: "wordpress",
        frontendAvailable: true,
        isWooCommerceAvailable: false,
        locale: "ar",
        pluginVersion: "0.1.0",
        screenId: "yaxii-product-workspace",
      }),
    ).toEqual({
      direction: "rtl",
      environment: "wordpress",
      frontendAvailable: true,
      isWooCommerceAvailable: false,
      locale: "ar",
      pluginVersion: "0.1.0",
      screenId: "yaxii-product-workspace",
    });
  });

  it("rejects malformed and credential-like prototype input", () => {
    expect(
      parseHostConfig({
        consumerKey: "browser-secret",
        direction: "ltr",
        environment: "wordpress",
      }),
    ).toBeNull();
  });
});
