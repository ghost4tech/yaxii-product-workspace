import type { CreateProductRequest, VariableProductRequest, WorkspacePreferences } from "../domain/products";
import type { SearchOptions, WorkspaceRepository } from "./WorkspaceRepository";

export class WorkspaceClient {
  public constructor(private readonly repository: WorkspaceRepository) {}

  public load() { return this.repository.load(); }
  public createProduct(request: CreateProductRequest, key: string) { return this.repository.createProduct(request, key); }
  public createVariableProduct(request: VariableProductRequest, key: string) { return this.repository.createVariableProduct(request, key); }
  public getProduct(id: number) { return this.repository.getProduct(id); }
  public updateProduct(id: number, version: string, product: CreateProductRequest) {
    return this.repository.updateProduct(id, version, product);
  }
  public updateVariableProduct(id: number, version: string, product: VariableProductRequest) {
    return this.repository.updateVariableProduct(id, version, product);
  }
  public trashProduct(id: number, version: string) { return this.repository.trashProduct(id, version); }
  public duplicateProduct(id: number) { return this.repository.duplicateProduct(id); }
  public searchProducts(options: SearchOptions) { return this.repository.searchProducts(options); }
  public getOperation(id: string) { return this.repository.getOperation(id); }
  public listOperations(options: SearchOptions = {}) { return this.repository.listOperations(options); }
  public retryOperation(id: string) { return this.repository.retryOperation(id); }
  public dismissOperation(id: string) { return this.repository.dismissOperation(id); }
  public getPreferences() { return this.repository.getPreferences(); }
  public updatePreferences(preferences: Partial<WorkspacePreferences>) {
    return this.repository.updatePreferences(preferences);
  }
  public searchCategories(query: string, signal?: AbortSignal) { return this.repository.searchCategories(query, signal); }
  public searchTags(query: string, signal?: AbortSignal) { return this.repository.searchTags(query, signal); }
  public searchShippingClasses(query: string, signal?: AbortSignal) {
    return this.repository.searchShippingClasses(query, signal);
  }
  public listAttributes() { return this.repository.listAttributes(); }
  public listAttributeTerms(attributeId: number) { return this.repository.listAttributeTerms(attributeId); }
}
