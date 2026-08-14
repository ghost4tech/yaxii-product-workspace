import type { VariableProductRequest } from "../domain/products";
import type { VariableAttribute, VariationCombination } from "../domain/variableProducts";

function attributePayload(attribute: VariableAttribute) {
  const common = {
    key: attribute.key,
    name: attribute.name,
    position: attribute.position,
    source: attribute.source,
    variation: attribute.variation,
    visible: attribute.visible,
  };
  return attribute.source === "global"
    ? {
      ...common,
      attribute_id: attribute.attributeId,
      option_ids: attribute.optionIds,
      taxonomy: attribute.taxonomy,
    }
    : { ...common, options: attribute.options };
}

function combinationPayload(combination: VariationCombination) {
  return {
    client_id: combination.clientId,
    enabled: combination.enabled,
    image_id: combination.imageId,
    manage_stock: combination.manageStock,
    regular_price: combination.regularPrice,
    sale_price: combination.salePrice,
    selections: combination.selections.map((selection) => (
      "termId" in selection
        ? { attribute_key: selection.attributeKey, term_id: selection.termId }
        : { attribute_key: selection.attributeKey, option: selection.option }
    )),
    sku: combination.sku,
    stock_quantity: combination.stockQuantity,
    stock_status: combination.stockStatus,
    variation_id: combination.variationId,
  };
}

export function variablePayload(request: VariableProductRequest) {
  return {
    attributes: request.attributes.map(attributePayload),
    combinations: request.combinations.map(combinationPayload),
    product: request.product,
  };
}
