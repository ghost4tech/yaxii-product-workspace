import type { Product } from "@/types/product";

export const STATUS_META: Record<
  Product["status"],
  { label: string; tone: string; dot: string }
> = {
  synced: { label: "Synced", tone: "text-success", dot: "bg-success" },
  pending: { label: "Pending", tone: "text-warning", dot: "bg-warning" },
  error: { label: "Failed", tone: "text-destructive", dot: "bg-destructive" },
  draft: { label: "Draft", tone: "text-muted-foreground", dot: "bg-muted-foreground/50" },
};
