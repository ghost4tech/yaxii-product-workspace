import type { SearchOptions, WorkspaceRepository } from "../application/WorkspaceRepository";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import type {
  CanonicalProduct,
  CategoryPage,
  CreateProductRequest,
  OperationPage,
  OperationResult,
  ProductPage,
  WorkspacePreferences,
} from "../domain/products";
import type { WorkspaceBootstrap, WorkspaceHostConfig, WorkspaceSnapshot } from "../domain/workspace";
import {
  canonicalProductSchema,
  operationPageSchema,
  operationResultSchema,
  preferencesSchema,
  productPageSchema,
  simpleProductFieldsSchema,
  termPageSchema,
  trashedProductSchema,
} from "./restContracts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function unwrapData(value: unknown): unknown {
  if (!isRecord(value) || !("data" in value)) {
    throw new WorkspaceApiError("ypw_invalid_response", "The server returned an invalid response.", 502);
  }
  return value.data;
}

function parse<T>(value: unknown, schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }, label: string): T {
  const parsed = schema.safeParse(unwrapData(value));
  if (!parsed.success || parsed.data === undefined) {
    throw new WorkspaceApiError("ypw_invalid_response", `The server returned invalid ${label}.`, 502);
  }
  return parsed.data;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function taxClasses(value: unknown): Array<{ name: string; slug: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => isRecord(item) && typeof item.name === "string" && typeof item.slug === "string"
    ? [{ name: item.name, slug: item.slug }]
    : []);
}

function parseBootstrap(value: unknown, host: WorkspaceHostConfig): WorkspaceBootstrap {
  const unwrapped = unwrapData(value);
  if (!isRecord(unwrapped)) throw new WorkspaceApiError("ypw_invalid_response", "The server returned invalid bootstrap data.", 502);
  const capabilities = isRecord(unwrapped.capabilities) ? unwrapped.capabilities : {};
  const features = isRecord(unwrapped.features) ? unwrapped.features : {};
  const locale = isRecord(unwrapped.locale) ? unwrapped.locale : {};
  const user = isRecord(unwrapped.user) ? unwrapped.user : {};
  const woo = isRecord(unwrapped.woocommerce) ? unwrapped.woocommerce : {};

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
      operationQueue: booleanValue(features.operation_queue),
      preferences: booleanValue(features.preferences),
      productManagement: booleanValue(features.simple_product_manage),
      shippingClassLookup: booleanValue(features.shipping_class_lookup),
      simpleProductCreate: booleanValue(features.simple_product_create),
      tagLookup: booleanValue(features.tag_lookup),
      variableProductCreate: booleanValue(features.variable_product_create),
    },
    frontendAvailable: host.frontendAvailable,
    isWooCommerceAvailable: booleanValue(woo.available),
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
      taxClasses: taxClasses(woo.tax_classes),
      version: typeof woo.version === "string" ? woo.version : null,
      weightUnit: typeof woo.weight_unit === "string" ? woo.weight_unit : "",
    },
  };
}

function queryString(options: SearchOptions): string {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    per_page: String(options.perPage ?? 20),
    search: options.search ?? "",
  });
  if (options.state) params.set("state", options.state);
  if (options.status) params.set("status", options.status);
  if (options.productStatus) params.set("product_status", options.productStatus);
  return params.toString();
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

  public async createProduct(request: CreateProductRequest, key: string): Promise<OperationResult> {
    return parse(await this.request("products", this.json("POST", request, { "Idempotency-Key": key }), true), operationResultSchema, "operation");
  }

  public async getProduct(id: number): Promise<CanonicalProduct> {
    return parse(await this.request(`products/${id}`), canonicalProductSchema, "product");
  }

  public async updateProduct(id: number, version: string, product: CreateProductRequest): Promise<CanonicalProduct> {
    return parse(await this.request(`products/${id}`, this.json("PUT", { expected_version: version, product }), true), canonicalProductSchema, "product");
  }

  public async trashProduct(id: number, version: string): Promise<void> {
    const params = new URLSearchParams({ expected_version: version });
    parse(await this.request(`products/${id}?${params}`, { method: "DELETE" }, true), trashedProductSchema, "trashed product");
  }

  public async duplicateProduct(id: number): Promise<CreateProductRequest> {
    return parse(await this.request(`products/${id}/duplicate`), simpleProductFieldsSchema, "duplicate prefill");
  }

  public async searchProducts(options: SearchOptions): Promise<ProductPage> {
    return parse(await this.request(`products?${queryString(options)}`, { signal: options.signal }), productPageSchema, "products");
  }

  public async getOperation(id: string): Promise<OperationResult> {
    return parse(await this.request(`operations/${encodeURIComponent(id)}`), operationResultSchema, "operation");
  }

  public async listOperations(options: SearchOptions): Promise<OperationPage> {
    return parse(await this.request(`operations?${queryString(options)}`, { signal: options.signal }), operationPageSchema, "operations");
  }

  public async retryOperation(id: string): Promise<OperationResult> {
    return parse(await this.request(`operations/${encodeURIComponent(id)}/retry`, this.json("POST", {}), true), operationResultSchema, "operation");
  }

  public async dismissOperation(id: string): Promise<void> {
    await this.request(`operations/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  public async getPreferences(): Promise<WorkspacePreferences> {
    return parse(await this.request("preferences"), preferencesSchema, "preferences");
  }

  public async updatePreferences(preferences: Partial<WorkspacePreferences>): Promise<WorkspacePreferences> {
    return parse(await this.request("preferences", this.json("PUT", preferences)), preferencesSchema, "preferences");
  }

  public searchCategories(query: string, signal?: AbortSignal): Promise<CategoryPage> {
    return this.searchTerms("categories", query, signal);
  }

  public searchTags(query: string, signal?: AbortSignal): Promise<CategoryPage> {
    return this.searchTerms("tags", query, signal);
  }

  public searchShippingClasses(query: string, signal?: AbortSignal): Promise<CategoryPage> {
    return this.searchTerms("shipping-classes", query, signal);
  }

  private async searchTerms(path: string, query: string, signal?: AbortSignal): Promise<CategoryPage> {
    const params = new URLSearchParams({ page: "1", per_page: "20", search: query });
    return parse(await this.request(`${path}?${params}`, { signal }), termPageSchema, "product terms");
  }

  private json(method: string, body: unknown, headers: Record<string, string> = {}): RequestInit {
    return { body: JSON.stringify(body), headers: { "Content-Type": "application/json", ...headers }, method };
  }

  private async request(path: string, init: RequestInit = {}, outcomeUncertain = false): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${this.host.restUrl}${path}`, {
        ...init,
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-WP-Nonce": this.host.nonce, ...init.headers },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new WorkspaceApiError("ypw_network_error", "The server response was not received.", 0, {}, outcomeUncertain);
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (isRecord(payload) && isRecord(payload.data) && typeof payload.data.state === "string") return payload;
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
