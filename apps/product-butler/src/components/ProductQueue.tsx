import { format, isToday, isYesterday } from "date-fns";
import { Inbox, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QueueRow } from "@/components/queue/QueueRow";
import { STATUS_META } from "@/components/queue/statusMeta";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { productOperationCopy } from "@/production/core/i18n/productMessages";
import { useOperationQueue } from "@/production/features/operations/useOperationQueue";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";
import { usePrefsStore } from "@/stores/prefsStore";
import type { Product } from "@/types/product";

interface ProductQueueProps {
  compact?: boolean;
  onEdit?: (product: Product) => void;
  onRetry?: (product: Product) => void;
}

type StatusKey = "all" | Product["status"];

function dayLabel(date: Date) {
  return isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEE, d MMM");
}

export const ProductQueue = ({ compact = false, onEdit, onRetry }: ProductQueueProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusKey>("all");
  const [pendingDismiss, setPendingDismiss] = useState<Product | null>(null);
  const { bootstrap } = useWorkspaceRuntime();
  const copy = productOperationCopy(bootstrap.locale);
  const localPrefs = usePrefsStore((state) => state.prefs);
  const { preferences } = useWorkspacePreferences();
  const queue = useOperationQueue(debouncedSearch, status, preferences.queue_rows_per_page);
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
      const key = dayLabel(product.createdAt);
      grouped.set(key, [...(grouped.get(key) ?? []), product]);
    });
    return Array.from(grouped, ([key, items]) => ({ key, items }));
  }, [preferences.queue_group_by_day, shown]);

  const dismiss = (product: Product) => queue.dismiss(product.id);
  const requestDismiss = (product: Product) => {
    if (preferences.confirm_queue_dismiss) setPendingDismiss(product);
    else dismiss(product);
  };
  const tabs = [
    { count: queue.counts.all, key: "all" as const, label: "All" },
    ...(["synced", "pending", "error", "draft"] as const).map((key) => ({
      count: queue.counts[key], key, label: STATUS_META[key].label,
    })),
  ];

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="space-y-3 border-b border-border px-4 pb-3 pt-3.5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-[14px] font-semibold">Recent products</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {debouncedSearch ? `${queue.total} matches` : `${queue.counts.all} operations`}
            </span>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Name or SKU…" value={search} onChange={(event) => setSearch(event.target.value)}
              className={cn("h-8 w-full bg-muted/40 ps-8 text-xs", compact ? "sm:w-40" : "sm:w-52")} />
          </div>
        </div>
        <div className="-mx-0.5 flex items-center gap-1 overflow-x-auto px-0.5">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setStatus(tab.key)} type="button"
              className={cn("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[12px] font-medium transition-colors",
                status === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {tab.key !== "all" && <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[tab.key].dot)} />}
              {tab.label} <span className="tabular-nums opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 && <div className="data-head"><span className="w-8" /><span className="flex-1">Product</span>
        {!compact && <span className="w-24 text-end">Price</span>}<span className="w-20">Status</span><span className="w-8" /></div>}

      <div className="flex-1 overflow-auto">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Inbox className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold">{queue.isError ? "Queue unavailable" : queue.counts.all === 0 ? "Queue is empty" : "No matching products"}</h3>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              {queue.isError ? "Recent operations could not be loaded. Your WooCommerce products are unchanged."
                : queue.counts.all === 0 ? copy.savedProductsAppearHere : "Adjust the search term or pick a different status."}
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

      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        {queue.hasNextPage ? <button onClick={() => void queue.fetchNextPage()} className="font-medium text-foreground hover:underline" type="button">Load more</button>
          : localPrefs.showKeyboardHints ? <span><kbd className="kbd">Esc</kbd> clear search</span> : <span>Showing {shown.length}</span>}
        <span className="flex items-center gap-1.5 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-success" />Server history</span>
      </div>

      <AlertDialog open={Boolean(pendingDismiss)} onOpenChange={(open) => !open && setPendingDismiss(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this queue entry?</AlertDialogTitle>
          <AlertDialogDescription>“{pendingDismiss?.name}” will leave recent operations. Its WooCommerce product will not be trashed.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (pendingDismiss) dismiss(pendingDismiss); setPendingDismiss(null); }}>Remove</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
