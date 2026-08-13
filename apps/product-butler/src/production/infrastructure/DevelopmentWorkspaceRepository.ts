import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import type { WorkspaceSnapshot } from "../domain/workspace";

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
          simpleProductCreate: false,
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
          version: null,
          weightUnit: "kg",
        },
      },
    });
  }

  public createProduct(): Promise<never> {
    return Promise.reject(this.unsupported());
  }

  public getOperation(): Promise<never> {
    return Promise.reject(this.unsupported());
  }

  public searchCategories() {
    return Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20 });
  }

  private unsupported() {
    return new WorkspaceApiError("ypw_development_only", "WooCommerce writes require WordPress.", 503);
  }
}
