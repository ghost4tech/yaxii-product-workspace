import { useCallback, useState } from "react";
import { ProductEntryForm } from "@/components/ProductEntryForm";
import { ProductQueue } from "@/components/ProductQueue";
import { QueueSheet } from "@/components/entry/QueueSheet";
import { WorkspaceToolbar } from "@/components/entry/WorkspaceToolbar";
import { StatsBar } from "@/components/StatsBar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";

const Entry = () => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queueSheet, setQueueSheet] = useState(false);
  const {
    addProduct,
    lastDeletedProduct,
    products,
    setLastDeletedProduct,
  } = useProductStore();
  const prefs = usePrefsStore((state) => state.prefs);
  const { toast } = useToast();

  const handleUndo = useCallback(() => {
    if (!lastDeletedProduct) {
      return;
    }
    addProduct(lastDeletedProduct);
    setLastDeletedProduct(null);
    toast({ title: "Product restored", description: lastDeletedProduct.name });
  }, [addProduct, lastDeletedProduct, setLastDeletedProduct, toast]);

  const unavailableAction = useCallback(
    () => {
      toast({
        title: "Server operation unavailable",
        description: "Editing and retry arrive with the Phase 2 WooCommerce write layer.",
        variant: "destructive",
      });
    },
    [toast],
  );

  const focus = prefs.focusMode;
  const showQueueColumn = !advancedOpen && (!focus || prefs.focusModeShowQueue);

  return (
    <div className="space-y-5">
      <WorkspaceToolbar
        advancedOpen={advancedOpen}
        onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
        canUndo={Boolean(lastDeletedProduct)}
        onUndo={handleUndo}
        onOpenQueue={() => setQueueSheet(true)}
        queueCount={products.length}
      />

      {!focus && <StatsBar />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section
          className={cn(
            "panel flex min-w-0 flex-col",
            showQueueColumn ? "lg:col-span-8 xl:col-span-8" : "lg:col-span-12",
          )}
        >
          <div className="panel-head">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-[14px] font-semibold">Add new product</h2>
              <span className="label-eyebrow">Draft</span>
            </div>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {prefs.density === "compact" ? "Compact" : "Comfortable"}
            </span>
          </div>
          <div className="panel-body">
            <ProductEntryForm
              advancedOpen={advancedOpen}
              onAdvancedChange={setAdvancedOpen}
              twoColumn={advancedOpen}
            />
          </div>
        </section>

        {showQueueColumn && (
          <section
            className={cn(
              "hidden min-h-[520px] lg:col-span-4 lg:block",
              prefs.stickyQueue && "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start",
            )}
          >
            <ProductQueue compact onEdit={unavailableAction} onRetry={unavailableAction} />
          </section>
        )}

        {!showQueueColumn && (
          <section className="lg:col-span-12">
            <ProductQueue onEdit={unavailableAction} onRetry={unavailableAction} />
          </section>
        )}
      </div>

      <QueueSheet
        open={queueSheet}
        onOpenChange={setQueueSheet}
        onEdit={unavailableAction}
        onRetry={unavailableAction}
      />
    </div>
  );
};

export default Entry;
