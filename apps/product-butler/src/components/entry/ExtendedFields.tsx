import type { UseFormReturn } from "react-hook-form";
import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import { PublishingFields } from "@/components/entry/PublishingFields";
import { ShippingTaxFields } from "@/components/entry/ShippingTaxFields";

interface Props {
  form: UseFormReturn<ProductEntryValues>;
}

export function ExtendedFields({ form }: Props) {
  return <div className="stack-lg">
    <PublishingFields form={form} />
    <ShippingTaxFields form={form} />
  </div>;
}
