import { useCallback, useState } from "react";
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queueSheet, setQueueSheet] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CanonicalProduct | null>(null);
  const [success, setSuccess] = useState<SaveSuccessInfo | null>(null);
  const prefs = usePrefsStore((state) => state.prefs);
  const operationCounts = useOperationSummary();
  const { toast } = useToast();
  const { client } = useWorkspaceRuntime();

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
        onOpenProduct={setEditingProduct} onDraftPrepared={() => setEditingProduct(null)} />
    </div>
  );
};

export default Entry;
