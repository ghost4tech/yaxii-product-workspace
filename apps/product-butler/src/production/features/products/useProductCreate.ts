import { useCallback, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useProductStore } from "@/stores/productStore";
import type { Product } from "@/types/product";
import type { WorkspaceClient } from "../../application/WorkspaceClient";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { OperationResult } from "../../domain/products";
import type { WorkspaceBootstrap } from "../../domain/workspace";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { SecureRandomUnavailableError } from "../../core/security/secureUuid";
import { IdempotencyKeyManager } from "./idempotency";
import { mapServerFields, operationErrorFields } from "./productErrors";
import {
  mapProductRequest,
  ProductMappingError,
  type ProductFieldErrors,
  type ProductSubmission,
} from "./productMapping";

export interface ProductSubmitOutcome {
  fields: ProductFieldErrors;
  state: "succeeded" | "failed" | "uncertain";
}

function queueProduct(
  result: OperationResult,
  input: ProductSubmission,
  bootstrap: WorkspaceBootstrap,
): Product {
  const product = result.product;
  const message = result.errors[0]?.message;
  return {
    categoryId: String(product?.category_ids[0] ?? input.values.categoryId),
    createdAt: new Date(product?.created_at ?? Date.now()),
    createdBy: bootstrap.user.displayName,
    currencySymbol: bootstrap.woocommerce.currencySymbol,
    errorMessage: message,
    id: result.operation_id,
    images: input.images,
    isVariable: false,
    longDescription: input.values.longDescription ?? "",
    name: product?.name ?? input.values.name,
    regularPrice: product?.regular_price ?? input.values.regularPrice ?? "",
    salePrice: product?.sale_price ?? input.values.salePrice ?? "",
    shortDescription: input.values.shortDescription ?? "",
    sku: product?.sku ?? input.values.sku ?? "",
    status:
      result.state === "succeeded"
        ? product?.status === "publish" ? "synced" : "draft"
        : result.state === "failed" ? "error" : "pending",
    stockQuantity: String(product?.stock_quantity ?? input.values.stockQuantity ?? ""),
    variations: [],
    wooCommerceId: product?.id,
  };
}

export function useProductCreate(client: WorkspaceClient, bootstrap: WorkspaceBootstrap) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlight = useRef(false);
  const keys = useRef(new IdempotencyKeyManager());
  const upsertProduct = useProductStore((state) => state.upsertProduct);
  const copy = productOperationCopy(bootstrap.locale);

  const submit = useCallback(async (input: ProductSubmission): Promise<ProductSubmitOutcome> => {
    if (inFlight.current) return { fields: {}, state: "uncertain" };

    let request;
    try {
      request = mapProductRequest(input, copy);
    } catch (error) {
      const fields = error instanceof ProductMappingError ? error.fields : { root: copy.reviewFields };
      return { fields, state: "failed" };
    }

    let key: string;
    try {
      key = keys.current.forRequest(request);
    } catch (error) {
      if (!(error instanceof SecureRandomUnavailableError)) throw error;
      toast({
        title: copy.productNotSaved,
        description: copy.secureRandomUnavailable,
        variant: "destructive",
      });
      return { fields: { root: copy.secureRandomUnavailable }, state: "failed" };
    }
    inFlight.current = true;
    setIsSubmitting(true);
    try {
      let result = await client.createProduct(request, key);
      if ((result.state === "processing" || result.state === "uncertain") && result.retry.can_reconcile) {
        result = await client.getOperation(result.operation_id).catch(() => result);
      }

      if (result.state === "succeeded" && result.product) {
        upsertProduct(queueProduct(result, input, bootstrap));
        keys.current.clear(key);
        toast({ title: copy.productSaved, description: `${result.product.name} · #${result.product.id}` });
        return { fields: {}, state: "succeeded" };
      }

      if (result.operation_id) upsertProduct(queueProduct(result, input, bootstrap));
      const fields = operationErrorFields(result.errors);
      if (result.state === "failed") {
        toast({
          title: copy.productNotSaved,
          description: result.errors[0]?.message ?? copy.reviewFields,
          variant: "destructive",
        });
        return { fields, state: "failed" };
      }

      toast({
        title: copy.saveOutcomePending,
        description: copy.saveOutcomePendingHelp,
      });
      return { fields, state: "uncertain" };
    } catch (error) {
      const apiError = error instanceof WorkspaceApiError ? error : null;
      const uncertain = apiError?.outcomeUncertain === true;
      toast({
        title: uncertain ? copy.saveOutcomeUnknown : copy.productNotSaved,
        description: apiError?.message ?? copy.serverRequestFailed,
        variant: "destructive",
      });
      return {
        fields: apiError ? mapServerFields(apiError.fields) : {},
        state: uncertain ? "uncertain" : "failed",
      };
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }, [bootstrap, client, copy, upsertProduct]);

  return { isSubmitting, submit };
}
