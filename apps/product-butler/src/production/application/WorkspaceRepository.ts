import type { WorkspaceSnapshot } from "../domain/workspace";
import type { CategoryPage, CreateProductRequest, OperationResult } from "../domain/products";

export interface WorkspaceRepository {
  load: () => Promise<WorkspaceSnapshot>;
  createProduct: (request: CreateProductRequest, idempotencyKey: string) => Promise<OperationResult>;
  getOperation: (operationId: string) => Promise<OperationResult>;
  searchCategories: (query: string) => Promise<CategoryPage>;
}
