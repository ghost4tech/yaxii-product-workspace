import type { Category } from "@/types/product";

export type ProductStatus = "draft" | "publish" | "pending";
export type CatalogVisibility = "visible" | "catalog" | "search" | "hidden";
export type StockStatus = "instock" | "outofstock" | "onbackorder";
export type Backorders = "no" | "notify" | "yes";
export type TaxStatus = "taxable" | "shipping" | "none";

export interface SimpleProductFields {
  backorders: Backorders;
  catalog_visibility: CatalogVisibility;
  category_ids: number[];
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  description: string;
  height: string;
  image_ids: number[];
  length: string;
  manage_stock: boolean;
  name: string;
  regular_price: string;
  sale_price: string | null;
  shipping_class_id: number;
  short_description: string;
  sku: string;
  slug: string;
  sold_individually: boolean;
  status: ProductStatus;
  stock_quantity: number | null;
  stock_status: StockStatus;
  tag_ids: number[];
  tax_class: string;
  tax_status: TaxStatus;
  weight: string;
  width: string;
}

export type CreateProductRequest = SimpleProductFields;

export interface ProductImageResource {
  alt: string;
  id: number;
  url: string;
}

export interface CanonicalProduct extends SimpleProductFields {
  created_at: string | null;
  id: number;
  images: ProductImageResource[];
  modified_at: string | null;
  type: "simple";
  version: string;
}

export interface OperationError {
  code: string;
  fields: Record<string, string[]>;
  message: string;
}

export interface OperationResult {
  created_at?: string | null;
  errors: OperationError[];
  input?: CreateProductRequest | null;
  operation_id: string;
  product: CanonicalProduct | null;
  replayed: boolean;
  retry: { can_reconcile: boolean; can_retry: boolean; safe_to_resubmit: false };
  state: "succeeded" | "failed" | "processing" | "uncertain";
  updated_at?: string | null;
  warnings: string[];
}

export interface PagedResult<T> {
  has_more: boolean;
  items: T[];
  page: number;
  per_page: number;
  total?: number;
}

export type CategoryPage = PagedResult<Category>;
export type ProductPage = PagedResult<CanonicalProduct> & { total: number };
export interface OperationCounts {
  all: number;
  draft: number;
  error: number;
  pending: number;
  synced: number;
}
export type OperationPage = PagedResult<OperationResult> & {
  counts: OperationCounts;
  total: number;
};

export type RepeatField =
  | "category_ids"
  | "regular_price"
  | "sale_price"
  | "manage_stock"
  | "stock_quantity"
  | "stock_status"
  | "backorders"
  | "sold_individually"
  | "weight"
  | "dimensions"
  | "shipping_class_id"
  | "tax_status"
  | "tax_class"
  | "catalog_visibility";

export interface WorkspacePreferences {
  auto_focus_name: boolean;
  confirm_queue_dismiss: boolean;
  default_backorders: Backorders;
  default_catalog_visibility: CatalogVisibility;
  default_manage_stock: boolean;
  default_product_status: ProductStatus;
  default_sold_individually: boolean;
  default_stock_status: StockStatus;
  default_tax_class: string;
  default_tax_status: TaxStatus;
  queue_group_by_day: boolean;
  queue_rows_per_page: 10 | 25 | 50;
  relative_timestamps: boolean;
  repeat_fields: RepeatField[];
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  auto_focus_name: true,
  confirm_queue_dismiss: false,
  default_backorders: "no",
  default_catalog_visibility: "visible",
  default_manage_stock: false,
  default_product_status: "publish",
  default_sold_individually: false,
  default_stock_status: "instock",
  default_tax_class: "",
  default_tax_status: "taxable",
  queue_group_by_day: true,
  queue_rows_per_page: 25,
  relative_timestamps: true,
  repeat_fields: [],
};
