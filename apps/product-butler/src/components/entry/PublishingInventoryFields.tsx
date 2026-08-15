import { Boxes, Eye } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "./FormSection";
import type { ProductEntryValues } from "./productEntryModel";
import { __, _x } from "@/production/core/i18n/wordpress";

export function PublishingInventoryFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  return (
    <>
      <FormSection title={__("Publishing", "yaxii-product-workspace")} icon={Eye}>
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label" htmlFor="ypw-slug">{__("Slug", "yaxii-product-workspace")}</label>
            <FormControl><Input {...field} id="ypw-slug" className="ctl ctl-input font-mono" placeholder="auto-from-name" dir="ltr" /></FormControl><FormMessage />
          </FormItem>
        )} />
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

      <FormSection title={__("Inventory", "yaxii-product-workspace")} icon={Boxes}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="stockStatus" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">{__("Stock status", "yaxii-product-workspace")}</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label={__("Stock status", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="instock">{__("In stock", "yaxii-product-workspace")}</SelectItem><SelectItem value="outofstock">{__("Out of stock", "yaxii-product-workspace")}</SelectItem><SelectItem value="onbackorder">{__("On backorder", "yaxii-product-workspace")}</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="backorders" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">{__("Backorders", "yaxii-product-workspace")}</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label={__("Backorders", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="no">{__("Do not allow", "yaxii-product-workspace")}</SelectItem><SelectItem value="notify">{__("Allow, but notify customer", "yaxii-product-workspace")}</SelectItem><SelectItem value="yes">{__("Allow", "yaxii-product-workspace")}</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex flex-wrap gap-6">
          <FormField control={form.control} name="manageStock" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch id="ypw-manage-stock" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <label htmlFor="ypw-manage-stock" className="text-xs font-medium">{__("Manage stock", "yaxii-product-workspace")}</label><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="soldIndividually" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch id="ypw-sold-individually" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <label htmlFor="ypw-sold-individually" className="text-xs font-medium">{__("Sold individually", "yaxii-product-workspace")}</label><FormMessage /></FormItem>
          )} />
        </div>
      </FormSection>
    </>
  );
}
