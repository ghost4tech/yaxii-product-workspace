import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import {
  DEFAULT_WORKSPACE_PREFERENCES,
  type CanonicalProduct,
  type CreateProductRequest,
  type OperationResult,
  type OperationSummary,
} from "../domain/products";
import type { WorkspaceSnapshot } from "../domain/workspace";

export const simpleProductFields: CreateProductRequest = {
  backorders: "no", catalog_visibility: "visible", category_ids: [7],
  date_on_sale_from: null, date_on_sale_to: null, description: "Long", height: "",
  image_ids: [], length: "", manage_stock: false, name: "Canvas tote",
  regular_price: "19.99", sale_price: null, shipping_class_id: 0,
  short_description: "Short", sku: "TOTE-1", slug: "canvas-tote",
  sold_individually: false, status: "publish", stock_quantity: null,
  stock_status: "instock", tag_ids: [], tax_class: "", tax_status: "taxable",
  weight: "", width: "",
};

export const canonicalProduct: CanonicalProduct = {
  ...simpleProductFields,
  created_at: "2026-08-13T12:00:00+00:00",
  id: 321,
  images: [],
  modified_at: "2026-08-13T12:00:00+00:00",
  type: "simple",
  version: "1".repeat(64),
};

export function operationResult(state: OperationResult["state"] = "succeeded"): OperationResult {
  return {
    combination_results: [],
    created_at: "2026-08-13T12:00:00+00:00",
    errors: [],
    input: simpleProductFields,
    operation_id: "11111111-1111-4111-8111-111111111111",
    product: state === "succeeded" ? canonicalProduct : null,
    replayed: false,
    retry: { can_reconcile: state !== "succeeded", can_retry: false, safe_to_resubmit: false },
    state,
    updated_at: "2026-08-13T12:00:00+00:00",
    warnings: [],
  };
}

export const workspaceSnapshot: WorkspaceSnapshot = {
  availability: { kind: "ready" },
  bootstrap: {
    capabilities: { createProducts: true, publishProducts: true, uploadMedia: true },
    direction: "ltr",
    environment: "wordpress",
    features: {
      categoryLookup: true, mediaSelection: true, operationLookup: true,
      operationQueue: true, preferences: true, productManagement: true,
      shippingClassLookup: true, simpleProductCreate: true, tagLookup: true,
      variableProductCreate: true,
    },
    frontendAvailable: true,
    isWooCommerceAvailable: true,
    locale: "en-US",
    pluginVersion: "test",
    user: { displayName: "Admin", id: 1 },
    woocommerce: {
      currency: "USD", currencySymbol: "$", dimensionUnit: "cm",
      taxClasses: [], version: "10.9.4", weightUnit: "kg",
    },
  },
};

export const emptyOperationSummary: OperationSummary = {
  buckets: Array.from({ length: 7 }, () => ({
    eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0,
  })),
  current: { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 },
  previous: { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 },
  window: {
    bucket_hours: 24,
    ends_at: "2026-08-14T12:00:00+00:00",
    previous_starts_at: "2026-07-31T12:00:00+00:00",
    starts_at: "2026-08-07T12:00:00+00:00",
  },
};

export function workspaceRepository(overrides: Partial<WorkspaceRepository> = {}): WorkspaceRepository {
  const unavailable = () => Promise.reject(new Error("Not configured for this test."));
  const emptyTerms = () => Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20 });
  return {
    createProduct: unavailable,
    createVariableProduct: unavailable,
    dismissOperation: () => Promise.resolve(),
    duplicateProduct: unavailable,
    getOperation: unavailable,
    getOperationSummary: () => Promise.resolve(emptyOperationSummary),
    getMedia: unavailable,
    getPreferences: () => Promise.resolve(DEFAULT_WORKSPACE_PREFERENCES),
    getProduct: unavailable,
    listAttributes: () => Promise.resolve([]),
    listAttributeTerms: () => Promise.resolve([]),
    listCategories: emptyTerms,
    listOperations: () => Promise.resolve({
      counts: { all: 0, draft: 0, error: 0, pending: 0, synced: 0 },
      has_more: false, items: [], page: 1, per_page: 25, total: 0,
    }),
    load: () => Promise.resolve(workspaceSnapshot),
    retryOperation: unavailable,
    searchCategories: emptyTerms,
    searchProducts: () => Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20, total: 0 }),
    searchShippingClasses: emptyTerms,
    searchTags: emptyTerms,
    trashProduct: unavailable,
    updatePreferences: () => Promise.resolve(DEFAULT_WORKSPACE_PREFERENCES),
    uploadMedia: unavailable,
    updateProduct: unavailable,
    updateVariableProduct: unavailable,
    ...overrides,
  };
}
