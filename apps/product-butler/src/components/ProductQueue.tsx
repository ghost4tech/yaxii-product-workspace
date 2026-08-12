import React from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  Inbox,
  Package,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface ProductQueueProps {
  onEdit?: (product: Product) => void;
  onRetry?: (product: Product) => void;
  compact?: boolean;
}

type StatusKey = 'all' | Product['status'];

const STATUS_META: Record<
  Product['status'],
  { label: string; icon: typeof Clock; tone: string; dot: string }
> = {
  synced: { label: 'Synced', icon: CheckCircle2, tone: 'text-success', dot: 'bg-success' },
  pending: { label: 'Pending', icon: Clock, tone: 'text-warning', dot: 'bg-warning' },
  error: { label: 'Failed', icon: AlertCircle, tone: 'text-destructive', dot: 'bg-destructive' },
  draft: { label: 'Draft', icon: FileText, tone: 'text-muted-foreground', dot: 'bg-muted-foreground/50' },
};

const dayLabel = (d: Date) =>
  isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE, d MMM');

export const ProductQueue: React.FC<ProductQueueProps> = ({
  onEdit,
  onRetry,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusKey>('all');
  const [visible, setVisible] = React.useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Product | null>(null);

  const { products, deleteProduct, setLastDeletedProduct, wooConfig } = useProductStore();
  const prefs = usePrefsStore((s) => s.prefs);
  const pageSize = visible ?? prefs.queueRowsPerPage;

  const counts = React.useMemo(
    () =>
      products.reduce(
        (acc, p) => {
          acc[p.status] += 1;
          return acc;
        },
        { synced: 0, pending: 0, error: 0, draft: 0 } as Record<Product['status'], number>
      ),
    [products]
  );

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  const shown = filtered.slice(0, pageSize);

  // Group rows by day (optional preference)
  const groups = React.useMemo(() => {
    if (!prefs.queueGroupByDay) return [{ key: '', items: shown }];
    const map = new Map<string, Product[]>();
    shown.forEach((p) => {
      const key = dayLabel(new Date(p.createdAt));
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map, ([key, items]) => ({ key, items }));
  }, [shown, prefs.queueGroupByDay]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) setSearchQuery('');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchQuery]);

  const performDelete = (product: Product) => {
    setLastDeletedProduct(product);
    deleteProduct(product.id);
  };

  const handleDelete = (product: Product) => {
    if (prefs.confirmBeforeDelete) setPendingDelete(product);
    else performDelete(product);
  };

  const tabs: { key: StatusKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: products.length },
    { key: 'synced', label: 'Synced', count: counts.synced },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'error', label: 'Failed', count: counts.error },
    { key: 'draft', label: 'Draft', count: counts.draft },
  ];

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="text-[14px] font-semibold">Recent products</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {filtered.length === products.length
                ? `${products.length} products`
                : `${filtered.length} of ${products.length}`}
            </span>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Name or SKU…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('ps-8 h-8 text-xs bg-muted/40 w-full', compact ? 'sm:w-40' : 'sm:w-52')}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto -mx-0.5 px-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              data-active={statusFilter === t.key}
              className={cn(
                'group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors',
                statusFilter === t.key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t.key !== 'all' && (
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    STATUS_META[t.key as Product['status']].dot
                  )}
                />
              )}
              {t.label}
              <span className="tabular-nums opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Column header */}
      {shown.length > 0 && (
        <div className="data-head">
          <span className="w-8" />
          <span className="flex-1">Product</span>
          {!compact && <span className="w-24 text-end">Price</span>}
          <span className="w-20">Status</span>
          <span className="w-8" />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 py-16">
            <div className="w-14 h-14 rounded-lg border border-border bg-muted/40 flex items-center justify-center mb-3">
              <Inbox className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold">
              {products.length === 0 ? 'Queue is empty' : 'No matching products'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mt-1 leading-relaxed">
              {products.length === 0
                ? 'Products you save appear here with their sync status.'
                : 'Adjust the search term or pick a different status.'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key || 'all'}>
              {group.key && (
                <div className="sticky top-0 z-10 px-4 py-1.5 bg-background/95 backdrop-blur border-b border-border/70 label-eyebrow">
                  {group.key}
                </div>
              )}
              <ul className="divide-y divide-border/70">
                {group.items.map((product) => {
                  const meta = STATUS_META[product.status];
                  const Icon = meta.icon;
                  return (
                    <li
                      key={product.id}
                      className={cn(
                        'data-row group',
                        product.status === 'error' && 'bg-destructive/[0.035]'
                      )}
                    >
                      <div className="w-8 h-8 rounded-md bg-muted border border-border/70 flex items-center justify-center overflow-hidden shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].preview}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate leading-tight">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          {product.sku && <span className="font-mono truncate">{product.sku}</span>}
                          {product.sku && <span className="opacity-40">·</span>}
                          <span className="truncate">
                            {prefs.relativeTimestamps
                              ? formatDistanceToNow(new Date(product.createdAt), {
                                  addSuffix: true,
                                })
                              : format(new Date(product.createdAt), 'd MMM, HH:mm')}
                          </span>
                          {product.isVariable && (
                            <>
                              <span className="opacity-40">·</span>
                              <span>variable</span>
                            </>
                          )}
                        </div>
                        {product.status === 'error' && product.errorMessage && (
                          <p className="text-[11px] text-destructive mt-1 truncate">
                            {product.errorMessage}
                          </p>
                        )}
                      </div>

                      {!compact && (
                        <div className="w-24 text-end shrink-0">
                          <span className="text-[13px] font-medium tabular-nums">
                            {product.regularPrice ? `$${product.regularPrice}` : '—'}
                          </span>
                          {product.salePrice && (
                            <span className="block text-[11px] text-success tabular-nums">
                              ${product.salePrice}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="w-auto sm:w-20 shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 h-6 px-1.5 rounded border border-current/15 bg-current/[0.06] text-[11px] font-medium',
                            meta.tone
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{meta.label}</span>
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(product)}>
                              <Edit className="h-4 w-4 me-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          {product.status === 'error' && onRetry && (
                            <DropdownMenuItem onClick={() => onRetry(product)}>
                              <RefreshCw className="h-4 w-4 me-2" /> Retry sync
                            </DropdownMenuItem>
                          )}
                          {product.wooCommerceId && wooConfig?.storeUrl && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `${wooConfig.storeUrl}/wp-admin/post.php?post=${product.wooCommerceId}&action=edit`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4 me-2" /> Open in WooCommerce
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 me-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
        {filtered.length > shown.length ? (
          <button
            onClick={() => setVisible(pageSize + prefs.queueRowsPerPage)}
            className="font-medium text-foreground hover:underline"
          >
            Load {Math.min(prefs.queueRowsPerPage, filtered.length - shown.length)} more
          </button>
        ) : prefs.showKeyboardHints ? (
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">Esc</kbd> clear search
          </span>
        ) : (
          <span>Showing all {filtered.length}</span>
        )}
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              wooConfig?.connected ? 'bg-success' : 'bg-muted-foreground/40'
            )}
          />
          {wooConfig?.connected ? 'Live sync on' : 'Live sync off'}
        </span>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” will be removed from the queue. You can undo with Ctrl + Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) performDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
