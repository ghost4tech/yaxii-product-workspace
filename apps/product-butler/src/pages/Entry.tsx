import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductEntryForm } from "@/components/ProductEntryForm";
import { ProductQueue } from "@/components/ProductQueue";
import { QueueSheet } from "@/components/entry/QueueSheet";
import { WorkspaceToolbar } from "@/components/entry/WorkspaceToolbar";
import { ProductFinder } from "@/components/products/ProductFinder";
import { StatsBar } from "@/components/StatsBar";
import { SaveSuccess, type SaveSuccessInfo } from "@/components/entry/SaveSuccess";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useOperationSummary } from "@/production/features/operations/useOperationSummary";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import type { CanonicalProduct } from "@/production/domain/products";
import { usePrefsStore } from "@/stores/prefsStore";
import type { Product } from "@/types/product";
import { __, _x } from "@/production/core/i18n/wordpress";

const Entry = () => {
  const prefs = usePrefsStore((state) => state.prefs);
  const [advancedOpen, setAdvancedOpen] = useState(prefs.defaultWorkspaceMode === 'extended');
  const [queueSheet, setQueueSheet] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CanonicalProduct | null>(null);
  const [success, setSuccess] = useState<SaveSuccessInfo | null>(null);
  const operationCounts = useOperationSummary();
  const { toast } = useToast();
  const { bootstrap, client } = useWorkspaceRuntime();
  const initialProductHandled = useRef(false);
  const [initialProductLoading, setInitialProductLoading] = useState(bootstrap.initialProductId !== null);
  const [deepLinkError, setDeepLinkError] = useState("");

  useEffect(() => {
    if (initialProductHandled.current || bootstrap.initialProductId === null) return;
    initialProductHandled.current = true;
    if (bootstrap.initialProductId <= 0) {
      setDeepLinkError(__("The Product Workspace link contains an invalid product ID.", "yaxii-product-workspace"));
      setInitialProductLoading(false);
      return;
    }
    void client.getProduct(bootstrap.initialProductId)
      .then((product) => {
        setDeepLinkError("");
        setEditingProduct(product);
      })
      .catch((error: unknown) => {
        setDeepLinkError(error instanceof Error ? error.message : __("The linked product could not be opened.", "yaxii-product-workspace"));
      })
      .finally(() => setInitialProductLoading(false));
  }, [bootstrap.initialProductId, client]);

  const openQueueProduct = useCallback(
    async (product: Product) => {
      if (!product.wooCommerceId) {
        toast({
          title: __("Product is not available", "yaxii-product-workspace"),
          description: __("This operation does not have a WooCommerce product result to open.", "yaxii-product-workspace"),
          variant: "destructive",
        });
        return;
      }
      try {
        setDeepLinkError("");
        setEditingProduct(await client.getProduct(product.wooCommerceId));
        setQueueSheet(false);
      } catch (error) {
        toast({
          title: __("Product could not be opened", "yaxii-product-workspace"),
          description: error instanceof Error ? error.message : __("WooCommerce did not return the product.", "yaxii-product-workspace"),
          variant: "destructive",
        });
      }
    },
    [client, toast],
  );

  const focus = prefs.focusMode;
  const showQueueColumn = !advancedOpen && (!focus || prefs.focusModeShowQueue);

  return (
    <div className="space-y-5">
      <WorkspaceToolbar
        advancedOpen={advancedOpen}
        onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
        canUndo={false}
        onUndo={() => undefined}
        onOpenQueue={() => setQueueSheet(true)}
        onOpenProducts={() => setFinderOpen(true)}
        queueCount={operationCounts.all}
      />

      {!focus && prefs.showKpiCards && <StatsBar />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section
          className={cn(
            "panel flex min-w-0 flex-col",
            showQueueColumn ? "lg:col-span-8 xl:col-span-8" : "lg:col-span-12",
          )}
        >
          <div className="panel-head">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-[14px] font-semibold">{editingProduct ? __("Edit product", "yaxii-product-workspace") : __("Add new product", "yaxii-product-workspace")}</h2>
              <span className="label-eyebrow">{editingProduct ? __("Editing", "yaxii-product-workspace") : _x("Draft", "Product status", "yaxii-product-workspace")}</span>
            </div>
          </div>
          <div className="panel-body relative">
            {initialProductLoading ? (
              <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground" role="status">
                <Loader2 className="me-2 h-4 w-4 animate-spin" />{__("Loading linked product…", "yaxii-product-workspace")}
              </div>
            ) : <>
              {deepLinkError && <p role="alert" className="mb-4 rounded-md border border-destructive/25 bg-destructive/[0.06] p-3 text-[12px] text-destructive">{deepLinkError}</p>}
              <ProductEntryForm
                advancedOpen={advancedOpen}
                onAdvancedChange={setAdvancedOpen}
                onCloseEdit={() => setEditingProduct(null)}
                onProductUpdated={setEditingProduct}
                onProductSaved={(product, updated) => setSuccess({ name: product.name, sku: product.sku, updated })}
                product={editingProduct}
                twoColumn={advancedOpen}
              />
              <SaveSuccess info={success} onDismiss={() => {
                if (success?.updated) setEditingProduct(null);
                setSuccess(null);
              }} onViewQueue={() => {
                setSuccess(null);
                setQueueSheet(true);
              }} />
            </>}
          </div>
        </section>

        {showQueueColumn && (
          <section
            className={cn(
              "hidden min-h-[520px] lg:col-span-4 lg:block",
              prefs.stickyQueue && "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start",
            )}
          >
            <ProductQueue compact onEdit={(product) => void openQueueProduct(product)} />
          </section>
        )}

        {!showQueueColumn && (
          <section className="lg:col-span-12">
            <ProductQueue onEdit={(product) => void openQueueProduct(product)} />
          </section>
        )}
      </div>

      <QueueSheet
        open={queueSheet}
        onOpenChange={setQueueSheet}
        onEdit={(product) => void openQueueProduct(product)}
      />
      <ProductFinder open={finderOpen} onOpenChange={setFinderOpen}
        onOpenProduct={(product) => {
          setDeepLinkError("");
          setEditingProduct(product);
        }} onDraftPrepared={() => {
          setDeepLinkError("");
          setEditingProduct(null);
        }} />
    </div>
  );
};

export default Entry;
