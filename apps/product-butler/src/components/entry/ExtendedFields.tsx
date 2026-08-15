import { CalendarDays } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormSection, FieldShell } from "@/components/entry/FormSection";
import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import { PublishingInventoryFields } from "@/components/entry/PublishingInventoryFields";
import { ShippingTaxFields } from "@/components/entry/ShippingTaxFields";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { createFormatters } from "@/production/core/i18n/formatters";
import { __ } from "@/production/core/i18n/wordpress";

interface Props {
  form: UseFormReturn<ProductEntryValues>;
  isVariable: boolean;
  onSaleEnd: (date?: Date) => void;
  onSaleStart: (date?: Date) => void;
  saleEnd?: Date;
  saleStart?: Date;
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

export function ExtendedFields({ form, isVariable, onSaleEnd, onSaleStart, saleEnd, saleStart }: Props) {
  const { bootstrap } = useWorkspaceRuntime();
  return <div className="stack-lg">
    {!isVariable && <FormSection title={__("Sale schedule", "yaxii-product-workspace")} icon={CalendarDays} hint={__("Optional", "yaxii-product-workspace")}>
      <div className="grid grid-cols-2 gap-3">
        <DatePick label={__("Starts", "yaxii-product-workspace")} locale={bootstrap.locale} value={saleStart} onChange={onSaleStart} />
        <DatePick label={__("Ends", "yaxii-product-workspace")} locale={bootstrap.locale} value={saleEnd} onChange={onSaleEnd} />
      </div>
    </FormSection>}
    <PublishingInventoryFields form={form} />
    <ShippingTaxFields form={form} />
  </div>;
}
