import { isToday, isYesterday } from "date-fns";
import { Inbox, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QueueRow } from "@/components/queue/QueueRow";
import { QueueSkeleton } from "@/components/queue/QueueSkeleton";
import { STATUS_META } from "@/components/queue/statusMeta";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { useHorizontalDragScroll } from "@/production/components/useHorizontalDragScroll";
import { productOperationCopy } from "@/production/core/i18n/productMessages";
import { useOperationQueue } from "@/production/features/operations/useOperationQueue";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";
import type { Product } from "@/types/product";
import { formattingLanguageTag } from "@/production/core/i18n/formatters";
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

interface ProductQueueProps {
  compact?: boolean;
  onEdit?: (product: Product) => void;
  onRetry?: (product: Product) => void;
}

type StatusKey = "all" | Product["status"];

function dayLabel(date: Date, locale: string) {
  if (isToday(date)) return __("Today", "yaxii-product-workspace");
  if (isYesterday(date)) return __("Yesterday", "yaxii-product-workspace");
  return new Intl.DateTimeFormat(formattingLanguageTag(locale), {
    day: "numeric", month: "short", weekday: "short",
  }).format(date);
}

export const ProductQueue = ({ compact = false, onEdit, onRetry }: ProductQueueProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusKey>("all");
  const [pendingDismiss, setPendingDismiss] = useState<Product | null>(null);
  const { bootstrap } = useWorkspaceRuntime();
  const copy = productOperationCopy(bootstrap.locale);
  const { preferences } = useWorkspacePreferences();
  const queue = useOperationQueue(debouncedSearch, status, preferences.queue_rows_per_page);
  const filterScroll = useHorizontalDragScroll();
  const shown = queue.products;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && search) setSearch("");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [search]);

  const groups = useMemo(() => {
    if (!preferences.queue_group_by_day) return [{ key: "", items: shown }];
    const grouped = new Map<string, Product[]>();
    shown.forEach((product) => {
      const key = dayLabel(product.createdAt, bootstrap.locale);
      grouped.set(key, [...(grouped.get(key) ?? []), product]);
    });
    return Array.from(grouped, ([key, items]) => ({ key, items }));
  }, [bootstrap.locale, preferences.queue_group_by_day, shown]);

  const dismiss = (product: Product) => queue.dismiss(product.id);
  const requestDismiss = (product: Product) => {
    if (preferences.confirm_queue_dismiss) setPendingDismiss(product);
    else dismiss(product);
  };
  const tabs = [
    { count: queue.counts.all, key: "all" as const, label: __("All", "yaxii-product-workspace") },
    ...(["synced", "pending", "error", "draft"] as const).map((key) => ({
      count: queue.counts[key], key, label: STATUS_META[key].label,
    })),
  ];

  return (
    <div aria-labelledby="product-queue-heading" className="panel flex h-full flex-col overflow-hidden" role="region">
      <div className="space-y-3 border-b border-border px-4 pb-3 pt-3.5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-[14px] font-semibold" id="product-queue-heading">{__("Recent products", "yaxii-product-workspace")}</h2>
            {queue.isLoading ? <Skeleton className="h-3 w-16" aria-hidden="true" />
              : <span className="text-xs tabular-nums text-muted-foreground">
                {debouncedSearch
                  ? /* translators: %s: number of product matches. */ sprintf(_n("%s match", "%s matches", queue.total, "yaxii-product-workspace"), queue.total)
                  : /* translators: %s: number of operations. */ sprintf(_n("%s operation", "%s operations", queue.counts.all, "yaxii-product-workspace"), queue.counts.all)}
              </span>}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={__("Name or SKU…", "yaxii-product-workspace")} value={search} onChange={(event) => setSearch(event.target.value)}
              className={cn("workspace-search-input h-8 w-full bg-muted/40 ps-8 text-xs", compact ? "sm:w-40" : "sm:w-52")} />
          </div>
        </div>
        <div className="queue-filter-shell relative -mx-0.5">
          <div {...filterScroll.props} aria-label={__("Operation status filters", "yaxii-product-workspace")}
            className={cn(
              "queue-filter-scroll no-scrollbar flex touch-pan-x items-center gap-1 overflow-x-auto px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              filterScroll.dragging ? "cursor-grabbing select-none" : "cursor-grab",
            )}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setStatus(tab.key)} type="button"
                className={cn("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[12px] font-medium transition-colors",
                  status === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {tab.key !== "all" && <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[tab.key].dot)} />}
                {tab.label} {queue.isLoading ? <Skeleton className="h-2.5 w-3 bg-current/15" aria-hidden="true" />
                  : <span className="tabular-nums opacity-60">{tab.count}</span>}
              </button>
            ))}
          </div>
          <span aria-hidden="true" className="queue-filter-fade queue-filter-fade-start"
            data-visible={filterScroll.canScrollStart || undefined} />
          <span aria-hidden="true" className="queue-filter-fade queue-filter-fade-end"
            data-visible={filterScroll.canScrollEnd || undefined} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {queue.isLoading ? <QueueSkeleton compact={compact} /> : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Inbox className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold">{queue.isError ? __("Queue unavailable", "yaxii-product-workspace") : queue.counts.all === 0 ? __("Queue is empty", "yaxii-product-workspace") : __("No matching products", "yaxii-product-workspace")}</h3>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              {queue.isError ? __("Recent operations could not be loaded. Your WooCommerce products are unchanged.", "yaxii-product-workspace")
                : queue.counts.all === 0 ? copy.savedProductsAppearHere : __("Adjust the search term or pick a different status.", "yaxii-product-workspace")}
            </p>
          </div>
        ) : groups.map((group) => (
          <div key={group.key || "all"}>
            {group.key && <div className="label-eyebrow sticky top-0 z-10 border-b border-border/70 bg-background/95 px-4 py-1.5 backdrop-blur">{group.key}</div>}
            <ul className="divide-y divide-border/70">
              {group.items.map((product) => <QueueRow key={product.id} compact={compact} onDelete={requestDismiss}
                onEdit={onEdit} onReconcile={(item) => { if (item.canReconcile) queue.reconcile(item.id); }}
                onRetry={(item) => { if (item.canRetry) queue.retry(item.id); onRetry?.(item); }}
                product={product} relativeTimestamps={preferences.relative_timestamps} />)}
            </ul>
          </div>
        ))}
      </div>

      {queue.hasNextPage && <div className="flex items-center justify-center border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        <button onClick={() => void queue.fetchNextPage()} className="font-medium text-foreground hover:underline" type="button">
          {__("Load more", "yaxii-product-workspace")}
        </button>
      </div>}

      <AlertDialog open={Boolean(pendingDismiss)} onOpenChange={(open) => !open && setPendingDismiss(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{__("Remove this queue entry?", "yaxii-product-workspace")}</AlertDialogTitle>
          <AlertDialogDescription>{
            /* translators: %s: product name. */
            sprintf(__("“%s” will leave recent operations. Its WooCommerce product will not be trashed.", "yaxii-product-workspace"), pendingDismiss?.name ?? "")
          }</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{__("Cancel", "yaxii-product-workspace")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (pendingDismiss) dismiss(pendingDismiss); setPendingDismiss(null); }}>{__("Remove", "yaxii-product-workspace")}</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
