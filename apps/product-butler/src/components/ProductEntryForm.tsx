import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { EssentialsFields } from '@/components/entry/EssentialsFields';
import { ExtendedFields } from '@/components/entry/ExtendedFields';
import { EntryActionBar } from '@/components/entry/EntryActionBar';
import { ProductFormData, ProductImage, ProductVariation } from '@/types/product';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { saveDraft } from '@/lib/entryActions';

interface ProductEntryFormProps {
  isSubmitting?: boolean;
  /** Controlled extended-section open state (when provided, internal toggle is hidden) */
  advancedOpen?: boolean;
  onAdvancedChange?: (open: boolean) => void;
  /** Render essentials + extended side by side */
  twoColumn?: boolean;
}

export type ProductEntryValues = {
  name: string;
  sku?: string;
  regularPrice?: string;
  salePrice?: string;
  categoryId: string;
  stockQuantity?: string;
  shortDescription?: string;
  longDescription?: string;
};

const EMPTY: ProductEntryValues = {
  name: '',
  sku: '',
  regularPrice: '',
  salePrice: '',
  categoryId: '',
  stockQuantity: '',
  shortDescription: '',
  longDescription: '',
};

const toValues = (d: Partial<ProductFormData>): ProductEntryValues => ({
  name: d.name || '',
  sku: d.sku || '',
  regularPrice: d.regularPrice || '',
  salePrice: d.salePrice || '',
  categoryId: d.categoryId || '',
  stockQuantity: d.stockQuantity || '',
  shortDescription: d.shortDescription || '',
  longDescription: d.longDescription || '',
});

export const ProductEntryForm: React.FC<ProductEntryFormProps> = ({
  isSubmitting = false,
  advancedOpen,
  onAdvancedChange,
  twoColumn = false,
}) => {
  const [internalAdvanced, setInternalAdvanced] = React.useState(false);
  const isControlled = advancedOpen !== undefined;
  const showAdvanced = isControlled ? advancedOpen : internalAdvanced;
  const setShowAdvanced = isControlled ? (onAdvancedChange ?? (() => {})) : setInternalAdvanced;

  const [images, setImages] = React.useState<ProductImage[]>([]);
  const [variations, setVariations] = React.useState<ProductVariation[]>([]);
  const [saleStart, setSaleStart] = React.useState<Date>();
  const [saleEnd, setSaleEnd] = React.useState<Date>();
  const [isVariable, setIsVariable] = React.useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const { draftFormData, setDraftFormData, clearDraftFormData, draftRevision } = useProductStore();
  const autoFocusName = usePrefsStore((s) => s.prefs.autoFocusName);

  const hasValidVariations = useMemo(
    () => variations.some((v) => v.name && v.options.length > 0),
    [variations]
  );

  const productSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, 'Product name is required'),
        sku: z.string().optional(),
        regularPrice: isVariable ? z.string().optional() : z.string().min(1, 'Price is required'),
        salePrice: z.string().optional(),
        categoryId: z.string().min(1, 'Category is required'),
        stockQuantity: z.string().optional(),
        shortDescription: z.string().optional(),
        longDescription: z.string().optional(),
      }),
    [isVariable]
  );

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: toValues(draftFormData),
  });

  const watched = form.watch();
  const dirty = Boolean(
    watched.name || watched.regularPrice || watched.sku || images.length || variations.length
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      setDraftFormData({
        ...values,
        images,
        variations,
        saleScheduleStart: saleStart,
        saleScheduleEnd: saleEnd,
        isVariable,
      } as ProductFormData);
    });
    return () => subscription.unsubscribe();
  }, [form, images, variations, saleStart, saleEnd, isVariable, setDraftFormData]);

  useEffect(() => {
    if (draftFormData.images?.length) setImages(draftFormData.images);
    if (draftFormData.variations?.length) setVariations(draftFormData.variations);
    if (draftFormData.saleScheduleStart) setSaleStart(new Date(draftFormData.saleScheduleStart));
    if (draftFormData.saleScheduleEnd) setSaleEnd(new Date(draftFormData.saleScheduleEnd));
    if (draftFormData.isVariable) setIsVariable(draftFormData.isVariable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to drafts replaced from outside the form (command menu, Ctrl+D, Esc)
  const firstRevision = useRef(draftRevision);
  useEffect(() => {
    if (draftRevision === firstRevision.current) return;
    const d = useProductStore.getState().draftFormData;
    form.reset(toValues(d));
    setImages(d.images || []);
    setVariations(d.variations || []);
    setIsVariable(!!d.isVariable);
    nameInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftRevision]);

  useEffect(() => {
    if (isVariable) {
      form.setValue('regularPrice', '');
      form.setValue('salePrice', '');
    }
  }, [isVariable, form]);

  const handleSubmit = useCallback(
    () => {
      saveDraft();
      nameInputRef.current?.focus();
    },
    []
  );

  const handleReset = useCallback(() => {
    form.reset(EMPTY);
    setImages([]);
    setVariations([]);
    setSaleStart(undefined);
    setSaleEnd(undefined);
    setIsVariable(false);
    clearDraftFormData();
    nameInputRef.current?.focus();
  }, [form, clearDraftFormData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void form.handleSubmit(handleSubmit)();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [form, handleSubmit]);

  useEffect(() => {
    if (autoFocusName) nameInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const essentials = (
    <EssentialsFields
      form={form}
      isVariable={isVariable}
      onVariableChange={setIsVariable}
      images={images}
      onImagesChange={setImages}
      variations={variations}
      onVariationsChange={setVariations}
      hasValidVariations={hasValidVariations}
      nameRef={nameInputRef}
    />
  );

  const extended = (
    <ExtendedFields
      form={form}
      isVariable={isVariable}
      saleStart={saleStart}
      saleEnd={saleEnd}
      onSaleStart={setSaleStart}
      onSaleEnd={setSaleEnd}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={(event) => void form.handleSubmit(handleSubmit)(event)}>
        {twoColumn ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="min-w-0">{essentials}</div>
            <div className="min-w-0 lg:border-s lg:border-border lg:ps-8">{extended}</div>
          </div>
        ) : (
          <div className="stack-lg">
            {essentials}
            {!isControlled && (
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between h-9 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    <span>Extended options</span>
                    {showAdvanced ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">{extended}</CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        <EntryActionBar
          isSubmitting={isSubmitting}
          dirty={dirty}
          productName={watched.name}
          onClear={handleReset}
          onSaveDraft={saveDraft}
        />
      </form>
    </Form>
  );
};
