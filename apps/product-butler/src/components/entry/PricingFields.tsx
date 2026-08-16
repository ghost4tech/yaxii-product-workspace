import { CalendarDays, ChevronDown, ChevronUp, Tags } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormSection, FieldShell } from "@/components/entry/FormSection";
import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { createFormatters } from "@/production/core/i18n/formatters";
import { __ } from "@/production/core/i18n/wordpress";

interface Props {
  currency?: string;
  form: UseFormReturn<ProductEntryValues>;
  isVariable: boolean;
  onSaleEnd: (date?: Date) => void;
  onSaleStart: (date?: Date) => void;
  onScheduleOpenChange: (open: boolean) => void;
  saleEnd?: Date;
  saleStart?: Date;
  scheduleOpen: boolean;
}

function DatePick({ label, locale, onChange, value }: { label: string; locale: string; onChange: (date?: Date) => void; value?: Date }) {
  return <FieldShell label={label}>
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline"
          className={cn("ctl w-full justify-start font-normal text-[13px]", !value && "text-muted-foreground")}>
          <CalendarDays className="me-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{value ? createFormatters(locale).date(value) : __("Not scheduled", "yaxii-product-workspace")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <CalendarComponent mode="single" selected={value} onSelect={onChange} />
        {value && <div className="border-t border-border p-2">
          <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => onChange(undefined)}>
            {__("Clear date", "yaxii-product-workspace")}
          </Button>
        </div>}
      </PopoverContent>
    </Popover>
  </FieldShell>;
}

export function PricingFields({
  currency = "$", form, isVariable, onSaleEnd, onSaleStart, onScheduleOpenChange, saleEnd, saleStart, scheduleOpen,
}: Props) {
  const { bootstrap } = useWorkspaceRuntime();
  return (
    <FormSection title={__("Pricing", "yaxii-product-workspace")} icon={Tags}>
      <div className="grid grid-cols-2 gap-3">
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
              <label htmlFor="ypw-product-sale-price" className={cn('field-label', isVariable && 'text-muted-foreground')}>
                {__("Sale price", "yaxii-product-workspace")}
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
      </div>

      {!isVariable && (
        <Collapsible open={scheduleOpen} onOpenChange={onScheduleOpenChange}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost"
              className="h-7 justify-start gap-1.5 px-0 text-[12px] text-muted-foreground hover:bg-transparent hover:text-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {__("Schedule sale", "yaxii-product-workspace")}
              {scheduleOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-3">
              <DatePick label={__("Starts", "yaxii-product-workspace")} locale={bootstrap.locale} value={saleStart} onChange={onSaleStart} />
              <DatePick label={__("Ends", "yaxii-product-workspace")} locale={bootstrap.locale} value={saleEnd} onChange={onSaleEnd} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </FormSection>
  );
}
