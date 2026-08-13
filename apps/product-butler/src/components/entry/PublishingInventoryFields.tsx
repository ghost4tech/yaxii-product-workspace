import { Boxes, Eye } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "./FormSection";
import type { ProductEntryValues } from "./productEntryModel";

export function PublishingInventoryFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  return (
    <>
      <FormSection title="Publishing" icon={Eye}>
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem className="space-y-0"><label className="field-label" htmlFor="ypw-slug">Slug</label>
            <FormControl><Input {...field} id="ypw-slug" className="ctl ctl-input font-mono" placeholder="auto-from-name" /></FormControl><FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="productStatus" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Status</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label="Product status" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="publish">Published</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="pending">Pending review</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="catalogVisibility" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Catalog visibility</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label="Catalog visibility" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="visible">Shop & search</SelectItem><SelectItem value="catalog">Shop only</SelectItem><SelectItem value="search">Search only</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
      </FormSection>

      <FormSection title="Inventory" icon={Boxes}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="stockStatus" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Stock status</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label="Stock status" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="instock">In stock</SelectItem><SelectItem value="outofstock">Out of stock</SelectItem><SelectItem value="onbackorder">On backorder</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="backorders" render={({ field }) => (
            <FormItem className="space-y-0"><label className="field-label">Backorders</label>
              <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger aria-label="Backorders" className="ctl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="no">Do not allow</SelectItem><SelectItem value="notify">Allow, notify</SelectItem><SelectItem value="yes">Allow</SelectItem></SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex flex-wrap gap-6">
          <FormField control={form.control} name="manageStock" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch id="ypw-manage-stock" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <label htmlFor="ypw-manage-stock" className="text-xs font-medium">Manage stock</label><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="soldIndividually" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch id="ypw-sold-individually" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <label htmlFor="ypw-sold-individually" className="text-xs font-medium">Sold individually</label><FormMessage /></FormItem>
          )} />
        </div>
      </FormSection>
    </>
  );
}
