import { format, isToday, isYesterday } from "date-fns";
import { Inbox, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QueueRow } from "@/components/queue/QueueRow";
import { STATUS_META } from "@/components/queue/statusMeta";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import type { Product } from "@/types/product";

interface ProductQueueProps {
  onEdit?: (product: Product) => void;
  onRetry?: (product: Product) => void;
  compact?: boolean;
}

type StatusKey = "all" | Product["status"];

function dayLabel(date: Date) {
  return isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEE, d MMM");
}

export const ProductQueue = ({ compact = false, onEdit, onRetry }: ProductQueueProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [visible, setVisible] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const { deleteProduct, products, setLastDeletedProduct } = useProductStore();
  const prefs = usePrefsStore((state) => state.prefs);
  const pageSize = visible ?? prefs.queueRowsPerPage;

  const counts = useMemo(
    () =>
      products.reduce(
        (result, product) => ({ ...result, [product.status]: result[product.status] + 1 }),
        { synced: 0, pending: 0, error: 0, draft: 0 } as Record<Product["status"], number>,
      ),
    [products],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
      return matchesSearch && (statusFilter === "all" || product.status === statusFilter);
    });
  }, [products, searchQuery, statusFilter]);

  const shown = filtered.slice(0, pageSize);
  const groups = useMemo(() => {
    if (!prefs.queueGroupByDay) return [{ key: "", items: shown }];
    const grouped = new Map<string, Product[]>();
    shown.forEach((product) => {
      const key = dayLabel(new Date(product.createdAt));
      grouped.set(key, [...(grouped.get(key) ?? []), product]);
    });
    return Array.from(grouped, ([key, items]) => ({ key, items }));
  }, [prefs.queueGroupByDay, shown]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && searchQuery) setSearchQuery("");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchQuery]);

  const performDelete = (product: Product) => {
    setLastDeletedProduct(product);
    deleteProduct(product.id);
  };
  const handleDelete = (product: Product) => {
    if (prefs.confirmBeforeDelete) setPendingDelete(product);
    else performDelete(product);
  };
  const tabs = [
    { key: "all" as const, label: "All", count: products.length },
    ...(["synced", "pending", "error", "draft"] as const).map((key) => ({
      key,
      label: STATUS_META[key].label,
      count: counts[key],
    })),
  ];

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="space-y-3 border-b border-border px-4 pb-3 pt-3.5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-[14px] font-semibold">Recent products</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {filtered.length === products.length ? `${products.length} products` : `${filtered.length} of ${products.length}`}
            </span>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name or SKU…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn("h-8 w-full bg-muted/40 ps-8 text-xs", compact ? "sm:w-40" : "sm:w-52")}
            />
          </div>
        </div>
        <div className="-mx-0.5 flex items-center gap-1 overflow-x-auto px-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[12px] font-medium transition-colors",
                statusFilter === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              type="button"
            >
              {tab.key !== "all" && <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[tab.key].dot)} />}
              {tab.label} <span className="tabular-nums opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 && (
        <div className="data-head">
          <span className="w-8" /><span className="flex-1">Product</span>
          {!compact && <span className="w-24 text-end">Price</span>}
          <span className="w-20">Status</span><span className="w-8" />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Inbox className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold">{products.length === 0 ? "Queue is empty" : "No matching products"}</h3>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              {products.length === 0
                ? "Server product operations will appear here when the Phase 2 write layer is available."
                : "Adjust the search term or pick a different status."}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key || "all"}>
              {group.key && <div className="label-eyebrow sticky top-0 z-10 border-b border-border/70 bg-background/95 px-4 py-1.5 backdrop-blur">{group.key}</div>}
              <ul className="divide-y divide-border/70">
                {group.items.map((product) => (
                  <QueueRow
                    key={product.id}
                    compact={compact}
                    onDelete={handleDelete}
                    onEdit={onEdit}
                    onRetry={onRetry}
                    product={product}
                    relativeTimestamps={prefs.relativeTimestamps}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        {filtered.length > shown.length ? (
          <button onClick={() => setVisible(pageSize + prefs.queueRowsPerPage)} className="font-medium text-foreground hover:underline" type="button">
            Load {Math.min(prefs.queueRowsPerPage, filtered.length - shown.length)} more
          </button>
        ) : prefs.showKeyboardHints ? <span><kbd className="kbd">Esc</kbd> clear search</span> : <span>Showing all {filtered.length}</span>}
        <span className="flex items-center gap-1.5 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />Live sync off</span>
      </div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>“{pendingDelete?.name}” will be removed from the queue. You can undo with Ctrl + Z.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (pendingDelete) performDelete(pendingDelete); setPendingDelete(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
