import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { WorkspaceClient } from "../../application/WorkspaceClient";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { CanonicalProduct } from "../../domain/products";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { mapServerFields } from "./productErrors";
import { mapProductRequest, mapVariableProductRequest, ProductMappingError, type ProductFieldErrors, type ProductSubmission } from "./productMapping";
import { __ } from "../../core/i18n/wordpress";

export interface ManagementOutcome {
  fields: ProductFieldErrors;
  product?: CanonicalProduct;
  state: "conflict" | "failed" | "partial" | "succeeded";
}

export function useProductManagement(client: WorkspaceClient, locale: string) {
  const [isSaving, setIsSaving] = useState(false);
  const copy = productOperationCopy(locale);

  const update = useCallback(async (
    current: CanonicalProduct,
    submission: ProductSubmission,
  ): Promise<ManagementOutcome> => {
    if (submission.isVariable !== (current.type === "variable")) {
      return { fields: { root: __("An existing product cannot change type in this editor.", "yaxii-product-workspace") }, state: "failed" };
    }
    let request;
    try {
      request = submission.isVariable ? mapVariableProductRequest(submission, copy) : mapProductRequest(submission, copy);
    } catch (error) {
      return {
        fields: error instanceof ProductMappingError ? error.fields : { root: copy.reviewFields },
        state: "failed",
      };
    }
    setIsSaving(true);
    try {
      if (current.type === "variable") {
        const result = await client.updateVariableProduct(current.id, current.version, request as ReturnType<typeof mapVariableProductRequest>);
        if (result.state === "partial") {
          const message = result.combination_results.find((item) => item.state === "failed")?.error?.message
            ?? __("Some variation changes were not saved.", "yaxii-product-workspace");
          toast({ description: message, title: __("Product needs recovery", "yaxii-product-workspace"), variant: "destructive" });
          return { fields: { root: message }, product: result.product, state: "partial" };
        }
        toast({ description: `${result.product.name} - #${result.product.id}`, title: __("Product updated", "yaxii-product-workspace") });
        return { fields: {}, product: result.product, state: "succeeded" };
      }
      const product = await client.updateProduct(current.id, current.version, request as ReturnType<typeof mapProductRequest>);
      toast({ description: `${product.name} - #${product.id}`, title: __("Product updated", "yaxii-product-workspace") });
      return { fields: {}, product, state: "succeeded" };
    } catch (error) {
      const apiError = error instanceof WorkspaceApiError ? error : null;
      const conflict = apiError?.code === "ypw_product_conflict";
      toast({
        description: apiError?.message ?? copy.serverRequestFailed,
        title: conflict ? __("A newer product version exists", "yaxii-product-workspace") : __("Product was not updated", "yaxii-product-workspace"),
        variant: "destructive",
      });
      return {
        fields: apiError ? mapServerFields(apiError.fields) : {},
        state: conflict ? "conflict" : "failed",
      };
    } finally {
      setIsSaving(false);
    }
  }, [client, copy]);

  const trash = useCallback(async (current: CanonicalProduct): Promise<boolean> => {
    try {
      await client.trashProduct(current.id, current.version);
      toast({ description: `${current.name} - #${current.id}`, title: __("Product moved to trash", "yaxii-product-workspace") });
      return true;
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : copy.serverRequestFailed,
        title: __("Product was not trashed", "yaxii-product-workspace"),
        variant: "destructive",
      });
      return false;
    }
  }, [client, copy]);

  return { isSaving, trash, update };
}
