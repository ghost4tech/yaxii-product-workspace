import type { StockStatus } from "./products";

export const VARIABLE_PRODUCT_LIMITS = {
  attributes: 5,
  combinations: 50,
  optionsPerAttribute: 20,
} as const;

interface VariableAttributeBase {
  key: string;
  name: string;
  position: number;
  variation: boolean;
  visible: boolean;
}

export interface GlobalVariableAttribute extends VariableAttributeBase {
  attributeId: number;
  optionIds: number[];
  source: "global";
  taxonomy: `pa_${string}`;
}

export interface CustomVariableAttribute extends VariableAttributeBase {
  options: string[];
  source: "custom";
}

export type VariableAttribute = GlobalVariableAttribute | CustomVariableAttribute;

export type VariationSelection =
  | { attributeKey: string; termId: number }
  | { attributeKey: string; option: string };

export interface VariationCombination {
  clientId: string;
  enabled: boolean;
  imageId: number;
  manageStock: boolean;
  regularPrice: string;
  salePrice: string | null;
  selections: VariationSelection[];
  sku: string;
  stockQuantity: number | null;
  stockStatus: StockStatus;
  variationId: number;
}

export interface VariableProductPlan {
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  projectedCount: number;
}

export interface AttributeCatalogItem {
  id: number;
  name: string;
  orderBy: string;
  taxonomy: `pa_${string}`;
}

export interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
}
