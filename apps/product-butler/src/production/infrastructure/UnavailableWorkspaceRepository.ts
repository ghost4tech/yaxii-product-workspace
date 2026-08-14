import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import type { WorkspaceSnapshot } from "../domain/workspace";

export class UnavailableWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({
      availability: { kind: "host-unavailable" },
      bootstrap: {
        capabilities: { createProducts: false, publishProducts: false, uploadMedia: false },
        direction: "ltr",
        environment: "wordpress",
        features: {
          categoryLookup: false,
          mediaSelection: false,
          operationLookup: false,
          operationQueue: false,
          preferences: false,
          productManagement: false,
          shippingClassLookup: false,
          simpleProductCreate: false,
          tagLookup: false,
          variableProductCreate: false,
        },
        frontendAvailable: false,
        isWooCommerceAvailable: false,
        locale: "en-US",
        pluginVersion: "unknown",
        user: { displayName: "", id: 0 },
        woocommerce: {
          currency: "",
          currencySymbol: "",
          dimensionUnit: "",
          taxClasses: [],
          version: null,
          weightUnit: "",
        },
      },
    });
  }

  public createProduct(): Promise<never> {
    return Promise.reject(this.unavailable());
  }
  public createVariableProduct(): Promise<never> { return Promise.reject(this.unavailable()); }

  public getOperation(): Promise<never> {
    return Promise.reject(this.unavailable());
  }
  public getMedia(): Promise<never> { return Promise.reject(this.unavailable()); }

  public getProduct(): Promise<never> { return Promise.reject(this.unavailable()); }
  public updateProduct(): Promise<never> { return Promise.reject(this.unavailable()); }
  public updateVariableProduct(): Promise<never> { return Promise.reject(this.unavailable()); }
  public trashProduct(): Promise<never> { return Promise.reject(this.unavailable()); }
  public duplicateProduct(): Promise<never> { return Promise.reject(this.unavailable()); }
  public searchProducts(): Promise<never> { return Promise.reject(this.unavailable()); }
  public listOperations(): Promise<never> { return Promise.reject(this.unavailable()); }
  public getOperationSummary(): Promise<never> { return Promise.reject(this.unavailable()); }
  public retryOperation(): Promise<never> { return Promise.reject(this.unavailable()); }
  public dismissOperation(): Promise<never> { return Promise.reject(this.unavailable()); }
  public getPreferences(): Promise<never> { return Promise.reject(this.unavailable()); }
  public updatePreferences(): Promise<never> { return Promise.reject(this.unavailable()); }
  public uploadMedia(): Promise<never> { return Promise.reject(this.unavailable()); }

  public searchCategories(): Promise<never> {
    return Promise.reject(this.unavailable());
  }
  public listCategories(): Promise<never> { return Promise.reject(this.unavailable()); }

  public searchTags(): Promise<never> { return Promise.reject(this.unavailable()); }
  public searchShippingClasses(): Promise<never> { return Promise.reject(this.unavailable()); }
  public listAttributes(): Promise<never> { return Promise.reject(this.unavailable()); }
  public listAttributeTerms(): Promise<never> { return Promise.reject(this.unavailable()); }

  private unavailable() {
    return new WorkspaceApiError("ypw_host_unavailable", "The WordPress host is unavailable.", 503);
  }
}
