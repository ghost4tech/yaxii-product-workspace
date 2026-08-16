import { describe, expect, it } from "vitest";
import type { VariableAttribute } from "../../domain/variableProducts";
import {
  combinationFingerprint,
  generateVariationCombinations,
  projectedCombinationCount,
  validateVariationPlan,
  VariablePlanError,
} from "./combinationGenerator";

const attributes = (): VariableAttribute[] => [
  {
    attributeId: 7, key: "global:7", name: "Color", optionIds: [101, 102], position: 0,
    source: "global", taxonomy: "pa_color", variation: true, visible: true,
  },
  {
    key: "custom:size", name: "Size", options: ["S", "M", "L"], position: 1,
    source: "custom", variation: true, visible: true,
  },
];

describe("variable combination generation", () => {
  it("generates six concrete color and size combinations", () => {
    let nextId = 0;
    const combinations = generateVariationCombinations(attributes(), [], () => `combo-${++nextId}`);

    expect(projectedCombinationCount(attributes())).toBe(6);
    expect(combinations).toHaveLength(6);
    expect(combinations.map((combination) => combinationFingerprint(combination.selections))).toEqual([
      "global:7=t:101|custom:size=o:S",
      "global:7=t:101|custom:size=o:M",
      "global:7=t:101|custom:size=o:L",
      "global:7=t:102|custom:size=o:S",
      "global:7=t:102|custom:size=o:M",
      "global:7=t:102|custom:size=o:L",
    ]);
  });

  it("keeps commercial values and client identity for unchanged combinations", () => {
    let sequence = 0;
    const first = generateVariationCombinations(attributes(), [], () => `stable-${++sequence}`);
    first[0] = { ...first[0]!, regularPrice: "19.99", sku: "BLACK-S", stockQuantity: 3 };
    const regenerated = generateVariationCombinations(attributes(), first, () => "new-id");

    expect(regenerated[0]).toMatchObject({ clientId: "stable-1", regularPrice: "19.99", sku: "BLACK-S", stockQuantity: 3 });
    expect(regenerated[1]!.clientId).toBe("stable-2");
  });

  it("does not project visible attributes that are not used for variations", () => {
    const withMaterial: VariableAttribute[] = [
      ...attributes(),
      { key: "custom:material", name: "Material", options: ["Cotton", "Wool"], position: 2, source: "custom", variation: false, visible: true },
    ];
    expect(projectedCombinationCount(withMaterial)).toBe(6);
    expect(generateVariationCombinations(withMaterial, [], () => crypto.randomUUID())).toHaveLength(6);
  });

  it("rejects plans beyond the synchronous save limit before rows", () => {
		const tooLarge: VariableAttribute[] = ["color", "size", "material", "style"].map((name, position) => ({
      key: `custom:${name}`, name, options: ["1", "2", "3", "4"], position,
      source: "custom" as const, variation: true, visible: true,
    }));

		expect(projectedCombinationCount(tooLarge)).toBe(256);
		expect(() => generateVariationCombinations(tooLarge)).toThrow(VariablePlanError);
		expect(() => validateVariationPlan(tooLarge, [])).toThrow(VariablePlanError);
  });

  it("rejects duplicate and unknown concrete combinations", () => {
    let nextId = 0;
    const combinations = generateVariationCombinations(attributes(), [], () => `id-${++nextId}`);
    combinations[1] = { ...combinations[1]!, selections: combinations[0]!.selections };
    expect(() => validateVariationPlan(attributes(), combinations)).toThrow(VariablePlanError);

    const unknown = generateVariationCombinations(attributes(), [], () => `other-${++nextId}`);
    unknown[0] = {
      ...unknown[0]!,
      selections: [{ attributeKey: "global:7", termId: 999 }, unknown[0]!.selections[1]!],
    };
    expect(() => validateVariationPlan(attributes(), unknown)).toThrow(VariablePlanError);
  });

  it("keeps global IDs distinct from custom option text", () => {
    const [global, custom] = attributes();
    expect(global).toMatchObject({ attributeId: 7, optionIds: [101, 102], taxonomy: "pa_color" });
    expect(custom).toMatchObject({ options: ["S", "M", "L"], source: "custom" });
  });

  it("validates prices, managed stock, image references, and unique SKUs", () => {
    let nextId = 0;
    const combinations = generateVariationCombinations(attributes(), [], () => `commercial-${++nextId}`)
      .map((combination, index) => ({ ...combination, regularPrice: String(20 + index), sku: `SKU-${index}` }));
    expect(() => validateVariationPlan(attributes(), combinations)).not.toThrow();

    expect(() => validateVariationPlan(attributes(), combinations.map((combination, index) => (
      index === 0 ? { ...combination, salePrice: "999" } : combination
    )))).toThrow(VariablePlanError);
    expect(() => validateVariationPlan(attributes(), combinations.map((combination, index) => (
      index === 0 ? { ...combination, manageStock: true, stockQuantity: null } : combination
    )))).toThrow(VariablePlanError);
    expect(() => validateVariationPlan(attributes(), combinations.map((combination, index) => (
      index === 1 ? { ...combination, sku: "SKU-0" } : combination
    )))).toThrow(VariablePlanError);
  });
});
