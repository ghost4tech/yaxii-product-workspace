import type { Product } from "@/types/product";
import { _x } from "@/production/core/i18n/wordpress";

export const STATUS_META: Record<
  Product["status"],
  { label: string; tone: string; dot: string }
> = {
  synced: { label: _x("Published", "Operation status", "yaxii-product-workspace"), tone: "text-success", dot: "bg-success" },
  pending: { label: _x("Pending", "Operation status", "yaxii-product-workspace"), tone: "text-warning", dot: "bg-warning" },
  error: { label: _x("Failed", "Operation status", "yaxii-product-workspace"), tone: "text-destructive", dot: "bg-destructive" },
  draft: { label: _x("Draft", "Operation status", "yaxii-product-workspace"), tone: "text-muted-foreground", dot: "bg-muted-foreground/50" },
};
