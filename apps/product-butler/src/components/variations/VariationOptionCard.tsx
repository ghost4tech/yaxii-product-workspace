import type { ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductImage, VariationOption } from "@/types/product";
import { generateSecureUuidV4 } from "@/production/core/security/secureUuid";

interface VariationOptionCardProps {
  option: VariationOption;
  onChange: (updates: Partial<VariationOption>) => void;
  onRemove: () => void;
  onRemoveImage: () => void;
}

export function VariationOptionCard({
  onChange,
  onRemove,
  onRemoveImage,
  option,
}: VariationOptionCardProps) {
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image: ProductImage = {
      id: generateSecureUuidV4(),
      file,
      preview: URL.createObjectURL(file),
    };
    onChange({ image });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <div className="relative">
          {option.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
              <img src={option.image.preview} alt={option.value} className="h-full w-full object-cover" />
              <button
                onClick={onRemoveImage}
                className="absolute -top-1 -end-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                aria-label="Remove option image"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        <div className="flex-1">
          <Input
            placeholder="Option value (e.g., Red, Large)"
            value={option.value}
            onChange={(event) => onChange({ value: event.target.value })}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove option</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <OptionField label="Price *">
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={option.price}
            onChange={(event) => onChange({ price: event.target.value })}
          />
        </OptionField>
        <OptionField label="Sale Price">
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={option.salePrice || ""}
            onChange={(event) => onChange({ salePrice: event.target.value })}
          />
        </OptionField>
        <OptionField label="SKU">
          <Input
            placeholder="SKU"
            value={option.sku || ""}
            onChange={(event) => onChange({ sku: event.target.value })}
          />
        </OptionField>
        <OptionField label="Stock">
          <Input
            type="number"
            placeholder="Qty"
            value={option.stockQuantity || ""}
            onChange={(event) => onChange({ stockQuantity: event.target.value })}
          />
        </OptionField>
      </div>
    </div>
  );
}

function OptionField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
