import { ImagePlus, X } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductImage } from "@/types/product";
import type { AttributeTerm, VariableAttribute, VariationCombination, VariationSelection } from "@/production/domain/variableProducts";

export function VariationCombinationCard({ attributes, combination, onChange, onUploadImage, terms }: {
  attributes: VariableAttribute[];
  combination: VariationCombination;
  onChange: (combination: VariationCombination) => void;
  onUploadImage: (file: File) => Promise<ProductImage>;
  terms: Record<number, AttributeTerm[]>;
}) {
  const update = (fields: Partial<VariationCombination>) => onChange({ ...combination, ...fields });
  const label = combination.selections.map((selection) => selectionLabel(selection, attributes, terms)).join(" / ");
  const selectedImage: ProductImage[] = combination.imageId > 0
    ? [{ id: `wp-${combination.imageId}`, preview: "", wpMediaId: combination.imageId }]
    : [];
  return <div className="space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-sm font-semibold">{label}</p><p className="font-mono text-[10px] text-muted-foreground">{combination.variationId ? `#${combination.variationId}` : "New variation"}</p></div>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={combination.enabled} onChange={(event) => update({ enabled: event.target.checked })} />Enabled</label>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Price *"><Input type="number" min="0" step="0.01" value={combination.regularPrice} onChange={(event) => update({ regularPrice: event.target.value })} /></Field>
      <Field label="Sale price"><Input type="number" min="0" step="0.01" value={combination.salePrice ?? ""} onChange={(event) => update({ salePrice: event.target.value || null })} /></Field>
      <Field label="SKU"><Input value={combination.sku} onChange={(event) => update({ sku: event.target.value })} /></Field>
      <Field label="Stock"><Input type="number" min="0" value={combination.stockQuantity ?? ""} onChange={(event) => update({ manageStock: event.target.value !== "", stockQuantity: event.target.value === "" ? null : Number(event.target.value) })} /></Field>
    </div>
    <div className="rounded-md border border-dashed border-border p-3">
      {combination.imageId > 0 ? <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" />WordPress image #{combination.imageId}</span><Button type="button" size="sm" variant="ghost" onClick={() => update({ imageId: 0 })}><X className="me-1 h-3.5 w-3.5" />Remove</Button></div>
        : <ImageUpload images={selectedImage} onChange={(images) => update({ imageId: images[0]?.wpMediaId ?? 0 })}
          maxImages={1} onUpload={onUploadImage} />}
    </div>
  </div>;
}

function selectionLabel(selection: VariationSelection, attributes: VariableAttribute[], terms: Record<number, AttributeTerm[]>): string {
  const attribute = attributes.find((item) => item.key === selection.attributeKey);
  if (!attribute) return "Unknown";
  if ("option" in selection) return `${attribute.name}: ${selection.option}`;
  if (attribute.source !== "global") return "Unknown";
  return `${attribute.name}: ${terms[attribute.attributeId]?.find((term) => term.id === selection.termId)?.name ?? selection.termId}`;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-1 text-xs text-muted-foreground"><span>{label}</span>{children}</label>;
}
