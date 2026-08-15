import type { Category } from "@/types/product";
import type { VariableAttribute, VariationCombination } from "./variableProducts";

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

interface CanonicalProductBase extends SimpleProductFields {
  created_at: string | null;
  id: number;
  images: ProductImageResource[];
  modified_at: string | null;
  version: string;
}

export interface CanonicalSimpleProduct extends CanonicalProductBase { type: "simple"; }
export interface CanonicalVariableProduct extends CanonicalProductBase {
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  projected_count: number;
  type: "variable";
}
export type CanonicalProduct = CanonicalSimpleProduct | CanonicalVariableProduct;

export interface VariableProductRequest {
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  product: CreateProductRequest;
}

export interface VariableUpdateResult {
  combination_results: CombinationWriteResult[];
  product: CanonicalVariableProduct;
  state: "succeeded" | "partial";
}

export interface CombinationWriteResult {
  client_id: string;
  error: { code: string; message: string } | null;
  fingerprint: string;
  state: "succeeded" | "failed" | "deleted";
  variation_id: number;
}

export type OperationProduct = Pick<CanonicalProduct, "id" | "name" | "sku" | "status">
  & Partial<Omit<CanonicalProduct, "id" | "name" | "sku" | "status">>;

export interface OperationError {
  code: string;
  fields: Record<string, string[]>;
  message: string;
}

export interface OperationResult {
  created_at?: string | null;
  errors: OperationError[];
  combination_results: CombinationWriteResult[];
  input?: CreateProductRequest | VariableProductRequest | null;
  operation_id: string;
  product: CanonicalProduct | null;
  replayed: boolean;
  retry: { can_reconcile: boolean; can_retry: boolean; safe_to_resubmit: false };
  state: "succeeded" | "partial" | "failed" | "processing" | "uncertain";
  updated_at?: string | null;
  warnings: string[];
}

export interface OperationHistoryResult extends Omit<OperationResult, "product"> {
  product: OperationProduct | null;
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
export type OperationPage = PagedResult<OperationHistoryResult> & {
  counts: OperationCounts;
  total: number;
};

export interface OperationMetricCounts {
  eligible: number;
  needs_attention: number;
  operations: number;
  published: number;
  succeeded: number;
}

export interface OperationSummary {
  buckets: OperationMetricCounts[];
  current: OperationMetricCounts;
  previous: OperationMetricCounts;
  window: {
    bucket_hours: 24;
    ends_at: string;
    previous_starts_at: string;
    starts_at: string;
  };
}

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
