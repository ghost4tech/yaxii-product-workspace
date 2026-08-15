import { generateSecureUuidV4 } from "../../core/security/secureUuid";
import {
  VARIABLE_PRODUCT_LIMITS,
  type VariableAttribute,
  type VariationCombination,
  type VariationSelection,
} from "../../domain/variableProducts";
import { __, sprintf } from "../../core/i18n/wordpress";

export class VariablePlanError extends Error {
  public constructor(public readonly fields: Record<string, string>) {
    super(__("The variable-product plan is invalid.", "yaxii-product-workspace"));
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
  if (projected === 0) fail("attributes", __("Use at least one attribute for variations.", "yaxii-product-workspace"));
  if (projected > VARIABLE_PRODUCT_LIMITS.combinations) {
    /* translators: 1: projected combination count, 2: maximum combination count. */
    fail("combinations", sprintf(__("%1$s combinations exceed the Free limit of %2$s.", "yaxii-product-workspace"), projected, VARIABLE_PRODUCT_LIMITS.combinations));
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
  if (projected === 0) fail("attributes", __("Use at least one attribute for variations.", "yaxii-product-workspace"));
  if (projected > VARIABLE_PRODUCT_LIMITS.combinations) {
    /* translators: %s: maximum combination count. */
    fail("combinations", sprintf(__("The plan exceeds %s combinations.", "yaxii-product-workspace"), VARIABLE_PRODUCT_LIMITS.combinations));
  }
  const expected = new Set(expectedSelections(attributes).map(combinationFingerprint));
  if (combinations.length !== expected.size) {
    fail("combinations", __("Generate every projected combination before saving.", "yaxii-product-workspace"));
  }

  const ids = new Set<string>();
  const actual = new Set<string>();
  combinations.forEach((combination, index) => {
    if (ids.has(combination.clientId)) fail(`combinations.${index}.clientId`, __("Combination IDs must be unique.", "yaxii-product-workspace"));
    ids.add(combination.clientId);
    const normalized = normalizeSelections(attributes, combination.selections, index);
    const fingerprint = combinationFingerprint(normalized);
    if (!expected.has(fingerprint)) fail(`combinations.${index}.selections`, __("Unknown attribute option.", "yaxii-product-workspace"));
    if (actual.has(fingerprint)) fail(`combinations.${index}.selections`, __("Duplicate combination.", "yaxii-product-workspace"));
    actual.add(fingerprint);
    validateCommercialFields(combination, index);
  });
  const skus = combinations.map((combination) => combination.sku.trim().toLocaleLowerCase()).filter(Boolean);
  if (new Set(skus).size !== skus.length) fail("combinations", __("Variation SKUs must be unique.", "yaxii-product-workspace"));
}

function validateCommercialFields(combination: VariationCombination, index: number): void {
  const price = Number(combination.regularPrice);
  if (combination.enabled && (combination.regularPrice.trim() === "" || !Number.isFinite(price) || price < 0)) {
    fail(`combinations.${index}.regularPrice`, __("Enabled variations require a valid price.", "yaxii-product-workspace"));
  }
  if (combination.salePrice !== null) {
    const sale = Number(combination.salePrice);
    if (combination.salePrice.trim() === "" || !Number.isFinite(sale) || sale < 0 || sale > price) {
      fail(`combinations.${index}.salePrice`, __("Sale price must be valid and cannot exceed the regular price.", "yaxii-product-workspace"));
    }
  }
  if (combination.manageStock && (!Number.isInteger(combination.stockQuantity) || (combination.stockQuantity ?? -1) < 0)) {
    fail(`combinations.${index}.stockQuantity`, __("Managed stock requires a non-negative whole number.", "yaxii-product-workspace"));
  }
  if (!Number.isInteger(combination.imageId) || combination.imageId < 0) {
    fail(`combinations.${index}.imageId`, __("Variation image reference is invalid.", "yaxii-product-workspace"));
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
    fail(`combinations.${index}.selections`, __("Select one option from every variation attribute.", "yaxii-product-workspace"));
  }
  const selected = new Map(selections.map((selection) => [selection.attributeKey, selection]));
  if (selected.size !== selections.length) fail(`combinations.${index}.selections`, __("Duplicate attribute reference.", "yaxii-product-workspace"));
  return variationAttributes.map((attribute) => {
    const selection = selected.get(attribute.key);
    if (!selection || !hasExactSelectionFields(attribute, selection) || !selectionMatches(attribute, selection)) {
      fail(`combinations.${index}.selections`, __("Unknown attribute or option reference.", "yaxii-product-workspace"));
    }
    return selection;
  });
}

function validateAttributes(attributes: VariableAttribute[]): void {
  if (attributes.length === 0 || attributes.length > VARIABLE_PRODUCT_LIMITS.attributes) {
    /* translators: %s: maximum attribute count. */
    fail("attributes", sprintf(__("Add between one and %s attributes.", "yaxii-product-workspace"), VARIABLE_PRODUCT_LIMITS.attributes));
  }
  const keys = new Set<string>();
  const identities = new Set<string>();
  const positions = new Set<number>();
  attributes.forEach((attribute, index) => {
    const identity = attribute.source === "global"
      ? `global:${attribute.attributeId}`
      : `custom:${attribute.name.trim().toLocaleLowerCase()}`;
    if (keys.has(attribute.key) || identities.has(identity)) fail(`attributes.${index}`, __("Duplicate attribute.", "yaxii-product-workspace"));
    if (positions.has(attribute.position)) fail(`attributes.${index}.position`, __("Duplicate attribute position.", "yaxii-product-workspace"));
    if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(attribute.key)) fail(`attributes.${index}.key`, __("Invalid attribute key.", "yaxii-product-workspace"));
    if (!attribute.name.trim() || attribute.name.trim().length > 40) fail(`attributes.${index}.name`, __("Invalid attribute name.", "yaxii-product-workspace"));
    if (typeof attribute.visible !== "boolean" || typeof attribute.variation !== "boolean") {
      fail(`attributes.${index}`, __("Attribute visibility and variation use must be true or false.", "yaxii-product-workspace"));
    }
    if (!Number.isInteger(attribute.position) || attribute.position < 0 || attribute.position >= VARIABLE_PRODUCT_LIMITS.attributes) {
      fail(`attributes.${index}.position`, __("Invalid attribute position.", "yaxii-product-workspace"));
    }
    if (attribute.source === "global" && (
      !Number.isInteger(attribute.attributeId) || attribute.attributeId <= 0 || !/^pa_[a-z0-9_-]+$/.test(attribute.taxonomy)
    )) fail(`attributes.${index}`, __("Invalid global WooCommerce attribute reference.", "yaxii-product-workspace"));
    keys.add(attribute.key);
    identities.add(identity);
    positions.add(attribute.position);
    validateOptions(attribute, index);
  });
}

function validateOptions(attribute: VariableAttribute, index: number): void {
  const options = attribute.source === "global" ? attribute.optionIds : attribute.options;
  if (options.length === 0 || options.length > VARIABLE_PRODUCT_LIMITS.optionsPerAttribute) {
    fail(`attributes.${index}.options`, __("Select between one and 20 options.", "yaxii-product-workspace"));
  }
  if (attribute.source === "custom" && attribute.options.some((option) => typeof option !== "string")) {
    fail(`attributes.${index}.options`, __("Custom options must be text values.", "yaxii-product-workspace"));
  }
  const identities = options.map((option) => String(option).trim().toLocaleLowerCase());
  if (new Set(identities).size !== identities.length || identities.some((option) => option === "")) {
    fail(`attributes.${index}.options`, __("Options must be unique and non-empty.", "yaxii-product-workspace"));
  }
  if (attribute.source === "global" && attribute.optionIds.some((termId) => !Number.isInteger(termId) || termId <= 0)) {
    fail(`attributes.${index}.options`, __("Global options require positive term IDs.", "yaxii-product-workspace"));
  }
  if (attribute.source === "custom" && attribute.options.some((option) => option.trim().length > 100)) {
    fail(`attributes.${index}.options`, __("Custom options must be 100 characters or fewer.", "yaxii-product-workspace"));
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
