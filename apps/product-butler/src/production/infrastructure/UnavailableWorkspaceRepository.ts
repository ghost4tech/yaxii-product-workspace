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
          simpleProductCreate: false,
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
          version: null,
          weightUnit: "",
        },
      },
    });
  }

  public createProduct(): Promise<never> {
    return Promise.reject(this.unavailable());
  }

  public getOperation(): Promise<never> {
    return Promise.reject(this.unavailable());
  }

  public searchCategories(): Promise<never> {
    return Promise.reject(this.unavailable());
  }

  private unavailable() {
    return new WorkspaceApiError("ypw_host_unavailable", "The WordPress host is unavailable.", 503);
  }
}
