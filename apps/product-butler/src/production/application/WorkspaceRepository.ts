import type { WorkspaceSnapshot } from "../domain/workspace";
import type {
  CanonicalProduct,
  CategoryPage,
  CreateProductRequest,
  OperationPage,
  OperationResult,
  OperationSummary,
  ProductPage,
  ProductImageResource,
  WorkspacePreferences,
  VariableProductRequest,
  VariableUpdateResult,
} from "../domain/products";
import type { AttributeCatalogItem, AttributeTerm } from "../domain/variableProducts";

export interface SearchOptions {
  page?: number;
  perPage?: number;
  productStatus?: string;
  search?: string;
  signal?: AbortSignal;
  state?: string;
  status?: string;
}

export interface CategoryQueryOptions {
  include?: number[];
  page?: number;
  parent?: number;
  perPage?: number;
  search?: string;
  signal?: AbortSignal;
}

export interface WorkspaceRepository {
  load: () => Promise<WorkspaceSnapshot>;
  createProduct: (request: CreateProductRequest, idempotencyKey: string) => Promise<OperationResult>;
  createVariableProduct: (request: VariableProductRequest, idempotencyKey: string) => Promise<OperationResult>;
  getProduct: (productId: number) => Promise<CanonicalProduct>;
  updateProduct: (productId: number, version: string, product: CreateProductRequest) => Promise<CanonicalProduct>;
  updateVariableProduct: (productId: number, version: string, product: VariableProductRequest) => Promise<VariableUpdateResult>;
  trashProduct: (productId: number, version: string) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<CreateProductRequest>;
  searchProducts: (options: SearchOptions) => Promise<ProductPage>;
  getOperation: (operationId: string) => Promise<OperationResult>;
  getMedia: (mediaId: number) => Promise<ProductImageResource>;
  listOperations: (options: SearchOptions) => Promise<OperationPage>;
  getOperationSummary: () => Promise<OperationSummary>;
  retryOperation: (operationId: string) => Promise<OperationResult>;
  dismissOperation: (operationId: string) => Promise<void>;
  getPreferences: () => Promise<WorkspacePreferences>;
  updatePreferences: (preferences: Partial<WorkspacePreferences>) => Promise<WorkspacePreferences>;
  uploadMedia: (file: File) => Promise<ProductImageResource>;
  listCategories: (options: CategoryQueryOptions) => Promise<CategoryPage>;
  searchCategories: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
  searchTags: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
  searchShippingClasses: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
  listAttributes: () => Promise<AttributeCatalogItem[]>;
  listAttributeTerms: (attributeId: number) => Promise<AttributeTerm[]>;
}
