import { describe, expect, it } from "vitest";
import type { CreateProductRequest } from "../../domain/products";
import { IdempotencyKeyManager } from "./idempotency";

const request = { name: "Product" } as CreateProductRequest;

describe("IdempotencyKeyManager", () => {
  it("reuses a key for the same payload until success clears it", () => {
    const manager = new IdempotencyKeyManager();
    const first = manager.forRequest(request);
    expect(manager.forRequest({ ...request })).toBe(first);
    manager.clear(first);
    expect(manager.forRequest(request)).not.toBe(first);
  });

  it("uses a new key when the payload changes", () => {
    const manager = new IdempotencyKeyManager();
    expect(manager.forRequest(request)).not.toBe(manager.forRequest({ ...request, name: "Changed" }));
  });

  it("locks a partial create to its parent identity until reconciliation succeeds", () => {
    const manager = new IdempotencyKeyManager();
    const partialKey = manager.forRequest(request);
    manager.lock(partialKey);

    expect(manager.forRequest({ ...request, name: "Edited after partial" })).toBe(partialKey);
    manager.clear(partialKey);
    expect(manager.forRequest(request)).not.toBe(partialKey);
  });
});
