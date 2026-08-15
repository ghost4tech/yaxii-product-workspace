import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Layers, Plus, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { AttributeEditor, GlobalAttributeSelect } from "@/components/variations/AttributeEditor";
import { VariationRow } from "@/components/variations/VariationRow";
import { Button } from "@/components/ui/button";
import { Explain, HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { generateSecureUuidV4 } from "@/production/core/security/secureUuid";
import {
  VARIABLE_PRODUCT_LIMITS, type AttributeCatalogItem, type AttributeTerm,
  type VariableAttribute, type VariationCombination, type VariationSelection,
} from "@/production/domain/variableProducts";
import {
  combinationFingerprint, generateVariationCombinations, projectedCombinationCount,
  VariablePlanError,
} from "@/production/features/variableProducts/combinationGenerator";
import type { ProductImage } from "@/types/product";
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

interface Props {
  attributes: VariableAttribute[];
  baseSku?: string;
  combinations: VariationCombination[];
  currency?: string;
  onAttributesChange: (attributes: VariableAttribute[]) => void;
  onCombinationsChange: (combinations: VariationCombination[]) => void;
  onUploadImage: (file: File) => Promise<ProductImage>;
}

function Step({ active, done, label, n }: { active: boolean; done: boolean; label: string; n: number }) {
  return <div className="flex min-w-0 items-center gap-1.5">
    <span className={cn(
      "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold",
      done ? "bg-success text-success-foreground" : active ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
    )}>{n}</span>
    <span className={cn("truncate text-[11px] font-medium", active || done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
  </div>;
}

export const VariationsEditor = forwardRef<HTMLDivElement, Props>(({
  attributes, baseSku = "", combinations, currency = "$", onAttributesChange,
  onCombinationsChange, onUploadImage,
}, ref) => {
  const { client } = useWorkspaceRuntime();
  const [catalog, setCatalog] = useState<AttributeCatalogItem[]>([]);
  const [terms, setTerms] = useState<Record<number, AttributeTerm[]>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<number, ProductImage>>({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    void client.listAttributes().then(setCatalog).catch(() => {
      setCatalog([]);
      setLookupError(__("Global attributes could not be loaded.", "yaxii-product-workspace"));
    });
  }, [client]);
  useEffect(() => {
    attributes.filter((attribute) => attribute.source === "global").forEach((attribute) => {
      if (terms[attribute.attributeId]) return;
      void client.listAttributeTerms(attribute.attributeId).then((items) => {
        setTerms((current) => ({ ...current, [attribute.attributeId]: items }));
      }).catch(() => {
        setTerms((current) => ({ ...current, [attribute.attributeId]: [] }));
        /* translators: %s: attribute name. */
        setLookupError(sprintf(__("Terms for %s could not be loaded.", "yaxii-product-workspace"), attribute.name));
      });
    });
  }, [attributes, client, terms]);
  useEffect(() => {
    const ids = [...new Set(combinations.map((combination) => combination.imageId).filter((id) => id > 0))];
    ids.filter((id) => !imagePreviews[id]).forEach((id) => {
      void client.getMedia(id).then((media) => setImagePreviews((current) => ({
        ...current, [id]: { id: `wp-${id}`, preview: media.url, wpMediaId: id },
      }))).catch(() => setLookupError(__("A variation image preview could not be loaded. Its attachment is unchanged.", "yaxii-product-workspace")));
    });
  }, [client, combinations, imagePreviews]);

  const ready = attributes.filter((attribute) => attribute.name.trim()
    && (attribute.source === "global" ? attribute.optionIds.length : attribute.options.length));
  const expected = useMemo(() => projectedCombinationCount(attributes), [attributes]);
  const overLimit = expected > VARIABLE_PRODUCT_LIMITS.combinations;
  const usedGlobalIds = new Set(attributes.filter((attribute) => attribute.source === "global").map((attribute) => attribute.attributeId));
  const availableGlobals = catalog.filter((attribute) => !usedGlobalIds.has(attribute.id));
  const missingPrices = combinations.filter((combination) => combination.enabled && !combination.regularPrice).length;
  const enabledCount = combinations.filter((combination) => combination.enabled).length;
  const stale = useMemo(() => {
    if (!ready.length || overLimit) return false;
    try {
      const generated = generateVariationCombinations(attributes, combinations, generateSecureUuidV4);
      const current = new Set(combinations.map((combination) => combinationFingerprint(combination.selections)));
      return generated.length !== combinations.length
        || generated.some((combination) => !current.has(combinationFingerprint(combination.selections)));
    } catch {
      return true;
    }
  }, [attributes, combinations, overLimit, ready.length]);
  const previewFormula = ready.map((attribute) => {
    const count = attribute.source === "global" ? attribute.optionIds.length : attribute.options.length;
    return `${count} ${attribute.name.trim()}`;
  }).join(" × ");

  const patchAttribute = (key: string, next: VariableAttribute) => {
    onAttributesChange(attributes.map((attribute) => attribute.key === key ? next : attribute));
  };
  const removeAttribute = (key: string) => onAttributesChange(attributes
    .filter((attribute) => attribute.key !== key)
    .map((attribute, position) => ({ ...attribute, position })));
  const addCustom = () => {
    if (attributes.length >= VARIABLE_PRODUCT_LIMITS.attributes) return;
    onAttributesChange([...attributes, {
      key: `custom:attribute-${generateSecureUuidV4().slice(0, 8)}`,
      name: "", options: [], position: attributes.length, source: "custom", variation: true, visible: true,
    }]);
  };
  const addGlobal = (attribute: AttributeCatalogItem) => onAttributesChange([...attributes, {
    attributeId: attribute.id, key: `global:${attribute.id}`, name: attribute.name, optionIds: [],
    position: attributes.length, source: "global", taxonomy: attribute.taxonomy, variation: true, visible: true,
  }]);
  const generate = useCallback(() => {
    try {
      onCombinationsChange(generateVariationCombinations(attributes, combinations));
      setError("");
    } catch (reason) {
      setError(reason instanceof VariablePlanError
        ? Object.values(reason.fields)[0] ?? reason.message : __("Combinations could not be generated.", "yaxii-product-workspace"));
    }
  }, [attributes, combinations, onCombinationsChange]);
  const patchCombination = (clientId: string, updates: Partial<VariationCombination>) => {
    onCombinationsChange(combinations.map((combination) => combination.clientId === clientId
      ? { ...combination, ...updates } : combination));
  };
  const selectionLabels = (selections: VariationSelection[]) => selections.map((selection) => {
    const attribute = attributes.find((item) => item.key === selection.attributeKey);
    if (!attribute) return __("Unknown", "yaxii-product-workspace");
    if ("option" in selection) return selection.option;
    return attribute.source === "global"
      ? terms[attribute.attributeId]?.find((term) => term.id === selection.termId)?.name ?? String(selection.termId)
      : __("Unknown", "yaxii-product-workspace");
  });
  const autoSku = () => onCombinationsChange(combinations.map((combination) => ({
    ...combination,
    sku: [baseSku.trim() || "SKU", ...selectionLabels(combination.selections)
      .map((label) => label.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8))].join("-"),
  })));

  return <div ref={ref} className="stack">
    <div className="surface-inset flex flex-wrap items-center gap-3 px-3 py-2">
      <Step n={1} label={__("Attributes", "yaxii-product-workspace")} active={!ready.length} done={ready.length > 0} /><span className="text-muted-foreground/40 rtl:-scale-x-100">→</span>
      <Step n={2} label={__("Preview", "yaxii-product-workspace")} active={ready.length > 0 && !combinations.length} done={combinations.length > 0} /><span className="text-muted-foreground/40 rtl:-scale-x-100">→</span>
      <Step n={3} label={__("Variations", "yaxii-product-workspace")} active={combinations.length > 0} done={combinations.length > 0 && !missingPrices} />
      <HelpTip className="ms-auto" side="left">{__("Pick attributes, preview how many combinations they produce, then set the price, SKU, stock, and image on each concrete variation.", "yaxii-product-workspace")}</HelpTip>
    </div>
    <div className="stack">
      {attributes.map((attribute) => <AttributeEditor key={attribute.key} attribute={attribute}
        terms={attribute.source === "global" ? terms[attribute.attributeId] ?? [] : []}
        onChange={(next) => patchAttribute(attribute.key, next)} onRemove={() => removeAttribute(attribute.key)} />)}
      <div className="flex flex-wrap items-center gap-2">
        <Explain tip={__("Reuse an attribute that already exists in your WooCommerce store, with its real terms.", "yaxii-product-workspace")}>
          <div className="min-w-0"><GlobalAttributeSelect available={availableGlobals}
            disabled={attributes.length >= VARIABLE_PRODUCT_LIMITS.attributes} onSelect={addGlobal} /></div>
        </Explain>
        <Explain tip={__("Create an attribute used only on this product — nothing is added to store taxonomies.", "yaxii-product-workspace")}>
          <Button type="button" variant="outline" size="sm" onClick={addCustom}
            disabled={attributes.length >= VARIABLE_PRODUCT_LIMITS.attributes} className="h-8 text-[12px]">
            <Plus className="me-1.5 h-3.5 w-3.5" /> {__("Custom attribute", "yaxii-product-workspace")}
          </Button>
        </Explain>
        <span className="ms-auto text-[11px] tabular-nums text-muted-foreground">{
          /* translators: 1: current attribute count, 2: maximum attribute count. */
          sprintf(_n("%1$s/%2$s attribute", "%1$s/%2$s attributes", attributes.length, "yaxii-product-workspace"), attributes.length, VARIABLE_PRODUCT_LIMITS.attributes)
        }</span>
      </div>
    </div>
    {ready.length > 0 && <div className={cn(
      "flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5",
      overLimit ? "border-warning/40 bg-warning/[0.07]" : "border-info/25 bg-info/[0.06]",
    )}>
      <Layers className="h-4 w-4 shrink-0 text-info" /><p className="min-w-0 text-[12px]">
        <span className="font-mono">{previewFormula}</span><span className="text-muted-foreground"> = </span>
        <span className="font-semibold tabular-nums">{
          /* translators: %s: variation count. */
          sprintf(_n("%s variation", "%s variations", expected, "yaxii-product-workspace"), expected)
        }</span>
      </p>
      <HelpTip>{__("Price, SKU, stock, and image belong to each concrete WooCommerce combination.", "yaxii-product-workspace")}</HelpTip>
      <Button type="button" size="sm" variant={stale ? "default" : "outline"} onClick={generate}
        disabled={overLimit} className="ms-auto h-8 text-[12px]">
        {combinations.length ? <RefreshCw className="me-1.5 h-3.5 w-3.5" /> : <Sparkles className="me-1.5 h-3.5 w-3.5" />}
        {combinations.length ? __("Regenerate combinations", "yaxii-product-workspace") : __("Generate combinations", "yaxii-product-workspace")}
      </Button>
      {overLimit && <p className="flex w-full items-center gap-1.5 text-[11px] text-warning">
        <AlertTriangle className="h-3.5 w-3.5" /> {
          /* translators: %s: maximum combination count. */
          sprintf(__("Over the %s-combination limit. Remove options to continue.", "yaxii-product-workspace"), VARIABLE_PRODUCT_LIMITS.combinations)
        }
      </p>}
    </div>}
    {combinations.length > 0 && <div className="overflow-hidden rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-foreground/70">{__("Variations", "yaxii-product-workspace")}</h4>
        <span className="text-[11px] tabular-nums text-muted-foreground">{
          /* translators: 1: enabled variation count, 2: total variation count. */
          sprintf(__("%1$s of %2$s enabled", "yaxii-product-workspace"), enabledCount, combinations.length)
        }</span>
        {missingPrices > 0 && <span className="text-[11px] text-warning">· {
          /* translators: %s: number of variations missing a price. */
          sprintf(_n("%s variation missing a price", "%s variations missing a price", missingPrices, "yaxii-product-workspace"), missingPrices)
        }</span>}
        <div className="ms-auto flex items-center gap-2">
          <div className="input-group w-[8.5rem]"><span className="input-affix">{currency}</span>
            <input type="number" step="0.01" placeholder={__("Set all", "yaxii-product-workspace")} className="font-mono" dir="ltr" value={bulkPrice}
              onChange={(event) => setBulkPrice(event.target.value)} /></div>
          <Explain tip={__("Applies this price to every enabled variation. You can still override individual ones.", "yaxii-product-workspace")}>
            <Button type="button" size="sm" variant="outline" disabled={!bulkPrice}
              onClick={() => onCombinationsChange(combinations.map((combination) => combination.enabled
                ? { ...combination, regularPrice: bulkPrice } : combination))} className="h-8 text-[12px]">{__("Apply", "yaxii-product-workspace")}</Button>
          </Explain>
          <Explain tip={__("Builds SKUs from the product SKU plus each option.", "yaxii-product-workspace")}>
            <Button type="button" size="sm" variant="ghost" onClick={autoSku} className="h-8 text-[12px]">
              <Wand2 className="me-1.5 h-3.5 w-3.5" /> {__("Auto SKU", "yaxii-product-workspace")}
            </Button>
          </Explain>
        </div>
      </div>
      <div className="max-h-[26rem] overflow-y-auto">{combinations.map((combination, index) => <VariationRow
        key={combination.clientId} combination={combination} currency={currency} index={index}
        labels={selectionLabels(combination.selections)} image={imagePreviews[combination.imageId]}
        onUploadImage={onUploadImage} onChange={(updates) => patchCombination(combination.clientId, updates)}
        onImage={(image) => {
          if (image?.wpMediaId) setImagePreviews((current) => ({ ...current, [image.wpMediaId as number]: image }));
          patchCombination(combination.clientId, { imageId: image?.wpMediaId ?? 0 });
        }} />)}</div>
    </div>}
    {error && <p role="alert" className="text-[11px] text-destructive">{error}</p>}
    {lookupError && <p role="alert" className="text-[11px] text-destructive">{lookupError}</p>}
    {!attributes.length && <p className="text-[12px] text-muted-foreground">{__("Add a global or custom attribute to start. You can mix both: Global Color (Black, White) plus Custom Size (S, M, L) generates 6 variations.", "yaxii-product-workspace")}</p>}
  </div>;
});
VariationsEditor.displayName = "VariationsEditor";
