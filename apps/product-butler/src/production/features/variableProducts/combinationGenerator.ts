import { generateSecureUuidV4 } from "../../core/security/secureUuid";
import {
  VARIABLE_PRODUCT_LIMITS,
  type VariableAttribute,
  type VariationCombination,
  type VariationSelection,
} from "../../domain/variableProducts";

export class VariablePlanError extends Error {
  public constructor(public readonly fields: Record<string, string>) {
    super("The variable-product plan is invalid.");
  }
}

export function projectedCombinationCount(attributes: VariableAttribute[]): number {
  let count = 1;
  let used = 0;
  for (const attribute of attributes) {
    if (!attribute.variation) continue;
    used += 1;
    count *= optionCount(attribute);
  }
  return used === 0 ? 0 : count;
}

export function generateVariationCombinations(
  attributes: VariableAttribute[],
  existing: VariationCombination[] = [],
  createId: () => string = generateSecureUuidV4,
): VariationCombination[] {
  validateAttributes(attributes);
  const projected = projectedCombinationCount(attributes);
  if (projected === 0) fail("attributes", "Use at least one attribute for variations.");
  if (projected > VARIABLE_PRODUCT_LIMITS.combinations) {
    fail("combinations", `${projected} combinations exceed the Free limit of ${VARIABLE_PRODUCT_LIMITS.combinations}.`);
  }

  const prior = new Map(existing.map((combination) => [combinationFingerprint(combination.selections), combination]));
  return expectedSelections(attributes).map((selections) => {
    const previous = prior.get(combinationFingerprint(selections));
    return previous ? { ...previous, selections } : emptyCombination(createId(), selections);
  });
}

export function validateVariationPlan(
  attributes: VariableAttribute[],
  combinations: VariationCombination[],
): void {
  validateAttributes(attributes);
  const projected = projectedCombinationCount(attributes);
  if (projected === 0) fail("attributes", "Use at least one attribute for variations.");
  if (projected > VARIABLE_PRODUCT_LIMITS.combinations) {
    fail("combinations", `The plan exceeds ${VARIABLE_PRODUCT_LIMITS.combinations} combinations.`);
  }
  const expected = new Set(expectedSelections(attributes).map(combinationFingerprint));
  if (combinations.length !== expected.size) {
    fail("combinations", "Generate every projected combination before saving.");
  }

  const ids = new Set<string>();
  const actual = new Set<string>();
  combinations.forEach((combination, index) => {
    if (ids.has(combination.clientId)) fail(`combinations.${index}.clientId`, "Combination IDs must be unique.");
    ids.add(combination.clientId);
    const normalized = normalizeSelections(attributes, combination.selections, index);
    const fingerprint = combinationFingerprint(normalized);
    if (!expected.has(fingerprint)) fail(`combinations.${index}.selections`, "Unknown attribute option.");
    if (actual.has(fingerprint)) fail(`combinations.${index}.selections`, "Duplicate combination.");
    actual.add(fingerprint);
    validateCommercialFields(combination, index);
  });
  const skus = combinations.map((combination) => combination.sku.trim().toLocaleLowerCase()).filter(Boolean);
  if (new Set(skus).size !== skus.length) fail("combinations", "Variation SKUs must be unique.");
}

function validateCommercialFields(combination: VariationCombination, index: number): void {
  const price = Number(combination.regularPrice);
  if (combination.enabled && (combination.regularPrice.trim() === "" || !Number.isFinite(price) || price < 0)) {
    fail(`combinations.${index}.regularPrice`, "Enabled variations require a valid price.");
  }
  if (combination.salePrice !== null) {
    const sale = Number(combination.salePrice);
    if (combination.salePrice.trim() === "" || !Number.isFinite(sale) || sale < 0 || sale > price) {
      fail(`combinations.${index}.salePrice`, "Sale price must be valid and cannot exceed the regular price.");
    }
  }
  if (combination.manageStock && (!Number.isInteger(combination.stockQuantity) || (combination.stockQuantity ?? -1) < 0)) {
    fail(`combinations.${index}.stockQuantity`, "Managed stock requires a non-negative whole number.");
  }
  if (!Number.isInteger(combination.imageId) || combination.imageId < 0) {
    fail(`combinations.${index}.imageId`, "Variation image reference is invalid.");
  }
}

export function combinationFingerprint(selections: VariationSelection[]): string {
  return selections.map((selection) => (
    "termId" in selection
      ? `${selection.attributeKey}=t:${selection.termId}`
      : `${selection.attributeKey}=o:${selection.option}`
  )).join("|");
}

function expectedSelections(attributes: VariableAttribute[]): VariationSelection[][] {
  let rows: VariationSelection[][] = [[]];
  for (const attribute of [...attributes].sort((left, right) => left.position - right.position)) {
    if (!attribute.variation) continue;
    const selections = attribute.source === "global"
      ? attribute.optionIds.map((termId) => ({ attributeKey: attribute.key, termId }))
      : attribute.options.map((option) => ({ attributeKey: attribute.key, option }));
    rows = rows.flatMap((row) => selections.map((selection) => [...row, selection]));
  }
  return rows[0]?.length ? rows : [];
}

function normalizeSelections(
  attributes: VariableAttribute[],
  selections: VariationSelection[],
  index: number,
): VariationSelection[] {
  const variationAttributes = [...attributes]
    .filter((attribute) => attribute.variation)
    .sort((left, right) => left.position - right.position);
  if (selections.length !== variationAttributes.length) {
    fail(`combinations.${index}.selections`, "Select one option from every variation attribute.");
  }
  const selected = new Map(selections.map((selection) => [selection.attributeKey, selection]));
  if (selected.size !== selections.length) fail(`combinations.${index}.selections`, "Duplicate attribute reference.");
  return variationAttributes.map((attribute) => {
    const selection = selected.get(attribute.key);
    if (!selection || !hasExactSelectionFields(attribute, selection) || !selectionMatches(attribute, selection)) {
      fail(`combinations.${index}.selections`, "Unknown attribute or option reference.");
    }
    return selection;
  });
}

function validateAttributes(attributes: VariableAttribute[]): void {
  if (attributes.length === 0 || attributes.length > VARIABLE_PRODUCT_LIMITS.attributes) {
    fail("attributes", `Add between one and ${VARIABLE_PRODUCT_LIMITS.attributes} attributes.`);
  }
  const keys = new Set<string>();
  const identities = new Set<string>();
  const positions = new Set<number>();
  attributes.forEach((attribute, index) => {
    const identity = attribute.source === "global"
      ? `global:${attribute.attributeId}`
      : `custom:${attribute.name.trim().toLocaleLowerCase()}`;
    if (keys.has(attribute.key) || identities.has(identity)) fail(`attributes.${index}`, "Duplicate attribute.");
    if (positions.has(attribute.position)) fail(`attributes.${index}.position`, "Duplicate attribute position.");
    if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(attribute.key)) fail(`attributes.${index}.key`, "Invalid attribute key.");
    if (!attribute.name.trim() || attribute.name.trim().length > 40) fail(`attributes.${index}.name`, "Invalid attribute name.");
    if (typeof attribute.visible !== "boolean" || typeof attribute.variation !== "boolean") {
      fail(`attributes.${index}`, "Attribute visibility and variation use must be true or false.");
    }
    if (!Number.isInteger(attribute.position) || attribute.position < 0 || attribute.position >= VARIABLE_PRODUCT_LIMITS.attributes) {
      fail(`attributes.${index}.position`, "Invalid attribute position.");
    }
    if (attribute.source === "global" && (
      !Number.isInteger(attribute.attributeId) || attribute.attributeId <= 0 || !/^pa_[a-z0-9_-]+$/.test(attribute.taxonomy)
    )) fail(`attributes.${index}`, "Invalid global WooCommerce attribute reference.");
    keys.add(attribute.key);
    identities.add(identity);
    positions.add(attribute.position);
    validateOptions(attribute, index);
  });
}

function validateOptions(attribute: VariableAttribute, index: number): void {
  const options = attribute.source === "global" ? attribute.optionIds : attribute.options;
  if (options.length === 0 || options.length > VARIABLE_PRODUCT_LIMITS.optionsPerAttribute) {
    fail(`attributes.${index}.options`, "Select between one and 20 options.");
  }
  if (attribute.source === "custom" && attribute.options.some((option) => typeof option !== "string")) {
    fail(`attributes.${index}.options`, "Custom options must be text values.");
  }
  const identities = options.map((option) => String(option).trim().toLocaleLowerCase());
  if (new Set(identities).size !== identities.length || identities.some((option) => option === "")) {
    fail(`attributes.${index}.options`, "Options must be unique and non-empty.");
  }
  if (attribute.source === "global" && attribute.optionIds.some((termId) => !Number.isInteger(termId) || termId <= 0)) {
    fail(`attributes.${index}.options`, "Global options require positive term IDs.");
  }
  if (attribute.source === "custom" && attribute.options.some((option) => option.trim().length > 100)) {
    fail(`attributes.${index}.options`, "Custom options must be 100 characters or fewer.");
  }
}

function hasExactSelectionFields(attribute: VariableAttribute, selection: VariationSelection): boolean {
  const keys = Object.keys(selection);
  const sourceKey = attribute.source === "global" ? "termId" : "option";
  return keys.length === 2 && keys.includes("attributeKey") && keys.includes(sourceKey);
}

function selectionMatches(attribute: VariableAttribute, selection: VariationSelection): boolean {
  return attribute.source === "global"
    ? "termId" in selection && attribute.optionIds.includes(selection.termId)
    : "option" in selection && attribute.options.includes(selection.option);
}

function optionCount(attribute: VariableAttribute): number {
  return attribute.source === "global" ? attribute.optionIds.length : attribute.options.length;
}

function emptyCombination(clientId: string, selections: VariationSelection[]): VariationCombination {
  return {
    clientId, enabled: true, imageId: 0, manageStock: false, regularPrice: "", salePrice: null,
    selections, sku: "", stockQuantity: null, stockStatus: "instock", variationId: 0,
  };
}

function fail(field: string, message: string): never {
  throw new VariablePlanError({ [field]: message });
}
