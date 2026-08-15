import type { ProductFormData } from "@/types/product";
import type { ProductImageResource, SimpleProductFields } from "../../domain/products";
import { fieldsToDraft } from "./productDrafts";

export function duplicatePrefillToDraft(
  prefill: SimpleProductFields,
  images: ProductImageResource[],
): ProductFormData {
  return fieldsToDraft(prefill, images);
}
