import { useState } from "react";
import { Check, FileText } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "@/components/entry/FormSection";
import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import { RichTextEditor } from "@/components/RichTextEditor";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";
import { __ } from "@/production/core/i18n/wordpress";

interface Props {
  compact?: boolean;
  form: UseFormReturn<ProductEntryValues>;
  onUploadImage: (file: File) => Promise<ProductImage>;
}

const hasContent = (html?: string) => Boolean(html && html.replace(/<[^>]*>/g, "").trim());

export function DescriptionFields({ compact = false, form, onUploadImage }: Props) {
  const [tab, setTab] = useState<"short" | "long">("short");
  const short = form.watch("shortDescription");
  const long = form.watch("longDescription");
  const shortField = <FormField control={form.control} name="shortDescription" render={({ field }) => (
    <FormItem className="space-y-0">
      {!compact && <label className="field-label">{__("Short description", "yaxii-product-workspace")}</label>}
      <FormControl><RichTextEditor ariaLabel={__("Short description", "yaxii-product-workspace")} value={field.value || ""} onChange={field.onChange}
        onUploadImage={onUploadImage} placeholder={__("One or two lines shown near the price…", "yaxii-product-workspace")} minHeight={compact ? 96 : 90} /></FormControl>
    </FormItem>
  )} />;
  const longField = <FormField control={form.control} name="longDescription" render={({ field }) => (
    <FormItem className="space-y-0">
      {!compact && <label className="field-label">{__("Long description", "yaxii-product-workspace")}</label>}
      <FormControl><RichTextEditor ariaLabel={__("Full description", "yaxii-product-workspace")} value={field.value || ""} onChange={field.onChange}
        onUploadImage={onUploadImage}
        placeholder={__("Full description, materials, care instructions… Add images, lists, and links.", "yaxii-product-workspace")}
        minHeight={compact ? 170 : 220} /></FormControl>
    </FormItem>
  )} />;

  if (!compact) return <FormSection title={__("Descriptions", "yaxii-product-workspace")} icon={FileText} hint={__("Rich text and images supported", "yaxii-product-workspace")}>
    {shortField}{longField}
  </FormSection>;

  const tabs = [
    { filled: hasContent(short), key: "short" as const, label: __("Short", "yaxii-product-workspace") },
    { filled: hasContent(long), key: "long" as const, label: __("Full", "yaxii-product-workspace") },
  ];
  return <FormSection title={__("Descriptions", "yaxii-product-workspace")} icon={FileText} action={<div className="seg" role="tablist" aria-label={__("Description type", "yaxii-product-workspace")}>
    {tabs.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key}
      onClick={() => setTab(item.key)} data-active={tab === item.key} className="seg-item">
      {item.label}{item.filled && <Check className={cn("h-3 w-3", tab === item.key ? "text-success" : "text-success/70")} />}
    </button>)}
  </div>}>
    <div className={tab === "short" ? "block" : "hidden"}>{shortField}</div>
    <div className={tab === "long" ? "block" : "hidden"}>{longField}</div>
  </FormSection>;
}
