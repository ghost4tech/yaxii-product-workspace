import { useRef, useState } from "react";
import { ChevronDown, ImagePlus, Loader2, X } from "lucide-react";
import { Explain } from "@/components/ui/help-tip";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { VariationCombination } from "@/production/domain/variableProducts";
import type { ProductImage } from "@/types/product";

interface Props {
  combination: VariationCombination;
  currency: string;
  image?: ProductImage;
  index: number;
  labels: string[];
  onChange: (updates: Partial<VariationCombination>) => void;
  onImage: (image: ProductImage | null) => void;
  onUploadImage: (file: File) => Promise<ProductImage>;
}

export function VariationRow({ combination, currency, image, index, labels, onChange, onImage, onUploadImage }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = !combination.enabled;
  const priceMissing = combination.enabled && !combination.regularPrice;
  const pickImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onImage(await onUploadImage(file));
      setUploadError("");
    } catch {
      setUploadError("Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return <div className={cn(
    "border-b border-border transition-colors last:border-b-0",
    disabled ? "opacity-55" : "hover:bg-muted/25",
  )}>
    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
      <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{index + 1}</span>
      <Explain tip="Variation image. Shown when a shopper picks this exact combination.">
        <div className="group relative h-9 w-9 shrink-0">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            aria-busy={uploading} aria-label={image ? "Replace variation image" : "Add variation image"}
            className="relative grid h-full w-full cursor-pointer place-items-center overflow-hidden rounded-md border border-dashed border-border hover:border-foreground/40 disabled:cursor-wait">
            {image ? <img src={image.preview} alt={labels.join(" ")} className="h-full w-full object-cover" />
              : <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />}
            {uploading && <span className="absolute inset-0 grid place-items-center bg-card/90 backdrop-blur-[1px]">
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              <span className="sr-only">Uploading variation image</span>
            </span>}
          </button>
          {image && !uploading && <button type="button" onClick={() => onImage(null)}
            aria-label="Remove variation image"
            className="variation-image-remove absolute -end-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-foreground text-background shadow-sm">
            <X className="h-2.5 w-2.5" />
          </button>}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
            void pickImage(event.target.files?.[0]);
            event.target.value = "";
          }} />
        </div>
      </Explain>
      <div className="flex min-w-0 flex-1 basis-[9rem] items-center gap-1">{labels.map((label, labelIndex) => <span key={`${label}-${labelIndex}`} className="contents">
        {labelIndex > 0 && <span className="text-[11px] text-muted-foreground/50">·</span>}
        <span className="inline-flex h-5 truncate rounded bg-muted px-1.5 text-[11px] font-medium">{label}</span>
      </span>)}</div>
      <div className="input-group w-[7.5rem] shrink-0" data-invalid={priceMissing || undefined}>
        <span className="input-affix">{currency}</span>
        <input type="number" step="0.01" inputMode="decimal" placeholder="Price" className="font-mono"
          value={combination.regularPrice} onChange={(event) => onChange({ regularPrice: event.target.value })} />
      </div>
      <input placeholder="SKU" value={combination.sku} onChange={(event) => onChange({ sku: event.target.value })}
        className="h-[var(--ctl-h)] w-[7.5rem] shrink-0 rounded-md border border-input bg-background px-2.5 font-mono text-[12px] outline-none focus:border-foreground/40" />
      <input type="number" inputMode="numeric" placeholder="Qty" value={combination.stockQuantity ?? ""}
        onChange={(event) => onChange({
          manageStock: event.target.value !== "",
          stockQuantity: event.target.value === "" ? null : Number(event.target.value),
        })}
        className="h-[var(--ctl-h)] w-[4.5rem] shrink-0 rounded-md border border-input bg-background px-2.5 font-mono text-[12px] outline-none focus:border-foreground/40" />
      <Explain tip={combination.enabled ? "Enabled — this variation will be created in WooCommerce." : "Disabled — skipped on save."}>
        <div className="shrink-0 ps-1"><Switch checked={combination.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })} aria-label="Enable variation" /></div>
      </Explain>
      <button type="button" onClick={() => setOpen((current) => !current)}
        className="shrink-0 p-1 text-muted-foreground hover:text-foreground" aria-label="More variation fields">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
    </div>
    {open && <div className="flex flex-wrap items-end gap-3 pb-3 ps-[4.25rem] pe-3">
      <div><label className="field-label">Sale price</label><div className="input-group w-[7.5rem]">
        <span className="input-affix">{currency}</span>
        <input type="number" step="0.01" placeholder="0.00" className="font-mono"
          value={combination.salePrice ?? ""} onChange={(event) => onChange({ salePrice: event.target.value || null })} />
      </div></div>
      <div><label className="field-label">Stock status</label><div className="seg">
        {(["instock", "outofstock", "onbackorder"] as const).map((status) => <button key={status} type="button"
          onClick={() => onChange({ stockStatus: status })} data-active={combination.stockStatus === status} className="seg-item">
          {status === "instock" ? "In stock" : status === "outofstock" ? "Out" : "Backorder"}
        </button>)}
      </div></div>
      {priceMissing && <p className="ms-auto text-[11px] text-warning">A regular price is required for every enabled variation.</p>}
    </div>}
    {uploadError && <p role="alert" className="pb-2 ps-[4.25rem] text-[11px] text-destructive">{uploadError}</p>}
  </div>;
}
