import React from 'react';
import { CalendarDays, FileText } from 'lucide-react';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormSection, FieldShell } from '@/components/entry/FormSection';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductEntryValues } from '@/components/entry/productEntryModel';
import { PublishingInventoryFields } from './PublishingInventoryFields';
import { ShippingTaxFields } from './ShippingTaxFields';

interface Props {
  form: UseFormReturn<ProductEntryValues>;
  isVariable: boolean;
  saleStart?: Date;
  saleEnd?: Date;
  onSaleStart: (d?: Date) => void;
  onSaleEnd: (d?: Date) => void;
}

const DatePick: React.FC<{
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}> = ({ label, value, onChange }) => (
  <FieldShell label={label}>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'ctl w-full justify-start font-normal text-[13px]',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarDays className="me-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{value ? format(value, 'PP') : 'Not scheduled'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <CalendarComponent mode="single" selected={value} onSelect={onChange} />
        {value && (
          <div className="p-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => onChange(undefined)}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  </FieldShell>
);

export const ExtendedFields: React.FC<Props> = ({
  form,
  isVariable,
  saleStart,
  saleEnd,
  onSaleStart,
  onSaleEnd,
}) => (
  <div className="stack-lg">
    <FormSection title="Descriptions" icon={FileText}>
      <FormField
        control={form.control}
        name="shortDescription"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <label className="field-label" htmlFor="ypw-product-short-description">Short description</label>
            <FormControl>
              <Textarea
                {...field}
                id="ypw-product-short-description"
                placeholder="One or two lines shown near the price…"
                rows={3}
                className="text-[13px] resize-y"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="longDescription"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <label className="field-label" htmlFor="ypw-product-long-description">Long description</label>
            <FormControl>
              <Textarea
                {...field}
                id="ypw-product-long-description"
                placeholder="Full product description, materials, care instructions…"
                rows={7}
                className="text-[13px] resize-y"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </FormSection>

    {!isVariable && (
      <FormSection title="Sale schedule" icon={CalendarDays} hint="Optional">
        <div className="grid grid-cols-2 gap-3">
          <DatePick label="Starts" value={saleStart} onChange={onSaleStart} />
          <DatePick label="Ends" value={saleEnd} onChange={onSaleEnd} />
        </div>
      </FormSection>
    )}
    <PublishingInventoryFields form={form} />
    <ShippingTaxFields form={form} />
  </div>
);
