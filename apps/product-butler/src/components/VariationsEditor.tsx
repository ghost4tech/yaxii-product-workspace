import React, { useState, forwardRef, useCallback } from 'react';
import { Plus, X, GripVertical, ImagePlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProductVariation, VariationOption, ProductImage } from '@/types/product';
import { cn } from '@/lib/utils';

interface VariationsEditorProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

export const VariationsEditor = forwardRef<HTMLDivElement, VariationsEditorProps>(
  ({ variations, onChange }, ref) => {
    const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set());

    const addVariation = useCallback(() => {
      const newVariation: ProductVariation = {
        id: crypto.randomUUID(),
        name: '',
        options: [],
      };
      onChange([...variations, newVariation]);
      setExpandedVariations(prev => new Set(prev).add(newVariation.id));
    }, [variations, onChange]);

    const removeVariation = useCallback((id: string) => {
      onChange(variations.filter((v) => v.id !== id));
      setExpandedVariations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, [variations, onChange]);

    const updateVariationName = useCallback((id: string, name: string) => {
      onChange(
        variations.map((v) => (v.id === id ? { ...v, name } : v))
      );
    }, [variations, onChange]);

    const addOption = useCallback((variationId: string) => {
      const newOption: VariationOption = {
        id: crypto.randomUUID(),
        value: '',
        price: '',
        salePrice: '',
        sku: '',
        stockQuantity: '',
      };
      onChange(
        variations.map((v) =>
          v.id === variationId
            ? { ...v, options: [...v.options, newOption] }
            : v
        )
      );
    }, [variations, onChange]);

    const removeOption = useCallback((variationId: string, optionId: string) => {
      onChange(
        variations.map((v) =>
          v.id === variationId
            ? { ...v, options: v.options.filter((opt) => opt.id !== optionId) }
            : v
        )
      );
    }, [variations, onChange]);

    const updateOption = useCallback((
      variationId: string,
      optionId: string,
      updates: Partial<VariationOption>
    ) => {
      onChange(
        variations.map((v) =>
          v.id === variationId
            ? {
                ...v,
                options: v.options.map((opt) =>
                  opt.id === optionId ? { ...opt, ...updates } : opt
                ),
              }
            : v
        )
      );
    }, [variations, onChange]);

    const handleOptionImageUpload = useCallback((
      variationId: string,
      optionId: string,
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const image: ProductImage = {
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      };

      updateOption(variationId, optionId, { image });
    }, [updateOption]);

    const removeOptionImage = useCallback((variationId: string, optionId: string) => {
      updateOption(variationId, optionId, { image: undefined });
    }, [updateOption]);

    const toggleVariationExpanded = useCallback((id: string) => {
      setExpandedVariations(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }, []);

    return (
      <div ref={ref} className="space-y-4">
        {variations.map((variation) => (
          <div
            key={variation.id}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            {/* Variation Header */}
            <div 
              className="flex items-center gap-2 p-4 bg-muted/30 cursor-pointer"
              onClick={() => toggleVariationExpanded(variation.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Input
                placeholder="Attribute name (e.g., Size, Color)"
                value={variation.name}
                onChange={(e) => {
                  e.stopPropagation();
                  updateVariationName(variation.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {variation.options.length} option{variation.options.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariation(variation.id);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Options */}
            {expandedVariations.has(variation.id) && (
              <div className="p-4 space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Options (with individual pricing)
                </Label>

                {variation.options.map((option) => (
                  <div
                    key={option.id}
                    className="p-3 border border-border rounded-lg bg-background space-y-3"
                  >
                    {/* Option Value and Image */}
                    <div className="flex items-start gap-3">
                      {/* Image upload */}
                      <div className="relative">
                        {option.image ? (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                            <img
                              src={option.image.preview}
                              alt={option.value}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeOptionImage(variation.id, option.id)}
                              className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:border-primary/50 transition-colors">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleOptionImageUpload(variation.id, option.id, e)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Option value */}
                      <div className="flex-1">
                        <Input
                          placeholder="Option value (e.g., Red, Large)"
                          value={option.value}
                          onChange={(e) =>
                            updateOption(variation.id, option.id, { value: e.target.value })
                          }
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(variation.id, option.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Pricing Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={option.price}
                          onChange={(e) =>
                            updateOption(variation.id, option.id, { price: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sale Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={option.salePrice || ''}
                          onChange={(e) =>
                            updateOption(variation.id, option.id, { salePrice: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">SKU</Label>
                        <Input
                          placeholder="SKU"
                          value={option.sku || ''}
                          onChange={(e) =>
                            updateOption(variation.id, option.id, { sku: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Stock</Label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={option.stockQuantity || ''}
                          onChange={(e) =>
                            updateOption(variation.id, option.id, { stockQuantity: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(variation.id)}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addVariation}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>

        {variations.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Each attribute option can have its own price, sale price, SKU, stock, and image.
            Variations will be automatically generated in WooCommerce.
          </p>
        )}
      </div>
    );
  }
);

VariationsEditor.displayName = 'VariationsEditor';
