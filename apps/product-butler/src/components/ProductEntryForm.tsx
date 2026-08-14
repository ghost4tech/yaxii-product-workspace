import { ChevronDown, ChevronUp, Layers3 } from "lucide-react";
import React from "react";
import type { CanonicalProduct } from "@/production/domain/products";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form } from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EntryActionBar } from "@/components/entry/EntryActionBar";
import { EssentialsFields } from "@/components/entry/EssentialsFields";
import { ExtendedFields } from "@/components/entry/ExtendedFields";
import { FormSection } from "@/components/entry/FormSection";
import { useProductEntryController } from "@/components/entry/useProductEntryController";
import { VariationsEditor } from "@/components/VariationsEditor";

interface Props {
  advancedOpen?: boolean;
  onAdvancedChange?: (open: boolean) => void;
  onCloseEdit?: () => void;
  onProductUpdated?: (product: CanonicalProduct) => void;
  product?: CanonicalProduct | null;
  twoColumn?: boolean;
}

export function ProductEntryForm({
  advancedOpen,
  onAdvancedChange,
  onCloseEdit,
  onProductUpdated,
  product,
  twoColumn = false,
}: Props) {
  const [internalAdvanced, setInternalAdvanced] = React.useState(false);
  const controlled = advancedOpen !== undefined;
  const showAdvanced = controlled ? advancedOpen : internalAdvanced;
  const setShowAdvanced = controlled ? (onAdvancedChange ?? (() => undefined)) : setInternalAdvanced;
  const controller = useProductEntryController({ onCloseEdit, onProductUpdated, product });
  const { form } = controller;
  const watched = form.watch();

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void form.handleSubmit(controller.submit)();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [controller.submit, form]);

  const essentials = (
    <EssentialsFields
      currency={controller.bootstrap.woocommerce.currencySymbol}
      form={form}
      images={controller.images}
      isVariable={controller.isVariable}
      nameRef={controller.nameInputRef}
      onImagesChange={controller.setImages}
      onVariableChange={controller.setIsVariable}
      typeLocked={controller.editing}
    />
  );
  const extended = (
    <ExtendedFields
      form={form}
      isVariable={controller.isVariable}
      onSaleEnd={controller.setSaleEnd}
      onSaleStart={controller.setSaleStart}
      saleEnd={controller.saleEnd}
      saleStart={controller.saleStart}
    />
  );
  const variations = controller.isVariable ? (
    <FormSection title="Attributes & variations" icon={Layers3}
      hint={`${controller.variationCombinations.length} concrete variations`}>
      <VariationsEditor
        attributes={controller.variableAttributes}
        combinations={controller.variationCombinations}
        onAttributesChange={controller.setVariableAttributes}
        onCombinationsChange={controller.setVariationCombinations}
      />
    </FormSection>
  ) : null;

  return (
    <Form {...form}>
      <form onSubmit={(event) => void form.handleSubmit(controller.submit)(event)}>
        {twoColumn ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="min-w-0">{essentials}</div>
              <div className="min-w-0 lg:border-s lg:border-border lg:ps-8">{extended}</div>
            </div>
            {variations}
          </div>
        ) : (
          <div className="stack-lg">
            {essentials}
            {variations}
            {!controlled && (
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost"
                    className="h-9 w-full justify-between text-[12px] text-muted-foreground hover:text-foreground">
                    <span>Extended options</span>
                    {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">{extended}</CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {form.formState.errors.root?.server?.message && (
          <p role="alert" className="mt-4 text-[12px] text-destructive">
            {form.formState.errors.root.server.message}
          </p>
        )}

        <EntryActionBar
          clearLabel={controller.editing ? "Reset changes" : "Clear"}
          disabled={!controller.canWrite}
          disabledReason={!controller.canWrite ? "This product operation is unavailable." : undefined}
          dirty={controller.editing
            ? form.formState.isDirty || controller.variableDirty
            : Boolean(watched.name || watched.regularPrice || watched.sku || controller.images.length
              || controller.variableAttributes.length || controller.variationCombinations.length)}
          isSubmitting={controller.editing ? controller.manage.isSaving : controller.create.isSubmitting}
          onClear={controller.reset}
          onSaveDraft={controller.editing ? undefined : controller.saveDraft}
          onTrash={controller.editing ? () => controller.setTrashOpen(true) : undefined}
          productName={watched.name}
          submitLabel={controller.editing ? "Save changes" : "Save & next"}
        />
      </form>

      <AlertDialog open={controller.conflictOpen} onOpenChange={controller.setConflictOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Newer product changes found</AlertDialogTitle>
          <AlertDialogDescription>Your edit was not saved because this product changed after you opened it. Reload the latest values before editing again.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep this draft</AlertDialogCancel>
          <AlertDialogAction onClick={() => void controller.reloadLatest()}>Reload latest</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={controller.trashOpen} onOpenChange={controller.setTrashOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Trash this WooCommerce product?</AlertDialogTitle>
          <AlertDialogDescription>This moves “{product?.name}” to WooCommerce trash. It is different from removing an entry from recent operations.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void controller.trash()}>Move to trash</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
