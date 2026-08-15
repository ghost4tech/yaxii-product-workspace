import { Copy, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import type { CanonicalProduct } from "@/production/domain/products";
import { fieldsToDraft } from "@/production/features/products/productDrafts";
import { useProductStore } from "@/stores/productStore";
import { __, _x } from "@/production/core/i18n/wordpress";

const productStatuses: Record<CanonicalProduct["status"], string> = {
  draft: _x("Draft", "Product status", "yaxii-product-workspace"),
  pending: _x("Pending review", "Product status", "yaxii-product-workspace"),
  publish: _x("Published", "Product status", "yaxii-product-workspace"),
};

interface Props {
  onDraftPrepared?: () => void;
  onOpenProduct: (product: CanonicalProduct) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ProductFinder({ onDraftPrepared, onOpenChange, onOpenProduct, open }: Props) {
  const { client } = useWorkspaceRuntime();
  const applyDraft = useProductStore((state) => state.applyDraft);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number>();
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void client.searchProducts({ page, perPage: 20, search: debounced, signal: controller.signal })
      .then((result) => {
        setProducts((current) => page === 1 ? result.items : [...current, ...result.items]);
        setHasMore(result.has_more);
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(requestError instanceof Error ? requestError.message : __("Products could not be loaded.", "yaxii-product-workspace"));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [client, debounced, open, page]);

  const openProduct = async (id: number) => {
    setBusyId(id);
    try {
      onOpenProduct(await client.getProduct(id));
      onOpenChange(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : __("Product could not be opened.", "yaxii-product-workspace"));
    } finally {
      setBusyId(undefined);
    }
  };

  const duplicate = async (product: CanonicalProduct) => {
    setBusyId(product.id);
    try {
      const prefill = await client.duplicateProduct(product.id);
      applyDraft(fieldsToDraft(prefill, product.images));
      onDraftPrepared?.();
      onOpenChange(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : __("Draft could not be prepared.", "yaxii-product-workspace"));
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle>{__("Find a product", "yaxii-product-workspace")}</DialogTitle>
          <DialogDescription>{__("Open an existing WooCommerce product or prepare a new simple-product draft.", "yaxii-product-workspace")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-hidden px-5 pb-5">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
              className="workspace-search-input ps-9" placeholder={__("Search by product name or SKU…", "yaxii-product-workspace")} />
          </div>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <div className="max-h-[52vh] overflow-y-auto rounded-md border border-border">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-start text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground"><bdi dir="ltr">#{product.id} · {product.sku || __("No SKU", "yaxii-product-workspace")}</bdi> · {productStatuses[product.status]}</p>
                </div>
                {product.type === "simple" && <Button type="button" size="sm" variant="ghost" disabled={busyId === product.id}
                  onClick={() => void duplicate(product)}><Copy className="me-1.5 h-3.5 w-3.5" />{__("Duplicate", "yaxii-product-workspace")}</Button>}
                <Button type="button" size="sm" disabled={busyId === product.id}
                  onClick={() => void openProduct(product.id)}>{busyId === product.id && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}{__("Open", "yaxii-product-workspace")}</Button>
              </div>
            ))}
            {!loading && products.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">{__("No matching products.", "yaxii-product-workspace")}</p>}
            {loading && <p className="flex items-center justify-center p-5 text-sm text-muted-foreground"><Loader2 className="me-2 h-4 w-4 animate-spin" />{__("Loading products…", "yaxii-product-workspace")}</p>}
          </div>
          {hasMore && <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => setPage((value) => value + 1)}>{__("Load more", "yaxii-product-workspace")}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
