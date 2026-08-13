import type { Category } from "@/types/product";

export interface CreateProductRequest {
  catalog_visibility: "visible" | "catalog" | "search" | "hidden";
  category_ids: number[];
  description: string;
  image_ids: number[];
  manage_stock: boolean;
  name: string;
  regular_price: string;
  sale_price: string | null;
  short_description: string;
  sku: string;
  status: "draft" | "publish";
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  tax_status: "taxable" | "shipping" | "none";
}

export interface CanonicalProduct {
  catalog_visibility: string;
  category_ids: number[];
  created_at: string | null;
  id: number;
  image_ids: number[];
  manage_stock: boolean;
  name: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  status: string;
  stock_quantity: number | null;
  stock_status: string;
}

export interface OperationError {
  code: string;
  fields: Record<string, string[]>;
  message: string;
}

export interface OperationResult {
  errors: OperationError[];
  operation_id: string;
  product: CanonicalProduct | null;
  replayed: boolean;
  retry: { can_reconcile: boolean; safe_to_resubmit: boolean };
  state: "succeeded" | "failed" | "processing" | "uncertain";
  warnings: string[];
}

export interface CategoryPage {
  has_more: boolean;
  items: Category[];
  page: number;
  per_page: number;
}
