import { Boxes, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/entry/FormSection";
import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import { usePrefsStore } from "@/stores/prefsStore";
import { __ } from "@/production/core/i18n/wordpress";

export function InventoryFields({ form }: { form: UseFormReturn<ProductEntryValues> }) {
  const hidden = usePrefsStore((state) => state.prefs.hiddenOptionalSections);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const showSku = !hidden.includes("sku");
  const showAdvanced = !hidden.includes("advancedInventory");

  return (
    <FormSection title={__("Inventory", "yaxii-product-workspace")} icon={Boxes}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {showSku && (
          <FormField control={form.control} name="sku" render={({ field }) => (
            <FormItem className="space-y-0">
              <label className="field-label" htmlFor="ypw-product-sku">SKU</label>
              <FormControl>
                <Input {...field} id="ypw-product-sku" placeholder="SKU-1024" autoComplete="off"
                  className="ctl ctl-input font-mono" dir="ltr" />
              </FormControl>
              <FormMessage className="text-[11px] mt-1" />
            </FormItem>
          )} />
        )}
        <FormField control={form.control} name="stockQuantity" render={({ field }) => (
          <FormItem className="space-y-0">
            <label htmlFor="ypw-product-stock" className="field-label">{__("Quantity", "yaxii-product-workspace")}</label>
            <FormControl>
              <div className="input-group">
                <input
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    if (event.target.value.trim()) form.setValue('manageStock', true, { shouldDirty: true });
                  }}
                  id="ypw-product-stock"
                  type="number"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="0"
                  className="font-mono"
                />
                <span className="input-affix input-affix-end">{__("units", "yaxii-product-workspace")}</span>
              </div>
            </FormControl>
            <FormMessage className="text-[11px] mt-1" />
          </FormItem>
        )} />
        <FormField control={form.control} name="stockStatus" render={({ field }) => (
          <FormItem className="space-y-0">
            <label className="field-label">{__("Stock status", "yaxii-product-workspace")}</label>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger aria-label={__("Stock status", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="instock">{__("In stock", "yaxii-product-workspace")}</SelectItem>
                <SelectItem value="outofstock">{__("Out of stock", "yaxii-product-workspace")}</SelectItem>
                <SelectItem value="onbackorder">{__("On backorder", "yaxii-product-workspace")}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[11px] mt-1" />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="manageStock" render={({ field }) => (
        <FormItem className="flex items-center gap-2 space-y-0">
          <FormControl><Switch id="ypw-manage-stock" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          <label htmlFor="ypw-manage-stock" className="text-xs font-medium">{__("Manage stock", "yaxii-product-workspace")}</label>
          <FormMessage />
        </FormItem>
      )} />

      {showAdvanced && (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost"
              className="h-7 justify-start gap-1.5 px-0 text-[12px] text-muted-foreground hover:bg-transparent hover:text-foreground">
              {__("More inventory options", "yaxii-product-workspace")}
              {advancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            <FormField control={form.control} name="backorders" render={({ field }) => (
              <FormItem className="space-y-0">
                <label className="field-label">{__("Backorders", "yaxii-product-workspace")}</label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger aria-label={__("Backorders", "yaxii-product-workspace")} className="ctl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="no">{__("Do not allow", "yaxii-product-workspace")}</SelectItem>
                    <SelectItem value="notify">{__("Allow, but notify customer", "yaxii-product-workspace")}</SelectItem>
                    <SelectItem value="yes">{__("Allow", "yaxii-product-workspace")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="soldIndividually" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl><Switch id="ypw-sold-individually" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <label htmlFor="ypw-sold-individually" className="text-xs font-medium">{__("Sold individually", "yaxii-product-workspace")}</label>
                <FormMessage />
              </FormItem>
            )} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </FormSection>
  );
}
