import { describe, expect, it } from "vitest";
import { operationToQueueProduct } from "./operationQueue";
import { workspaceSnapshot } from "../../test/workspaceFixtures";
import type { OperationHistoryResult } from "../../domain/products";

describe("operationToQueueProduct", () => {
  it("exposes server-authoritative reconciliation only for uncertain operations", () => {
    const operation = {
      errors: [],
      operation_id: "11111111-1111-4111-8111-111111111111",
      product: null,
      replayed: false,
      retry: { can_reconcile: true, can_retry: false, safe_to_resubmit: false },
      state: "uncertain",
      warnings: [],
    } satisfies OperationHistoryResult;

    const product = operationToQueueProduct(operation, workspaceSnapshot.bootstrap);
    expect(product.status).toBe("pending");
    expect(product.canReconcile).toBe(true);
    expect(product.canRetry).toBe(false);
  });
});
