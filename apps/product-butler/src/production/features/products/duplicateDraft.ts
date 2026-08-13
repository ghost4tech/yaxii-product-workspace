import type { ProductFormData, ProductImage } from "@/types/product";
import type { ProductImageResource, SimpleProductFields } from "../../domain/products";

function draftImages(images: ProductImageResource[]): ProductImage[] {
  return images.map((image) => ({
    id: `wp-${image.id}`,
    preview: image.url,
    wpMediaId: image.id,
  }));
}

export function duplicatePrefillToDraft(
  prefill: SimpleProductFields,
  images: ProductImageResource[],
): ProductFormData {
  return {
    categoryId: String(prefill.category_ids[0] ?? ""),
    images: draftImages(images).filter((image) => prefill.image_ids.includes(image.wpMediaId ?? 0)),
    isVariable: false,
    longDescription: prefill.description,
    name: prefill.name,
    regularPrice: prefill.regular_price,
    salePrice: prefill.sale_price ?? "",
    saleScheduleEnd: prefill.date_on_sale_to ? new Date(prefill.date_on_sale_to) : undefined,
    saleScheduleStart: prefill.date_on_sale_from ? new Date(prefill.date_on_sale_from) : undefined,
    shortDescription: prefill.short_description,
    sku: prefill.sku,
    stockQuantity: prefill.stock_quantity === null ? "" : String(prefill.stock_quantity),
    variations: [],
  };
}
