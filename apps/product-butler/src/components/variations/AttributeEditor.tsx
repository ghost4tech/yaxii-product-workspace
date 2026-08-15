import { useState } from "react";
import { Globe, Tag, Trash2, X } from "lucide-react";
import { Explain, HelpTip } from "@/components/ui/help-tip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { VARIABLE_PRODUCT_LIMITS, type AttributeCatalogItem, type AttributeTerm, type VariableAttribute } from "@/production/domain/variableProducts";
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

interface Props {
  attribute: VariableAttribute;
  onChange: (attribute: VariableAttribute) => void;
  onRemove: () => void;
  terms: AttributeTerm[];
}

export function AttributeEditor({ attribute, onChange, onRemove, terms }: Props) {
  const [draft, setDraft] = useState("");
  const global = attribute.source === "global";
  const optionCount = global ? attribute.optionIds.length : attribute.options.length;
  const optionsFull = optionCount >= VARIABLE_PRODUCT_LIMITS.optionsPerAttribute;
  const addCustomOptions = () => {
    if (attribute.source !== "custom") return;
    const parts = draft.split(/[,،\n]/).map((option) => option.trim()).filter(Boolean);
    const existing = new Set(attribute.options.map((option) => option.toLocaleLowerCase()));
    const next = [...attribute.options];
    parts.forEach((option) => {
      if (!existing.has(option.toLocaleLowerCase()) && next.length < VARIABLE_PRODUCT_LIMITS.optionsPerAttribute) {
        next.push(option);
        existing.add(option.toLocaleLowerCase());
      }
    });
    onChange({ ...attribute, options: next });
    setDraft("");
  };
  const toggleTerm = (termId: number) => {
    if (attribute.source !== "global") return;
    const selected = attribute.optionIds.includes(termId);
    if (!selected && optionsFull) return;
    onChange({
      ...attribute,
      optionIds: selected
        ? attribute.optionIds.filter((id) => id !== termId)
        : [...attribute.optionIds, termId],
    });
  };
  const colorAttribute = global && /colou?r/i.test(`${attribute.name} ${attribute.taxonomy}`);

  return <div className="rounded-md border border-border bg-card">
    <div className="flex items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
      <Explain tip={global
        ? __("Global attribute — a real WooCommerce taxonomy and terms, reusable across products.", "yaxii-product-workspace")
        : __("Custom attribute — exists only on this product. No global taxonomy is created.", "yaxii-product-workspace")}>
        <span className={cn(
          "inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wide",
          global ? "border-info/25 bg-info/10 text-info" : "border-border bg-muted text-muted-foreground",
        )}>{global ? <Globe className="h-3 w-3" /> : <Tag className="h-3 w-3" />}{global ? __("Global", "yaxii-product-workspace") : __("Custom", "yaxii-product-workspace")}</span>
      </Explain>
      {global ? <span className="truncate text-start text-[13px] font-medium">{attribute.name}
        <bdi className="ms-1.5 font-mono text-[11px] text-muted-foreground" dir="ltr">{attribute.taxonomy}</bdi>
      </span> : <input value={attribute.name} onChange={(event) => onChange({ ...attribute, name: event.target.value })}
        placeholder={__("Attribute name (e.g. Size)", "yaxii-product-workspace")}
        className="h-7 min-w-0 flex-1 bg-transparent text-start text-[13px] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/60" />}
      <span className="ms-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{
        /* translators: %s: selected option count. */
        sprintf(_n("%s selected", "%s selected", optionCount, "yaxii-product-workspace"), optionCount)
      }</span>
      <button type="button" onClick={onRemove} aria-label={__("Remove attribute", "yaxii-product-workspace")}
        className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
    <div className="space-y-2 p-3">
      {global ? <>
        <p className="text-[11px] text-muted-foreground">{__("Pick the store terms used on this product.", "yaxii-product-workspace")}</p>
        <div className="flex flex-wrap gap-1.5">{terms.map((term) => {
          const selected = attribute.optionIds.includes(term.id);
          return <button key={term.id} type="button" onClick={() => toggleTerm(term.id)}
            disabled={!selected && optionsFull} className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors disabled:opacity-40",
              selected ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40",
            )}>
            {colorAttribute && <span className="h-3 w-3 rounded-full border border-border/60"
              style={{ background: term.slug }} />}<bdi dir="auto">{term.name}</bdi>
          </button>;
        })}</div>
      </> : <>
        <div className="flex flex-wrap gap-1.5">{attribute.options.map((option) => <span key={option}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-muted/50 ps-2 pe-1 text-[12px]">
          <bdi dir="auto">{option}</bdi><button type="button" onClick={() => onChange({ ...attribute, options: attribute.options.filter((item) => item !== option) })}
            className="p-0.5 text-muted-foreground hover:text-destructive" aria-label={
              /* translators: %s: option name. */ sprintf(__("Remove %s", "yaxii-product-workspace"), option)
            }><X className="h-3 w-3" /></button>
        </span>)}</div>
        <div className="flex items-center gap-2">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={optionsFull}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addCustomOptions();
              }
            }} placeholder={__("Type options — S, M, L then Enter", "yaxii-product-workspace")}
            className="h-[var(--ctl-h)] min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-start text-[12px] outline-none focus:border-foreground/40 disabled:opacity-50" />
          <HelpTip side="left">{
            /* translators: %s: maximum option count per attribute. */
            sprintf(_n("Separate options with commas. Up to %s option per attribute.", "Separate options with commas. Up to %s options per attribute.", VARIABLE_PRODUCT_LIMITS.optionsPerAttribute, "yaxii-product-workspace"), VARIABLE_PRODUCT_LIMITS.optionsPerAttribute)
          }</HelpTip>
        </div>
      </>}
    </div>
  </div>;
}

export function GlobalAttributeSelect({ available, disabled, onSelect }: {
  available: AttributeCatalogItem[];
  disabled: boolean;
  onSelect: (attribute: AttributeCatalogItem) => void;
}) {
  return <Select value="" disabled={disabled || !available.length} onValueChange={(value) => {
    const selected = available.find((attribute) => attribute.id === Number(value));
    if (selected) onSelect(selected);
  }}>
    <SelectTrigger className="h-8 w-[200px] text-[12px]"><SelectValue placeholder={__("+ Global attribute", "yaxii-product-workspace")} /></SelectTrigger>
    <SelectContent>{available.map((attribute) => <SelectItem key={attribute.id}
      value={String(attribute.id)} className="text-[12px]"><bdi dir="auto">{attribute.name}</bdi></SelectItem>)}</SelectContent>
  </Select>;
}
