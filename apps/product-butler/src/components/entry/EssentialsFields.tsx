import React from 'react';
import { Package, Tags, Images, Layers } from 'lucide-react';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { CategoryTreeSelect } from '@/components/CategoryTreeSelect';
import { ProductImage } from '@/types/product';
import { FormSection, FieldShell } from '@/components/entry/FormSection';
import { cn } from '@/lib/utils';
import { HelpTip } from '@/components/ui/help-tip';
import { VariationsEditor } from '@/components/VariationsEditor';
import type { VariableAttribute, VariationCombination } from '@/production/domain/variableProducts';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductEntryValues } from '@/components/entry/productEntryModel';
import { __, _n, sprintf } from '@/production/core/i18n/wordpress';

interface Props {
  form: UseFormReturn<ProductEntryValues>;
  isVariable: boolean;
  typeLocked?: boolean;
  images: ProductImage[];
  onVariableChange: (variable: boolean) => void;
  onImagesChange: (i: ProductImage[]) => void;
  onUploadImage: (file: File) => Promise<ProductImage>;
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  onAttributesChange: (attributes: VariableAttribute[]) => void;
  onCombinationsChange: (combinations: VariationCombination[]) => void;
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
  onUploadImage,
  attributes,
  combinations,
  onAttributesChange,
  onCombinationsChange,
  nameRef,
  currency = '$',
}) => {
  const typeToggle = (
    <div className="flex items-center gap-1.5">
      <HelpTip side="left"><strong>{__("Simple", "yaxii-product-workspace")}</strong> {__("— one price and stock value.", "yaxii-product-workspace")} <strong>{__("Variable", "yaxii-product-workspace")}</strong> {__("— attributes such as color or size produce separate variations, each with its own price, SKU, stock, and image.", "yaxii-product-workspace")}</HelpTip>
    <div className="seg" role="group" aria-label={__("Product type", "yaxii-product-workspace")}>
      <button type="button" data-active={!isVariable || undefined} className="seg-item"
        aria-pressed={!isVariable} disabled={typeLocked} onClick={() => onVariableChange(false)}>{__("Simple", "yaxii-product-workspace")}</button>
      <button type="button" data-active={isVariable || undefined} className="seg-item"
        aria-pressed={isVariable} disabled={typeLocked} onClick={() => onVariableChange(true)}>{__("Variable", "yaxii-product-workspace")}</button>
    </div>
    </div>
  );

  return (
    <div className="stack-lg">
      <FormSection title={__("Product", "yaxii-product-workspace")} icon={Package} action={typeToggle}>
        <div className="flex flex-col sm:flex-row gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 space-y-0">
                <label className="field-label" htmlFor="ypw-product-name">{__("Product name", "yaxii-product-workspace")} *</label>
                <FormControl>
                  <Input
                    {...field}
                    id="ypw-product-name"
                    ref={nameRef}
                    placeholder={__("e.g. Linen Crew Tee", "yaxii-product-workspace")}
                    autoComplete="off"
                    className="ctl ctl-input text-start font-medium"
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
                    className="ctl ctl-input font-mono" dir="ltr"
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
              <label className="field-label flex items-center gap-1.5">{__("Categories", "yaxii-product-workspace")} *
                <span className="text-[11px] font-normal text-muted-foreground">· {__("multiple allowed", "yaxii-product-workspace")}</span>
                <HelpTip side="right">{__("Pick any level of the tree. Selecting a subcategory does not automatically add its parent in WooCommerce.", "yaxii-product-workspace")}</HelpTip>
              </label>
              <FormControl>
                <CategoryTreeSelect
                  value={[field.value, ...form.watch('additionalCategoryIds').map(String)].filter(Boolean)}
                  onChange={(categoryIds) => {
                    field.onChange(categoryIds[0] ?? '');
                    form.setValue(
                      'additionalCategoryIds',
                      categoryIds.slice(1).map(Number).filter((id) => Number.isInteger(id) && id > 0),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                />
              </FormControl>
              <FormMessage className="text-[11px] mt-1" />
            </FormItem>
          )}
        />
      </FormSection>

      {!isVariable && <FormSection
        title={__("Pricing & stock", "yaxii-product-workspace")}
        icon={Tags}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="regularPrice"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <label htmlFor="ypw-product-regular-price" className={cn('field-label', isVariable && 'text-muted-foreground')}>
                  {__("Price", "yaxii-product-workspace")} {!isVariable && '*'}
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
                      dir="ltr"
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
                <label htmlFor="ypw-product-sale-price" className={cn('field-label flex items-center gap-1.5', isVariable && 'text-muted-foreground')}>
                  {__("Sale price", "yaxii-product-workspace")} <HelpTip>{__("Optional discounted price. Leave empty for no sale. Schedule a window under Extended options.", "yaxii-product-workspace")}</HelpTip>
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
                      dir="ltr"
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
                <label htmlFor="ypw-product-stock" className={cn('field-label flex items-center gap-1.5', isVariable && 'text-muted-foreground')}>
                  {__("Stock", "yaxii-product-workspace")} <HelpTip>{__("Units on hand. Entering a quantity enables WooCommerce stock management for this product.", "yaxii-product-workspace")}</HelpTip>
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
                      dir="ltr"
                      placeholder={isVariable ? '—' : '0'}
                      disabled={isVariable}
                      className="font-mono"
                    />
                    <span className="input-affix input-affix-end">{__("units", "yaxii-product-workspace")}</span>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] mt-1" />
              </FormItem>
            )}
          />
        </div>
      </FormSection>}

      {isVariable && <FormSection title={__("Variations", "yaxii-product-workspace")} icon={Layers}
        hint={__("Price, SKU, and stock live on each combination", "yaxii-product-workspace")}
        action={<HelpTip side="left">{__("Attributes → combination preview → variations. Global attributes are reusable store taxonomies; custom attributes exist only on this product.", "yaxii-product-workspace")}</HelpTip>}>
        <VariationsEditor attributes={attributes} combinations={combinations}
          onAttributesChange={onAttributesChange} onCombinationsChange={onCombinationsChange}
          onUploadImage={onUploadImage} baseSku={form.watch('sku')} currency={currency} />
      </FormSection>}

      <FormSection
        title={__("Images", "yaxii-product-workspace")}
        icon={Images}
        hint={images.length
          ? /* translators: %s: number of selected images. */ sprintf(_n("%s image selected", "%s images selected", images.length, "yaxii-product-workspace"), images.length)
          : __("First image becomes the thumbnail", "yaxii-product-workspace")}
      >
        <FieldShell label={__("Product images", "yaxii-product-workspace")}>
          <ImageUpload images={images} onChange={onImagesChange} onUpload={onUploadImage} />
        </FieldShell>
      </FormSection>
    </div>
  );
};
