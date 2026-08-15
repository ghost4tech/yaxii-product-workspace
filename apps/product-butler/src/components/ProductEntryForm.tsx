import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
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
import { DescriptionFields } from "@/components/entry/DescriptionFields";
import { EssentialsFields } from "@/components/entry/EssentialsFields";
import { ExtendedFields } from "@/components/entry/ExtendedFields";
import { useProductEntryController } from "@/components/entry/useProductEntryController";
import { __, sprintf } from "@/production/core/i18n/wordpress";

interface Props {
  advancedOpen?: boolean;
  onAdvancedChange?: (open: boolean) => void;
  onCloseEdit?: () => void;
  onProductSaved?: (product: CanonicalProduct, updated: boolean) => void;
  onProductUpdated?: (product: CanonicalProduct) => void;
  product?: CanonicalProduct | null;
  twoColumn?: boolean;
}

export function ProductEntryForm({
  advancedOpen,
  onAdvancedChange,
  onCloseEdit,
  onProductSaved,
  onProductUpdated,
  product,
  twoColumn = false,
}: Props) {
  const [internalAdvanced, setInternalAdvanced] = React.useState(false);
  const controlled = advancedOpen !== undefined;
  const showAdvanced = controlled ? advancedOpen : internalAdvanced;
  const setShowAdvanced = controlled ? (onAdvancedChange ?? (() => undefined)) : setInternalAdvanced;
  const controller = useProductEntryController({ onCloseEdit, onProductSaved, onProductUpdated, product });
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
      attributes={controller.variableAttributes}
      combinations={controller.variationCombinations}
      form={form}
      images={controller.images}
      isVariable={controller.isVariable}
      nameRef={controller.nameInputRef}
      onImagesChange={controller.setImages}
      onAttributesChange={controller.setVariableAttributes}
      onCombinationsChange={controller.setVariationCombinations}
      onUploadImage={controller.uploadMedia}
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
  const descriptions = <DescriptionFields form={form} onUploadImage={controller.uploadMedia} />;

  return (
    <Form {...form}>
      <form onSubmit={(event) => void form.handleSubmit(controller.submit)(event)}>
        {controller.editing && <div className="mb-4 flex h-9 items-center gap-2 rounded-md border border-info/25 bg-info/[0.07] px-3 text-[12px]">
          <Pencil className="h-3.5 w-3.5 shrink-0 text-info" />
          <span className="truncate text-start">{__("Editing", "yaxii-product-workspace")} <span className="font-semibold">{product?.name}</span></span>
          <button type="button" onClick={controller.cancelEdit}
            className="ms-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> {__("Cancel", "yaxii-product-workspace")}
          </button>
        </div>}
        {twoColumn ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="min-w-0">{essentials}</div>
              <div className="min-w-0 stack-lg lg:border-s lg:border-border lg:ps-8">{descriptions}{extended}</div>
            </div>
          </div>
        ) : (
          <div className="stack-lg">
            {essentials}
            <DescriptionFields compact form={form} onUploadImage={controller.uploadMedia} />
            {!controlled && (
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost"
                    className="h-9 w-full justify-between text-[12px] text-muted-foreground hover:text-foreground">
                    <span>{__("Extended options", "yaxii-product-workspace")}</span>
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
          clearLabel={controller.editing ? __("Reset changes", "yaxii-product-workspace") : __("Clear", "yaxii-product-workspace")}
          disabled={!controller.canWrite}
          disabledReason={!controller.canWrite ? __("This product operation is unavailable.", "yaxii-product-workspace") : undefined}
          dirty={controller.editing
            ? form.formState.isDirty || controller.variableDirty
            : Boolean(watched.name || watched.regularPrice || watched.sku || controller.images.length
              || controller.variableAttributes.length || controller.variationCombinations.length)}
          isSubmitting={controller.editing ? controller.manage.isSaving : controller.create.isSubmitting}
          onClear={controller.reset}
          onSaveDraft={controller.editing ? undefined : controller.saveDraft}
          onTrash={controller.editing ? () => controller.setTrashOpen(true) : undefined}
          productName={watched.name}
          submitLabel={controller.editing ? __("Update product", "yaxii-product-workspace") : __("Save & next", "yaxii-product-workspace")}
        />
      </form>

      <AlertDialog open={controller.conflictOpen} onOpenChange={controller.setConflictOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{__("Newer product changes found", "yaxii-product-workspace")}</AlertDialogTitle>
          <AlertDialogDescription>{__("Your edit was not saved because this product changed after you opened it. Reload the latest values before editing again.", "yaxii-product-workspace")}</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{__("Keep this draft", "yaxii-product-workspace")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void controller.reloadLatest()}>{__("Reload latest", "yaxii-product-workspace")}</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={controller.trashOpen} onOpenChange={controller.setTrashOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{__("Trash this WooCommerce product?", "yaxii-product-workspace")}</AlertDialogTitle>
          <AlertDialogDescription>{
            /* translators: %s: product name. */
            sprintf(__("This moves “%s” to WooCommerce trash. It is different from removing an entry from recent operations.", "yaxii-product-workspace"), product?.name ?? "")
          }</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{__("Cancel", "yaxii-product-workspace")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void controller.trash()}>{__("Move to trash", "yaxii-product-workspace")}</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
