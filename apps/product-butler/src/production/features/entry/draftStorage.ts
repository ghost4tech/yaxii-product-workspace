import type { ProductDraft } from "./productDraft";

const STORAGE_KEY = "ypw.product-draft.v1";

export type DraftReadResult =
  | { kind: "empty" }
  | { draft: ProductDraft; kind: "loaded" }
  | { kind: "error" };

export type DraftSaveResult = { kind: "saved" } | { kind: "error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDraft(value: unknown): ProductDraft | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = value.status;
  const stringKeys = [
    "category",
    "longDescription",
    "name",
    "regularPrice",
    "salePrice",
    "shortDescription",
    "sku",
    "stockQuantity",
    "weight",
  ] as const;

  if (status !== "draft" && status !== "publish") {
    return null;
  }

  if (stringKeys.some((key) => typeof value[key] !== "string")) {
    return null;
  }

  return {
    category: String(value.category),
    longDescription: String(value.longDescription),
    name: String(value.name),
    regularPrice: String(value.regularPrice),
    salePrice: String(value.salePrice),
    shortDescription: String(value.shortDescription),
    sku: String(value.sku),
    status,
    stockQuantity: String(value.stockQuantity),
    weight: String(value.weight),
  };
}

export class SessionDraftStorage {
  public clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  public read(): DraftReadResult {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { kind: "empty" };
      }

      const parsed: unknown = JSON.parse(stored);
      if (!isRecord(parsed) || parsed.version !== 1) {
        return { kind: "error" };
      }

      const draft = parseDraft(parsed.draft);
      return draft ? { draft, kind: "loaded" } : { kind: "error" };
    } catch {
      return { kind: "error" };
    }
  }

  public save(draft: ProductDraft): DraftSaveResult {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, version: 1 }));
      return { kind: "saved" };
    } catch {
      return { kind: "error" };
    }
  }
}
