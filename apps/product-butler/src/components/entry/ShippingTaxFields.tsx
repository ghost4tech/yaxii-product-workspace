import { Receipt, Truck } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { FormSection } from "./FormSection";
import type { ProductEntryValues } from "./productEntryModel";
import { TermPicker } from "./TermPicker";

export function ShippingTaxFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  const { bootstrap } = useWorkspaceRuntime();
  return (
    <>
      <FormSection title="Shipping" icon={Truck}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["weight", "length", "width", "height"] as const).map((name) => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem className="space-y-0"><label className="field-label" htmlFor={`ypw-${name}`}>{name[0]?.toUpperCase()}{name.slice(1)}</label>
                <FormControl><div className="input-group"><input {...field} id={`ypw-${name}`} inputMode="decimal" className="font-mono" />
                  <span className="input-affix input-affix-end">{name === "weight" ? bootstrap.woocommerce.weightUnit : bootstrap.woocommerce.dimensionUnit}</span></div></FormControl><FormMessage />
              </FormItem>
            )} />
          ))}
        </div>
        <FormField control={form.control} name="shippingClassId" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">Shipping class</label>
            <FormControl><TermPicker kind="shipping" label="Shipping class" multiple={false} value={field.value ? [field.value] : []}
              onChange={(ids) => field.onChange(ids[0] ?? 0)} /></FormControl><FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <FormSection title="Tax & organization" icon={Receipt}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="taxStatus" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Tax status</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label="Tax status" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="taxable">Taxable</SelectItem><SelectItem value="shipping">Shipping only</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="taxClass" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Tax class</label>
              <Select value={field.value || "standard"} onValueChange={(value) => field.onChange(value === "standard" ? "" : value)}><FormControl><SelectTrigger aria-label="Tax class" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="standard">Standard</SelectItem>{bootstrap.woocommerce.taxClasses.filter((item) => item.slug).map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="additionalCategoryIds" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">Additional categories</label>
            <FormControl><TermPicker kind="category" label="Additional categories" value={field.value} onChange={field.onChange} /></FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tagIds" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">Tags</label>
            <FormControl><TermPicker kind="tag" label="Tags" value={field.value} onChange={field.onChange} /></FormControl><FormMessage />
          </FormItem>
        )} />
      </FormSection>
    </>
  );
}
