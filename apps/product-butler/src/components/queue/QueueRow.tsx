import { format, formatDistanceToNow } from "date-fns";
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

interface QueueRowProps {
  compact: boolean;
  onDelete: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onRetry?: (product: Product) => void;
  product: Product;
  relativeTimestamps: boolean;
}

export function QueueRow({
  compact,
  onDelete,
  onEdit,
  onRetry,
  product,
  relativeTimestamps,
}: QueueRowProps) {
  const meta = STATUS_META[product.status];

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
        <p className="truncate text-[13px] font-medium leading-tight">{product.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {product.sku && <span className="truncate font-mono">{product.sku}</span>}
          {product.sku && <span className="opacity-40">·</span>}
          <span className="truncate">
            {relativeTimestamps
              ? formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })
              : format(new Date(product.createdAt), "d MMM, HH:mm")}
          </span>
          {product.isVariable && (
            <>
              <span className="opacity-40">·</span>
              <span>variable</span>
            </>
          )}
        </div>
        {product.status === "error" && product.errorMessage && (
          <p className="mt-1 truncate text-[11px] text-destructive">{product.errorMessage}</p>
        )}
      </div>

      {!compact && (
        <div className="w-24 shrink-0 text-end">
          <span className="text-[13px] font-medium tabular-nums">
            {product.regularPrice ? `$${product.regularPrice}` : "—"}
          </span>
          {product.salePrice && (
            <span className="block text-[11px] tabular-nums text-success">${product.salePrice}</span>
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
            <span className="sr-only">Product actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="me-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          {product.status === "error" && onRetry && (
            <DropdownMenuItem onClick={() => onRetry(product)}>
              <RefreshCw className="me-2 h-4 w-4" /> Retry sync
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
            <Trash2 className="me-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
