import type { WorkspaceSnapshot } from "../domain/workspace";
import type {
  CanonicalProduct,
  CategoryPage,
  CreateProductRequest,
  OperationPage,
  OperationResult,
  ProductPage,
  WorkspacePreferences,
} from "../domain/products";

export interface SearchOptions {
  page?: number;
  perPage?: number;
  productStatus?: string;
  search?: string;
  signal?: AbortSignal;
  state?: string;
  status?: string;
}

export interface WorkspaceRepository {
  load: () => Promise<WorkspaceSnapshot>;
  createProduct: (request: CreateProductRequest, idempotencyKey: string) => Promise<OperationResult>;
  getProduct: (productId: number) => Promise<CanonicalProduct>;
  updateProduct: (productId: number, version: string, product: CreateProductRequest) => Promise<CanonicalProduct>;
  trashProduct: (productId: number, version: string) => Promise<void>;
  duplicateProduct: (productId: number) => Promise<CreateProductRequest>;
  searchProducts: (options: SearchOptions) => Promise<ProductPage>;
  getOperation: (operationId: string) => Promise<OperationResult>;
  listOperations: (options: SearchOptions) => Promise<OperationPage>;
  retryOperation: (operationId: string) => Promise<OperationResult>;
  dismissOperation: (operationId: string) => Promise<void>;
  getPreferences: () => Promise<WorkspacePreferences>;
  updatePreferences: (preferences: Partial<WorkspacePreferences>) => Promise<WorkspacePreferences>;
  searchCategories: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
  searchTags: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
  searchShippingClasses: (query: string, signal?: AbortSignal) => Promise<CategoryPage>;
}
