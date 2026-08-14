import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { VariationCombinationCard } from "@/components/variations/VariationCombinationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import type { AttributeCatalogItem, AttributeTerm, VariableAttribute, VariationCombination } from "@/production/domain/variableProducts";
import { generateSecureUuidV4 } from "@/production/core/security/secureUuid";
import { generateVariationCombinations, projectedCombinationCount, VariablePlanError } from "@/production/features/variableProducts/combinationGenerator";

interface Props {
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  onAttributesChange: (attributes: VariableAttribute[]) => void;
  onCombinationsChange: (combinations: VariationCombination[]) => void;
}

export const VariationsEditor = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { attributes, combinations, onAttributesChange, onCombinationsChange } = props;
  const { client } = useWorkspaceRuntime();
  const [catalog, setCatalog] = useState<AttributeCatalogItem[]>([]);
  const [terms, setTerms] = useState<Record<number, AttributeTerm[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => { void client.listAttributes().then(setCatalog).catch(() => setCatalog([])); }, [client]);
  useEffect(() => {
    attributes.filter((attribute) => attribute.source === "global").forEach((attribute) => {
      if (terms[attribute.attributeId]) return;
      void client.listAttributeTerms(attribute.attributeId).then((items) => {
        setTerms((current) => ({ ...current, [attribute.attributeId]: items }));
      }).catch(() => setTerms((current) => ({ ...current, [attribute.attributeId]: [] })));
    });
  }, [attributes, client, terms]);

  const projected = useMemo(() => projectedCombinationCount(attributes), [attributes]);
  const addAttribute = useCallback(() => {
    if (attributes.length >= 5) return;
    const key = `custom:attribute-${generateSecureUuidV4().slice(0, 8)}`;
    onAttributesChange([...attributes, { key, name: "", options: [], position: attributes.length, source: "custom", variation: true, visible: true }]);
    setExpanded((current) => new Set(current).add(key));
  }, [attributes, onAttributesChange]);

  const update = useCallback((key: string, next: VariableAttribute) => {
    onAttributesChange(attributes.map((attribute) => attribute.key === key ? next : attribute));
    if (next.key !== key) {
      setExpanded((current) => {
        const changed = new Set(current);
        changed.delete(key);
        changed.add(next.key);
        return changed;
      });
    }
  }, [attributes, onAttributesChange]);

  const remove = useCallback((key: string) => {
    onAttributesChange(attributes.filter((attribute) => attribute.key !== key).map((attribute, position) => ({ ...attribute, position })));
  }, [attributes, onAttributesChange]);

  const move = useCallback((key: string, direction: -1 | 1) => {
    const index = attributes.findIndex((attribute) => attribute.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= attributes.length) return;
    const reordered = [...attributes];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    onAttributesChange(reordered.map((attribute, position) => ({ ...attribute, position })));
  }, [attributes, onAttributesChange]);

  const changeSource = useCallback((attribute: VariableAttribute, source: "custom" | "global") => {
    if (source === attribute.source) return;
    if (source === "custom") {
      update(attribute.key, { key: attribute.key, name: "", options: [], position: attribute.position, source, variation: attribute.variation, visible: attribute.visible });
      return;
    }
    const first = catalog[0];
    if (!first) return;
    update(attribute.key, { attributeId: first.id, key: `global:${first.id}`, name: first.name, optionIds: [], position: attribute.position, source, taxonomy: first.taxonomy, variation: attribute.variation, visible: attribute.visible });
  }, [catalog, update]);

  const generate = () => {
    try {
      onCombinationsChange(generateVariationCombinations(attributes, combinations));
      setError("");
    } catch (reason) {
      setError(reason instanceof VariablePlanError ? Object.values(reason.fields)[0] ?? reason.message : "Combinations could not be generated.");
    }
  };

  return <div ref={ref} className="space-y-4">
    {attributes.map((attribute, index) => <div key={attribute.key} className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 bg-muted/30 p-3 sm:p-4">
        <GripVertical className="hidden h-4 w-4 text-muted-foreground sm:block" />
        <select className="ctl h-9 rounded-md border border-input bg-background px-2 text-xs" value={attribute.source}
          onChange={(event) => changeSource(attribute, event.target.value as "custom" | "global")}>
          <option value="custom">Custom</option><option value="global" disabled={!catalog.length}>Global</option>
        </select>
        <button type="button" className="min-w-0 flex-1 truncate text-start text-sm font-medium"
          onClick={() => setExpanded((current) => {
            const next = new Set(current);
            if (next.has(attribute.key)) next.delete(attribute.key);
            else next.add(attribute.key);
            return next;
          })}>
          {attribute.name || "New attribute"} <span className="ms-2 text-xs font-normal text-muted-foreground">{attribute.source === "global" ? attribute.optionIds.length : attribute.options.length} values</span>
        </button>
        <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(attribute.key, -1)} aria-label="Move attribute up"><ChevronUp className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" disabled={index === attributes.length - 1} onClick={() => move(attribute.key, 1)} aria-label="Move attribute down"><ChevronDown className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(attribute.key)} aria-label="Remove attribute" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </div>
      {expanded.has(attribute.key) && <div className="space-y-3 p-4">
        {attribute.source === "custom"
          ? <CustomFields key={`${attribute.key}:${attribute.options.join("|")}`} attribute={attribute} onChange={(next) => update(attribute.key, next)} />
          : <GlobalFields attribute={attribute} catalog={catalog} terms={terms[attribute.attributeId] ?? []} onChange={(next) => update(attribute.key, next)} />}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Toggle label="Visible on product" checked={attribute.visible} onChange={(visible) => update(attribute.key, { ...attribute, visible })} />
          <Toggle label="Used for variations" checked={attribute.variation} onChange={(variation) => update(attribute.key, { ...attribute, variation })} />
        </div>
      </div>}
    </div>)}
    <Button variant="outline" type="button" onClick={addAttribute} disabled={attributes.length >= 5} className="w-full border-dashed"><Plus className="me-2 h-4 w-4" /> Add Attribute</Button>
    {attributes.length > 0 && <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium">{projected} projected combinations</p><p className="text-xs text-muted-foreground">Free supports up to 50 concrete variations.</p></div>
      <Button type="button" onClick={generate} disabled={projected < 1 || projected > 50}><Sparkles className="me-2 h-4 w-4" />Generate combinations</Button>
    </div>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {combinations.length > 0 && <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Concrete variations · {combinations.length}</p>
      {combinations.map((combination) => <VariationCombinationCard key={combination.clientId} attributes={attributes} combination={combination} terms={terms}
        onChange={(next) => onCombinationsChange(combinations.map((item) => item.clientId === next.clientId ? next : item))} />)}
    </div>}
  </div>;
});
VariationsEditor.displayName = "VariationsEditor";

function CustomFields({ attribute, onChange }: { attribute: Extract<VariableAttribute, { source: "custom" }>; onChange: (value: Extract<VariableAttribute, { source: "custom" }>) => void }) {
  const [options, setOptions] = useState(attribute.options.join(", "));
  return <><Input value={attribute.name} placeholder="Attribute name (e.g., Size)" onChange={(event) => onChange({ ...attribute, name: event.target.value })} />
    <Input value={options} placeholder="Values separated by commas (S, M, L)"
      onChange={(event) => setOptions(event.target.value)}
      onBlur={() => onChange({ ...attribute, options: options.split(",").map((value) => value.trim()).filter(Boolean) })} /></>;
}

function GlobalFields({ attribute, catalog, terms, onChange }: { attribute: Extract<VariableAttribute, { source: "global" }>; catalog: AttributeCatalogItem[]; terms: AttributeTerm[]; onChange: (value: Extract<VariableAttribute, { source: "global" }>) => void }) {
  return <><select className="ctl h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={attribute.attributeId} onChange={(event) => {
    const selected = catalog.find((item) => item.id === Number(event.target.value));
    if (selected) onChange({ ...attribute, attributeId: selected.id, key: `global:${selected.id}`, name: selected.name, optionIds: [], taxonomy: selected.taxonomy });
  }}>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <div className="flex flex-wrap gap-2">{terms.map((term) => <label key={term.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"><input type="checkbox" checked={attribute.optionIds.includes(term.id)} onChange={(event) => onChange({ ...attribute, optionIds: event.target.checked ? [...attribute.optionIds, term.id] : attribute.optionIds.filter((id) => id !== term.id) })} />{term.name}</label>)}</div></>;
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
