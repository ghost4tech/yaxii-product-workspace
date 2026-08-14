import type { StateStorage } from "zustand/middleware";
import type { ProductFormData, ProductImage } from "@/types/product";

export const DRAFT_SCHEMA_VERSION = 2;
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFT_BYTES = 300_000;

interface DraftEnvelope {
  payload: string;
  savedAt: number;
  schema: number;
}

export function createDraftStorage(storage: Storage, now = () => Date.now()): StateStorage {
  return {
    getItem: (name) => {
      try {
        const raw = storage.getItem(name);
        if (!raw) return null;
        const envelope = JSON.parse(raw) as DraftEnvelope;
        if (
          envelope.schema !== DRAFT_SCHEMA_VERSION
          || typeof envelope.payload !== "string"
          || !Number.isFinite(envelope.savedAt)
          || now() - envelope.savedAt > DRAFT_TTL_MS
        ) {
          try { storage.removeItem(name); } catch { /* Recovery storage is best effort. */ }
          return null;
        }
        return envelope.payload;
      } catch {
        try { storage.removeItem(name); } catch { /* Recovery storage is best effort. */ }
        return null;
      }
    },
    removeItem: (name) => {
      try { storage.removeItem(name); } catch { /* Recovery storage is best effort. */ }
    },
    setItem: (name, payload) => {
      if (new Blob([payload]).size > MAX_DRAFT_BYTES) {
        try { storage.removeItem(name); } catch { /* Recovery storage is best effort. */ }
        return;
      }
      const envelope: DraftEnvelope = { payload, savedAt: now(), schema: DRAFT_SCHEMA_VERSION };
      try { storage.setItem(name, JSON.stringify(envelope)); } catch { /* The live draft remains in memory. */ }
    },
  };
}

function recoverableImage(image: ProductImage): ProductImage | null {
  if (!image.wpMediaId || image.file || image.preview.startsWith("blob:")) return null;
  return {
    id: image.id,
    preview: image.preview.slice(0, 2048),
    wpMediaId: image.wpMediaId,
  };
}

export function sanitizeDraft(data: ProductFormData): ProductFormData {
  return {
    ...data,
    longDescription: data.longDescription.slice(0, 100_000),
    name: data.name.slice(0, 200),
    shortDescription: data.shortDescription.slice(0, 20_000),
    images: data.images.slice(0, 20).flatMap((image) => {
      const recovered = recoverableImage(image);
      return recovered ? [recovered] : [];
    }),
    variations: [],
    variableAttributes: data.variableAttributes.slice(0, 5),
    variationCombinations: data.variationCombinations.slice(0, 50),
  };
}
