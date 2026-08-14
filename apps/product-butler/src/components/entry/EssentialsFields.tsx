import React from 'react';
import { Package, Tags, Images } from 'lucide-react';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { CategorySelect } from '@/components/CategorySelect';
import { ProductImage } from '@/types/product';
import { FormSection, FieldShell } from '@/components/entry/FormSection';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductEntryValues } from '@/components/entry/productEntryModel';

interface Props {
  form: UseFormReturn<ProductEntryValues>;
  isVariable: boolean;
  typeLocked?: boolean;
  images: ProductImage[];
  onVariableChange: (variable: boolean) => void;
  onImagesChange: (i: ProductImage[]) => void;
  nameRef: React.RefObject<HTMLInputElement>;
  currency?: string;
}

export const EssentialsFields: React.FC<Props> = ({
  form,
  isVariable,
  typeLocked = false,
  images,
  onVariableChange,
  onImagesChange,
  nameRef,
  currency = '$',
}) => {
  const typeToggle = (
    <div className="seg" role="group" aria-label="Product type">
      <button type="button" data-active={!isVariable || undefined} className="seg-item"
        aria-pressed={!isVariable} disabled={typeLocked} onClick={() => onVariableChange(false)}>Simple</button>
      <button type="button" data-active={isVariable || undefined} className="seg-item"
        aria-pressed={isVariable} disabled={typeLocked} onClick={() => onVariableChange(true)}>Variable</button>
    </div>
  );

  return (
    <div className="stack-lg">
      <FormSection title="Product" icon={Package} action={typeToggle}>
        <div className="flex flex-col sm:flex-row gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 space-y-0">
                <label className="field-label" htmlFor="ypw-product-name">Product name *</label>
                <FormControl>
                  <Input
                    {...field}
                    id="ypw-product-name"
                    ref={nameRef}
                    placeholder="e.g. Linen Crew Tee"
                    autoComplete="off"
                    className="ctl ctl-input font-medium"
                  />
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem className="sm:w-44 space-y-0">
                <label className="field-label" htmlFor="ypw-product-sku">SKU</label>
                <FormControl>
                  <Input
                    {...field}
                    id="ypw-product-sku"
                    placeholder="SKU-1024"
                    autoComplete="off"
                    className="ctl ctl-input font-mono"
                  />
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <label className="field-label" htmlFor="ypw-product-category">Category *</label>
              <FormControl>
                <CategorySelect id="ypw-product-category" value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage className="text-[11px] mt-1" />
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection
        title="Pricing & stock"
        icon={Tags}
        hint={isVariable ? 'Managed per variation' : undefined}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="regularPrice"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <label htmlFor="ypw-product-regular-price" className={cn('field-label', isVariable && 'text-muted-foreground')}>
                  Price {!isVariable && '*'}
                </label>
                <FormControl>
                  <div className={cn('input-group', isVariable && 'opacity-60')}>
                    <span className="input-affix">{currency}</span>
                    <input
                      {...field}
                      id="ypw-product-regular-price"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder={isVariable ? '—' : '0.00'}
                      disabled={isVariable}
                      className="font-mono"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <label htmlFor="ypw-product-sale-price" className={cn('field-label', isVariable && 'text-muted-foreground')}>
                  Sale price
                </label>
                <FormControl>
                  <div className={cn('input-group', isVariable && 'opacity-60')}>
                    <span className="input-affix">{currency}</span>
                    <input
                      {...field}
                      id="ypw-product-sale-price"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder={isVariable ? '—' : '0.00'}
                      disabled={isVariable}
                      className="font-mono"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1 space-y-0">
                <label htmlFor="ypw-product-stock" className={cn('field-label', isVariable && 'text-muted-foreground')}>
                  Stock
                </label>
                <FormControl>
                  <div className={cn('input-group', isVariable && 'opacity-60')}>
                    <input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        if (event.target.value.trim()) {
                          form.setValue('manageStock', true, { shouldDirty: true });
                        }
                      }}
                      id="ypw-product-stock"
                      type="number"
                      inputMode="numeric"
                      placeholder={isVariable ? '—' : '0'}
                      disabled={isVariable}
                      className="font-mono"
                    />
                    <span className="input-affix input-affix-end">units</span>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
        </div>
      </FormSection>

      <FormSection
        title="Images"
        icon={Images}
        hint={images.length ? `${images.length} selected` : 'First image becomes the thumbnail'}
      >
        <FieldShell label="Product images">
          <ImageUpload images={images} onChange={onImagesChange} />
        </FieldShell>
      </FormSection>
    </div>
  );
};
