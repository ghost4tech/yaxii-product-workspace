import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { WorkspaceClient } from "../../application/WorkspaceClient";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { CanonicalProduct } from "../../domain/products";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { mapServerFields } from "./productErrors";
import { mapProductRequest, ProductMappingError, type ProductFieldErrors, type ProductSubmission } from "./productMapping";

export interface ManagementOutcome {
  fields: ProductFieldErrors;
  product?: CanonicalProduct;
  state: "conflict" | "failed" | "succeeded";
}

export function useProductManagement(client: WorkspaceClient, locale: string) {
  const [isSaving, setIsSaving] = useState(false);
  const copy = productOperationCopy(locale);

  const update = useCallback(async (
    current: CanonicalProduct,
    submission: ProductSubmission,
  ): Promise<ManagementOutcome> => {
    let request;
    try {
      request = mapProductRequest(submission, copy);
    } catch (error) {
      return {
        fields: error instanceof ProductMappingError ? error.fields : { root: copy.reviewFields },
        state: "failed",
      };
    }
    setIsSaving(true);
    try {
      const product = await client.updateProduct(current.id, current.version, request);
      toast({ description: `${product.name} · #${product.id}`, title: "Product updated" });
      return { fields: {}, product, state: "succeeded" };
    } catch (error) {
      const apiError = error instanceof WorkspaceApiError ? error : null;
      const conflict = apiError?.code === "ypw_product_conflict";
      toast({
        description: apiError?.message ?? copy.serverRequestFailed,
        title: conflict ? "A newer product version exists" : "Product was not updated",
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
      toast({ description: `${current.name} · #${current.id}`, title: "Product moved to trash" });
      return true;
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : copy.serverRequestFailed,
        title: "Product was not trashed",
        variant: "destructive",
      });
      return false;
    }
  }, [client, copy]);

  return { isSaving, trash, update };
}
