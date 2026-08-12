import { forwardRef, useCallback, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { VariationOptionCard } from "@/components/variations/VariationOptionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductVariation, VariationOption } from "@/types/product";

interface VariationsEditorProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

export const VariationsEditor = forwardRef<HTMLDivElement, VariationsEditorProps>(
  ({ variations, onChange }, ref) => {
    const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set());

    const addVariation = useCallback(() => {
      const variation: ProductVariation = {
        id: crypto.randomUUID(),
        name: "",
        options: [],
      };
      onChange([...variations, variation]);
      setExpandedVariations((current) => new Set(current).add(variation.id));
    }, [onChange, variations]);

    const removeVariation = useCallback((id: string) => {
      onChange(variations.filter((variation) => variation.id !== id));
      setExpandedVariations((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, [onChange, variations]);

    const updateVariationName = useCallback((id: string, name: string) => {
      onChange(variations.map((variation) => (variation.id === id ? { ...variation, name } : variation)));
    }, [onChange, variations]);

    const addOption = useCallback((variationId: string) => {
      const option: VariationOption = {
        id: crypto.randomUUID(),
        value: "",
        price: "",
        salePrice: "",
        sku: "",
        stockQuantity: "",
      };
      onChange(
        variations.map((variation) =>
          variation.id === variationId
            ? { ...variation, options: [...variation.options, option] }
            : variation,
        ),
      );
    }, [onChange, variations]);

    const removeOption = useCallback((variationId: string, optionId: string) => {
      onChange(
        variations.map((variation) =>
          variation.id === variationId
            ? { ...variation, options: variation.options.filter((option) => option.id !== optionId) }
            : variation,
        ),
      );
    }, [onChange, variations]);

    const updateOption = useCallback((
      variationId: string,
      optionId: string,
      updates: Partial<VariationOption>,
    ) => {
      onChange(
        variations.map((variation) =>
          variation.id === variationId
            ? {
                ...variation,
                options: variation.options.map((option) =>
                  option.id === optionId ? { ...option, ...updates } : option,
                ),
              }
            : variation,
        ),
      );
    }, [onChange, variations]);

    const removeOptionImage = useCallback((variationId: string, optionId: string) => {
      onChange(
        variations.map((variation) =>
          variation.id === variationId
            ? {
                ...variation,
                options: variation.options.map((option) => {
                  if (option.id !== optionId) return option;
                  if (option.image) URL.revokeObjectURL(option.image.preview);
                  const withoutImage = { ...option };
                  delete withoutImage.image;
                  return withoutImage;
                }),
              }
            : variation,
        ),
      );
    }, [onChange, variations]);

    const toggleExpanded = useCallback((id: string) => {
      setExpandedVariations((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    return (
      <div ref={ref} className="space-y-4">
        {variations.map((variation) => (
          <div key={variation.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div
              className="flex cursor-pointer items-center gap-2 bg-muted/30 p-4"
              onClick={() => toggleExpanded(variation.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") toggleExpanded(variation.id);
              }}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
              <Input
                placeholder="Attribute name (e.g., Size, Color)"
                value={variation.name}
                onChange={(event) => {
                  event.stopPropagation();
                  updateVariationName(variation.id, event.target.value);
                }}
                onClick={(event) => event.stopPropagation()}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {variation.options.length} option{variation.options.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeVariation(variation.id);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expandedVariations.has(variation.id) && (
              <div className="space-y-3 p-4">
                <Label className="text-sm text-muted-foreground">Options (with individual pricing)</Label>
                {variation.options.map((option) => (
                  <VariationOptionCard
                    key={option.id}
                    option={option}
                    onChange={(updates) => updateOption(variation.id, option.id, updates)}
                    onRemove={() => removeOption(variation.id, option.id)}
                    onRemoveImage={() => removeOptionImage(variation.id, option.id)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => addOption(variation.id)}
                  className="w-full border-dashed"
                >
                  <Plus className="me-2 h-4 w-4" /> Add Option
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" type="button" onClick={addVariation} className="w-full border-dashed">
          <Plus className="me-2 h-4 w-4" /> Add Attribute
        </Button>

        {variations.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Each attribute option can have its own price, sale price, SKU, stock, and image. Variations will
            be automatically generated in WooCommerce.
          </p>
        )}
      </div>
    );
  },
);

VariationsEditor.displayName = "VariationsEditor";
