import { Edit, MoreHorizontal, Package, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { STATUS_META } from "./statusMeta";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { formattingLanguageTag } from "@/production/core/i18n/formatters";
import { __ } from "@/production/core/i18n/wordpress";

function timestamp(value: Date, locale: string, relative: boolean): string {
  const date = new Date(value);
  const languageTag = formattingLanguageTag(locale);
  if (!relative) {
    return new Intl.DateTimeFormat(languageTag, {
      day: "numeric", hour: "2-digit", minute: "2-digit", month: "short",
    }).format(date);
  }
  const seconds = Math.round((date.getTime() - Date.now()) / 1_000);
  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [86_400, "day"], [3_600, "hour"], [60, "minute"], [1, "second"],
  ];
  const [divisor, unit] = divisions.find(([candidate]) => Math.abs(seconds) >= candidate) ?? divisions[3]!;
  return new Intl.RelativeTimeFormat(languageTag, { numeric: "auto" }).format(Math.round(seconds / divisor), unit);
}

interface QueueRowProps {
  compact: boolean;
  onDelete: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onReconcile?: (product: Product) => void;
  onRetry?: (product: Product) => void;
  product: Product;
  relativeTimestamps: boolean;
}

export function QueueRow({
  compact,
  onDelete,
  onEdit,
  onReconcile,
  onRetry,
  product,
  relativeTimestamps,
}: QueueRowProps) {
  const meta = STATUS_META[product.status];
  const { bootstrap } = useWorkspaceRuntime();

  return (
    <li className={cn("data-row group", product.status === "error" && "bg-destructive/[0.035]")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted">
        {product.images[0] ? (
          <img src={product.images[0].preview} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-start text-[13px] font-medium leading-tight">{product.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {product.sku && <bdi className="truncate font-mono" dir="ltr">{product.sku}</bdi>}
          {product.sku && <span className="opacity-40">·</span>}
          <span className="truncate">
            {timestamp(product.createdAt, bootstrap.locale, relativeTimestamps)}
          </span>
          {product.isVariable && (
            <>
              <span className="opacity-40">·</span>
              <span>{__("variable", "yaxii-product-workspace")}</span>
            </>
          )}
        </div>
        {product.status === "error" && product.errorMessage && (
          <p className="mt-1 truncate text-[11px] text-destructive">{product.errorMessage}</p>
        )}
        {product.status === "error" && product.variationFailures?.map((failure) => (
          <p key={failure} className="mt-1 break-words font-mono text-[10px] text-destructive">{failure}</p>
        ))}
      </div>

      {!compact && (
        <div className="w-24 shrink-0 text-start">
          <bdi className="text-[13px] font-medium tabular-nums" dir="ltr">
            {product.regularPrice ? `${product.currencySymbol ?? ""}${product.regularPrice}` : "—"}
          </bdi>
          {product.salePrice && (
            <bdi className="block text-[11px] tabular-nums text-success" dir="ltr">{product.currencySymbol ?? ""}{product.salePrice}</bdi>
          )}
        </div>
      )}

      <div className="w-auto shrink-0 sm:w-20">
        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded border border-current/15 bg-current/[0.06] px-1.5 text-[11px] font-medium", meta.tone)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          <span className="hidden sm:inline">{meta.label}</span>
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{__("Product actions", "yaxii-product-workspace")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {product.wooCommerceId && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="me-2 h-4 w-4" /> {__("Edit", "yaxii-product-workspace")}
            </DropdownMenuItem>
          )}
          {product.status === "error" && product.canRetry && onRetry && (
            <DropdownMenuItem onClick={() => onRetry(product)}>
              <RefreshCw className="me-2 h-4 w-4" /> {__("Retry safely", "yaxii-product-workspace")}
            </DropdownMenuItem>
          )}
          {product.status === "pending" && product.canReconcile && onReconcile && (
            <DropdownMenuItem onClick={() => onReconcile(product)}>
              <RefreshCw className="me-2 h-4 w-4" /> {__("Reconcile", "yaxii-product-workspace")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
            <Trash2 className="me-2 h-4 w-4" /> {__("Remove from queue", "yaxii-product-workspace")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
