import { describe, expect, it } from "vitest";
import { operationFilters, operationToQueueProduct } from "./operationQueue";
import { workspaceSnapshot } from "../../test/workspaceFixtures";
import type { OperationHistoryResult } from "../../domain/products";

describe("operationToQueueProduct", () => {
  it("exposes server-authoritative reconciliation only for uncertain operations", () => {
    const operation = {
      combination_results: [],
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

  it("shows exact failed combinations and includes partial records in the error filter", () => {
    const partial: OperationHistoryResult = {
      combination_results: [{
        client_id: "combo-1", error: { code: "ypw_write_failed", message: "Controlled failure" },
        fingerprint: "custom:color=o:Black", state: "failed", variation_id: 0,
      }],
      errors: [], operation_id: "11111111-1111-4111-8111-111111111111", product: null,
      replayed: false, retry: { can_reconcile: false, can_retry: true, safe_to_resubmit: false },
      state: "partial", warnings: ["One variation was not saved."],
    };

    const product = operationToQueueProduct(partial, workspaceSnapshot.bootstrap);
    expect(operationFilters("error")).toEqual({ state: "error" });
    expect(product.status).toBe("error");
    expect(product.errorMessage).toBe("One variation was not saved.");
    expect(product.variationFailures).toEqual(["custom:color=o:Black: Controlled failure"]);
  });
});
