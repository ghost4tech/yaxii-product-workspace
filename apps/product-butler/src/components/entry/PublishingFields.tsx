import { Eye } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "./FormSection";
import type { ProductEntryValues } from "./productEntryModel";
import { __, _x } from "@/production/core/i18n/wordpress";

export function PublishingFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  return (
    <FormSection title={__("Publishing", "yaxii-product-workspace")} icon={Eye}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField control={form.control} name="productStatus" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">{__("Status", "yaxii-product-workspace")}</label>
            <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label={__("Product status", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent><SelectItem value="publish">{_x("Published", "Product status", "yaxii-product-workspace")}</SelectItem><SelectItem value="draft">{_x("Draft", "Product status", "yaxii-product-workspace")}</SelectItem><SelectItem value="pending">{_x("Pending review", "Product status", "yaxii-product-workspace")}</SelectItem></SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="catalogVisibility" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label">{__("Catalog visibility", "yaxii-product-workspace")}</label>
            <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label={__("Catalog visibility", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent><SelectItem value="visible">{__("Shop & search", "yaxii-product-workspace")}</SelectItem><SelectItem value="catalog">{__("Shop only", "yaxii-product-workspace")}</SelectItem><SelectItem value="search">{__("Search only", "yaxii-product-workspace")}</SelectItem><SelectItem value="hidden">{__("Hidden", "yaxii-product-workspace")}</SelectItem></SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
      </div>
    </FormSection>
  );
}
