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
        pluginVersion: "0.1.0",
      }),
    ).toEqual({
      direction: "rtl",
      environment: "wordpress",
      frontendAvailable: true,
      isWooCommerceAvailable: true,
      locale: "ar",
      pluginVersion: "0.1.0",
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
