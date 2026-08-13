import type React from "react";
import {
  Columns2,
  Focus,
  ListChecks,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Rows3,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { productOperationCopy } from "@/production/core/i18n/productMessages";
import { usePrefsStore } from "@/stores/prefsStore";

interface Props {
  advancedOpen: boolean;
  canUndo: boolean;
  onAdvancedToggle: () => void;
  onOpenQueue: () => void;
  onOpenProducts: () => void;
  onUndo: () => void;
  queueCount: number;
}

/** Workspace command strip above the entry surfaces. */
export const WorkspaceToolbar: React.FC<Props> = ({
  advancedOpen,
  canUndo,
  onAdvancedToggle,
  onOpenQueue,
  onOpenProducts,
  onUndo,
  queueCount,
}) => {
  const { prefs, setPref } = usePrefsStore();
  const { bootstrap } = useWorkspaceRuntime();
  const productCopy = productOperationCopy(bootstrap.locale);
  const compact = prefs.density === "compact";
  const focus = prefs.focusMode;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="me-auto min-w-0">
        <h1 className="text-[19px] font-semibold leading-tight tracking-tight sm:text-[21px]">
          Product entry
        </h1>
        <p className="mt-1 text-[12px] text-muted-foreground">{productCopy.currentStore}</p>
      </div>

      {canUndo && (
        <Button variant="ghost" size="sm" onClick={onUndo} className="h-8 text-[12px]">
          <Undo2 className="me-1.5 h-3.5 w-3.5" /> Undo delete
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={onOpenProducts} className="h-8 text-[12px]">
        <Search className="me-1.5 h-3.5 w-3.5" /> Find product
      </Button>

      <div className="seg" role="group" aria-label="Density">
        <button
          type="button"
          className="seg-item"
          data-active={!compact}
          onClick={() => setPref("density", "comfortable")}
          title="Comfortable density"
        >
          <Rows3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="seg-item"
          data-active={compact}
          onClick={() => setPref("density", "compact")}
          title="Compact density"
        >
          <ListChecks className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onAdvancedToggle}
        className="hidden h-8 text-[12px] sm:inline-flex"
      >
        {advancedOpen ? (
          <PanelRightClose className="me-1.5 h-3.5 w-3.5" />
        ) : (
          <PanelRightOpen className="me-1.5 h-3.5 w-3.5" />
        )}
        {advancedOpen ? "Hide extended" : "Extended"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenQueue}
        className="h-8 text-[12px] lg:hidden"
      >
        <Columns2 className="me-1.5 h-3.5 w-3.5" /> Queue
        <span className="ms-1.5 tabular-nums opacity-60">{queueCount}</span>
      </Button>

      <Button
        variant={focus ? "default" : "outline"}
        size="sm"
        onClick={() => setPref("focusMode", !focus)}
        className="h-8 text-[12px]"
        title="Focus mode — hide everything except product entry"
      >
        {focus ? (
          <Minimize2 className="me-1.5 h-3.5 w-3.5" />
        ) : (
          <Focus className="me-1.5 h-3.5 w-3.5" />
        )}
        {focus ? "Exit focus" : "Focus"}
      </Button>
    </div>
  );
};
