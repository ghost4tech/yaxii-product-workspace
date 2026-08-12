export interface ProductDraft {
  category: string;
  longDescription: string;
  name: string;
  regularPrice: string;
  salePrice: string;
  shortDescription: string;
  sku: string;
  status: "draft" | "publish";
  stockQuantity: string;
  weight: string;
}

export const EMPTY_PRODUCT_DRAFT: ProductDraft = {
  category: "",
  longDescription: "",
  name: "",
  regularPrice: "",
  salePrice: "",
  shortDescription: "",
  sku: "",
  status: "draft",
  stockQuantity: "",
  weight: "",
};
