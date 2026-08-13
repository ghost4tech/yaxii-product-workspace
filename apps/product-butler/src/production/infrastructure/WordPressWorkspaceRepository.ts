import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import type { CategoryPage, CreateProductRequest, OperationResult } from "../domain/products";
import type { WorkspaceBootstrap, WorkspaceHostConfig, WorkspaceSnapshot } from "../domain/workspace";
import { categoryPageSchema, operationResultSchema } from "./restContracts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function unwrapData(value: unknown): JsonRecord {
  if (!isRecord(value) || !isRecord(value.data)) {
    throw new WorkspaceApiError("ypw_invalid_response", "The server returned an invalid response.", 502);
  }
  return value.data;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function parseBootstrap(value: unknown, host: WorkspaceHostConfig): WorkspaceBootstrap {
  const data = unwrapData(value);
  const capabilities = isRecord(data.capabilities) ? data.capabilities : {};
  const features = isRecord(data.features) ? data.features : {};
  const locale = isRecord(data.locale) ? data.locale : {};
  const user = isRecord(data.user) ? data.user : {};
  const woo = isRecord(data.woocommerce) ? data.woocommerce : {};
  const available = booleanValue(woo.available);

  return {
    capabilities: {
      createProducts: booleanValue(capabilities.create_products),
      publishProducts: booleanValue(capabilities.publish_products),
      uploadMedia: booleanValue(capabilities.upload_media),
    },
    direction: locale.direction === "rtl" ? "rtl" : host.direction,
    environment: "wordpress",
    features: {
      categoryLookup: booleanValue(features.category_lookup),
      mediaSelection: booleanValue(features.media_selection),
      operationLookup: booleanValue(features.operation_lookup),
      simpleProductCreate: booleanValue(features.simple_product_create),
      variableProductCreate: booleanValue(features.variable_product_create),
    },
    frontendAvailable: host.frontendAvailable,
    isWooCommerceAvailable: available,
    locale: typeof locale.code === "string" ? locale.code : host.locale,
    pluginVersion: host.pluginVersion,
    user: {
      displayName: typeof user.display_name === "string" ? user.display_name : "",
      id: typeof user.id === "number" ? user.id : 0,
    },
    woocommerce: {
      currency: typeof woo.currency === "string" ? woo.currency : "",
      currencySymbol: typeof woo.currency_symbol === "string" ? woo.currency_symbol : "",
      dimensionUnit: typeof woo.dimension_unit === "string" ? woo.dimension_unit : "",
      version: typeof woo.version === "string" ? woo.version : null,
      weightUnit: typeof woo.weight_unit === "string" ? woo.weight_unit : "",
    },
  };
}

function parseOperation(value: unknown): OperationResult {
  const parsed = operationResultSchema.safeParse(unwrapData(value));
  if (!parsed.success) {
    throw new WorkspaceApiError("ypw_invalid_response", "The server returned an invalid operation.", 502);
  }
  return parsed.data;
}

function parseCategoryPage(value: unknown): CategoryPage {
  const parsed = categoryPageSchema.safeParse(unwrapData(value));
  if (!parsed.success) {
    throw new WorkspaceApiError("ypw_invalid_response", "The server returned invalid categories.", 502);
  }
  return parsed.data;
}

export class WordPressWorkspaceRepository implements WorkspaceRepository {
  public constructor(private readonly host: WorkspaceHostConfig) {}

  public async load(): Promise<WorkspaceSnapshot> {
    const bootstrap = parseBootstrap(await this.request("bootstrap"), this.host);
    const availability = !bootstrap.frontendAvailable
      ? { kind: "frontend-unavailable" as const }
      : !bootstrap.isWooCommerceAvailable
        ? { kind: "woocommerce-unavailable" as const }
        : { kind: "ready" as const };
    return { availability, bootstrap };
  }

  public async createProduct(request: CreateProductRequest, idempotencyKey: string) {
    return parseOperation(
      await this.request("products", {
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        method: "POST",
      }),
    );
  }

  public async getOperation(operationId: string) {
    return parseOperation(await this.request(`operations/${encodeURIComponent(operationId)}`));
  }

  public async searchCategories(query: string) {
    const params = new URLSearchParams({ page: "1", per_page: "20", search: query });
    return parseCategoryPage(await this.request(`categories?${params.toString()}`));
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${this.host.restUrl}${path}`, {
        ...init,
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-WP-Nonce": this.host.nonce, ...init.headers },
      });
    } catch {
      throw new WorkspaceApiError(
        "ypw_network_error",
        "The server response was not received. Submit again to reconcile this operation safely.",
        0,
        {},
        init.method === "POST",
      );
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (isRecord(payload) && isRecord(payload.data) && typeof payload.data.state === "string") {
        return payload;
      }
      const error = isRecord(payload) ? payload : {};
      const data = isRecord(error.data) ? error.data : {};
      const fields = isRecord(data.fields) ? (data.fields as Record<string, string[]>) : {};
      throw new WorkspaceApiError(
        typeof error.code === "string" ? error.code : "ypw_request_failed",
        typeof error.message === "string" ? error.message : "The server request failed.",
        response.status,
        fields,
      );
    }
    return payload;
  }
}
