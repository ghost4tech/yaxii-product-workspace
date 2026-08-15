import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import type { WorkspaceSnapshot } from "../domain/workspace";
import { DEFAULT_WORKSPACE_PREFERENCES } from "../domain/products";

export class DevelopmentWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({
      availability: { kind: "ready" },
      bootstrap: {
        capabilities: { createProducts: false, publishProducts: false, uploadMedia: false },
        direction: "ltr",
        environment: "development",
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
        frontendAvailable: true,
        isWooCommerceAvailable: true,
        locale: "en-US",
        pluginVersion: "development",
        user: { displayName: "Development", id: 0 },
        woocommerce: {
          currency: "USD",
          currencySymbol: "$",
          dimensionUnit: "cm",
          taxClasses: [],
          version: null,
          weightUnit: "kg",
        },
      },
    });
  }

  public createProduct(): Promise<never> {
    return Promise.reject(this.unsupported());
  }
  public createVariableProduct(): Promise<never> { return Promise.reject(this.unsupported()); }

  public getOperation(): Promise<never> {
    return Promise.reject(this.unsupported());
  }
  public getMedia(): Promise<never> { return Promise.reject(this.unsupported()); }

  public getProduct(): Promise<never> { return Promise.reject(this.unsupported()); }
  public updateProduct(): Promise<never> { return Promise.reject(this.unsupported()); }
  public updateVariableProduct(): Promise<never> { return Promise.reject(this.unsupported()); }
  public trashProduct(): Promise<never> { return Promise.reject(this.unsupported()); }
  public duplicateProduct(): Promise<never> { return Promise.reject(this.unsupported()); }
  public searchProducts() { return Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20, total: 0 }); }
  public listOperations() {
    return Promise.resolve({
      counts: { all: 0, draft: 0, error: 0, pending: 0, synced: 0 },
      has_more: false,
      items: [],
      page: 1,
      per_page: 25,
      total: 0,
    });
  }
  public getOperationSummary() {
    const counts = { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 };
    const endsAt = new Date();
    const startsAt = new Date(endsAt.getTime() - 7 * 86_400_000);
    const previousStartsAt = new Date(startsAt.getTime() - 7 * 86_400_000);
    return Promise.resolve({
      buckets: Array.from({ length: 7 }, () => ({ ...counts })),
      current: { ...counts },
      previous: { ...counts },
      window: {
        bucket_hours: 24 as const,
        ends_at: endsAt.toISOString(),
        previous_starts_at: previousStartsAt.toISOString(),
        starts_at: startsAt.toISOString(),
      },
    });
  }
  public retryOperation(): Promise<never> { return Promise.reject(this.unsupported()); }
  public dismissOperation(): Promise<never> { return Promise.reject(this.unsupported()); }
  public getPreferences() { return Promise.resolve(DEFAULT_WORKSPACE_PREFERENCES); }
  public updatePreferences() { return Promise.resolve(DEFAULT_WORKSPACE_PREFERENCES); }
  public uploadMedia(): Promise<never> { return Promise.reject(this.unsupported()); }

  public searchCategories() {
    return Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20 });
  }
  public listCategories() { return this.searchCategories(); }

  public searchTags() { return this.searchCategories(); }
  public searchShippingClasses() { return this.searchCategories(); }
  public listAttributes() { return Promise.resolve([]); }
  public listAttributeTerms() { return Promise.resolve([]); }

  private unsupported() {
    return new WorkspaceApiError("ypw_development_only", "WooCommerce writes require WordPress.", 503);
  }
}
