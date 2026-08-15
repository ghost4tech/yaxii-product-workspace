import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { WorkspaceClient } from "../../application/WorkspaceClient";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { OperationResult } from "../../domain/products";
import type { WorkspaceBootstrap } from "../../domain/workspace";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { SecureRandomUnavailableError } from "../../core/security/secureUuid";
import { IdempotencyKeyManager } from "./idempotency";
import { mapServerFields, operationErrorFields } from "./productErrors";
import { mapProductRequest, mapVariableProductRequest, ProductMappingError, type ProductFieldErrors, type ProductSubmission } from "./productMapping";
import { __ } from "../../core/i18n/wordpress";

export interface ProductSubmitOutcome {
  fields: ProductFieldErrors;
  result?: OperationResult;
  state: "succeeded" | "partial" | "failed" | "uncertain";
}

export function useProductCreate(client: WorkspaceClient, bootstrap: WorkspaceBootstrap) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlight = useRef(false);
  const keys = useRef(new IdempotencyKeyManager());
  const queryClient = useQueryClient();
  const copy = productOperationCopy(bootstrap.locale);
  const refreshOperations = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["operations"] }),
    [queryClient],
  );

  const submit = useCallback(async (input: ProductSubmission): Promise<ProductSubmitOutcome> => {
    if (inFlight.current) return { fields: {}, state: "uncertain" };

    let request;
    try {
      request = input.isVariable ? mapVariableProductRequest(input, copy) : mapProductRequest(input, copy);
    } catch (error) {
      const fields = error instanceof ProductMappingError ? error.fields : { root: copy.reviewFields };
      return { fields, state: "failed" };
    }

    let key: string;
    try {
      key = keys.current.forRequest(request);
    } catch (error) {
      if (!(error instanceof SecureRandomUnavailableError)) throw error;
      toast({ title: copy.productNotSaved, description: copy.secureRandomUnavailable, variant: "destructive" });
      return { fields: { root: copy.secureRandomUnavailable }, state: "failed" };
    }
    inFlight.current = true;
    setIsSubmitting(true);
    try {
      let result = input.isVariable
        ? await client.createVariableProduct(request as ReturnType<typeof mapVariableProductRequest>, key)
        : await client.createProduct(request as ReturnType<typeof mapProductRequest>, key);
      if ((result.state === "processing" || result.state === "uncertain") && result.retry.can_reconcile) {
        result = await client.getOperation(result.operation_id).catch(() => result);
      }
      await refreshOperations();

      if (result.state === "succeeded" && result.product) {
        keys.current.clear(key);
        toast({ title: copy.productSaved, description: `${result.product.name} · #${result.product.id}` });
        return { fields: {}, result, state: "succeeded" };
      }

      if (result.state === "partial" && result.product) {
        keys.current.lock(key);
        toast({ title: __("Product needs recovery", "yaxii-product-workspace"), description: result.warnings[0] ?? __("Some variations were not saved.", "yaxii-product-workspace"), variant: "destructive" });
        return { fields: { root: result.warnings[0] ?? __("Retry the partial operation from the queue.", "yaxii-product-workspace") }, result, state: "partial" };
      }

      const fields = operationErrorFields(result.errors);
      if (result.state === "failed") {
        toast({ title: copy.productNotSaved, description: result.errors[0]?.message ?? copy.reviewFields, variant: "destructive" });
        return { fields, result, state: "failed" };
      }

      toast({ title: copy.saveOutcomePending, description: copy.saveOutcomePendingHelp });
      return { fields, result, state: "uncertain" };
    } catch (error) {
      const apiError = error instanceof WorkspaceApiError ? error : null;
      const uncertain = apiError?.outcomeUncertain === true;
      await refreshOperations();
      toast({
        title: uncertain ? copy.saveOutcomeUnknown : copy.productNotSaved,
        description: apiError?.message ?? copy.serverRequestFailed,
        variant: "destructive",
      });
      return { fields: apiError ? mapServerFields(apiError.fields) : {}, state: uncertain ? "uncertain" : "failed" };
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }, [client, copy, refreshOperations]);

  return { isSubmitting, submit };
}
