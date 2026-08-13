import type { WorkspaceSnapshot } from "../domain/workspace";
import type { CreateProductRequest } from "../domain/products";
import type { WorkspaceRepository } from "./WorkspaceRepository";

export class WorkspaceClient {
  public constructor(private readonly repository: WorkspaceRepository) {}

  public load(): Promise<WorkspaceSnapshot> {
    return this.repository.load();
  }

  public createProduct(request: CreateProductRequest, idempotencyKey: string) {
    return this.repository.createProduct(request, idempotencyKey);
  }

  public getOperation(operationId: string) {
    return this.repository.getOperation(operationId);
  }

  public searchCategories(query: string) {
    return this.repository.searchCategories(query);
  }
}
