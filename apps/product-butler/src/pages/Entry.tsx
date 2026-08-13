import { useCallback, useState } from "react";
import { ProductEntryForm } from "@/components/ProductEntryForm";
import { ProductQueue } from "@/components/ProductQueue";
import { QueueSheet } from "@/components/entry/QueueSheet";
import { WorkspaceToolbar } from "@/components/entry/WorkspaceToolbar";
import { StatsBar } from "@/components/StatsBar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useOperationSummary } from "@/production/features/operations/useOperationSummary";
import { usePrefsStore } from "@/stores/prefsStore";

const Entry = () => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queueSheet, setQueueSheet] = useState(false);
  const prefs = usePrefsStore((state) => state.prefs);
  const operationCounts = useOperationSummary();
  const { toast } = useToast();

  const unavailableAction = useCallback(
    () => {
      toast({
        title: "Server operation unavailable",
        description: "Open the product editor before changing this product.",
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
        canUndo={false}
        onUndo={() => undefined}
        onOpenQueue={() => setQueueSheet(true)}
        queueCount={operationCounts.all}
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
            <ProductQueue compact onEdit={unavailableAction} />
          </section>
        )}

        {!showQueueColumn && (
          <section className="lg:col-span-12">
            <ProductQueue onEdit={unavailableAction} />
          </section>
        )}
      </div>

      <QueueSheet
        open={queueSheet}
        onOpenChange={setQueueSheet}
        onEdit={unavailableAction}
      />
    </div>
  );
};

export default Entry;
