import type { OperationResult } from "../../domain/products";
import type { Product, ProductImage } from "@/types/product";
import type { WorkspaceBootstrap } from "../../domain/workspace";

export type QueueStatus = "all" | Product["status"];

export function operationFilters(status: QueueStatus) {
  if (status === "synced") return { productStatus: "publish", state: "succeeded" };
  if (status === "draft") return { productStatus: "unpublished", state: "succeeded" };
  if (status === "pending") return { state: "active" };
  if (status === "error") return { state: "failed" };
  return { state: "all" };
}

function operationImages(result: OperationResult): ProductImage[] {
  return (result.product?.images ?? []).map((image) => ({
    id: `wp-${image.id}`,
    preview: image.url,
    wpMediaId: image.id,
  }));
}

export function operationToQueueProduct(
  result: OperationResult,
  bootstrap: WorkspaceBootstrap,
): Product {
  const product = result.product;
  const input = result.input;
  return {
    canRetry: result.retry.can_retry,
    categoryId: String(product?.category_ids[0] ?? input?.category_ids[0] ?? ""),
    createdAt: new Date(result.created_at ?? product?.created_at ?? Date.now()),
    createdBy: bootstrap.user.displayName,
    currencySymbol: bootstrap.woocommerce.currencySymbol,
    errorMessage: result.errors[0]?.message,
    id: result.operation_id,
    images: operationImages(result),
    isVariable: false,
    longDescription: product?.description ?? input?.description ?? "",
    name: product?.name ?? input?.name ?? "Untitled product",
    regularPrice: product?.regular_price ?? input?.regular_price ?? "",
    salePrice: product?.sale_price ?? input?.sale_price ?? "",
    shortDescription: product?.short_description ?? input?.short_description ?? "",
    sku: product?.sku ?? input?.sku ?? "",
    status: result.state === "succeeded"
      ? product?.status === "publish" ? "synced" : "draft"
      : result.state === "failed" ? "error" : "pending",
    stockQuantity: String(product?.stock_quantity ?? input?.stock_quantity ?? ""),
    variations: [],
    wooCommerceId: product?.id,
  };
}
