import { Receipt, Truck } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { FormSection } from "./FormSection";
import type { ProductEntryValues } from "./productEntryModel";
import { TermPicker } from "./TermPicker";
import { __ } from "@/production/core/i18n/wordpress";

const dimensionLabels = {
  height: __("Height", "yaxii-product-workspace"),
  length: __("Length", "yaxii-product-workspace"),
  weight: __("Weight", "yaxii-product-workspace"),
  width: __("Width", "yaxii-product-workspace"),
};

export function ShippingTaxFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  const { bootstrap } = useWorkspaceRuntime();
  return (
    <>
      <FormSection title={__("Shipping", "yaxii-product-workspace")} icon={Truck}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["weight", "length", "width", "height"] as const).map((name) => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem className="space-y-0"><label className="field-label" htmlFor={`ypw-${name}`}>{dimensionLabels[name]}</label>
                <FormControl><div className="input-group"><input {...field} id={`ypw-${name}`} inputMode="decimal" className="font-mono" dir="ltr" />
                  <span className="input-affix input-affix-end">{name === "weight" ? bootstrap.woocommerce.weightUnit : bootstrap.woocommerce.dimensionUnit}</span></div></FormControl><FormMessage />
              </FormItem>
            )} />
          ))}
        </div>
        <FormField control={form.control} name="shippingClassId" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">{__("Shipping class", "yaxii-product-workspace")}</label>
            <FormControl><TermPicker kind="shipping" label={__("Shipping class", "yaxii-product-workspace")} multiple={false} value={field.value ? [field.value] : []}
              onChange={(ids) => field.onChange(ids[0] ?? 0)} /></FormControl><FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <FormSection title={__("Tax & organization", "yaxii-product-workspace")} icon={Receipt}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="taxStatus" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">{__("Tax status", "yaxii-product-workspace")}</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label={__("Tax status", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="taxable">{__("Taxable", "yaxii-product-workspace")}</SelectItem><SelectItem value="shipping">{__("Shipping only", "yaxii-product-workspace")}</SelectItem><SelectItem value="none">{__("None", "yaxii-product-workspace")}</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="taxClass" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">{__("Tax class", "yaxii-product-workspace")}</label>
              <Select value={field.value || "standard"} onValueChange={(value) => field.onChange(value === "standard" ? "" : value)}><FormControl><SelectTrigger aria-label={__("Tax class", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="standard">{__("Standard", "yaxii-product-workspace")}</SelectItem>{bootstrap.woocommerce.taxClasses.filter((item) => item.slug).map((item) => <SelectItem key={item.slug} value={item.slug}><bdi dir="auto">{item.name}</bdi></SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="additionalCategoryIds" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">{__("Additional categories", "yaxii-product-workspace")}</label>
            <FormControl><TermPicker kind="category" label={__("Additional categories", "yaxii-product-workspace")} value={field.value} onChange={field.onChange} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tagIds" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">{__("Tags", "yaxii-product-workspace")}</label>
            <FormControl><TermPicker kind="tag" label={__("Tags", "yaxii-product-workspace")} value={field.value} onChange={field.onChange} /></FormControl><FormMessage />
          </FormItem>
        )} />
      </FormSection>
    </>
  );
}
