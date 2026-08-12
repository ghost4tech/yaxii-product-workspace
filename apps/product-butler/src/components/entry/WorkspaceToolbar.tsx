import React from 'react';
import {
  Columns2,
  FileSpreadsheet,
  Focus,
  ListChecks,
  Lock,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Rows3,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefsStore } from '@/stores/prefsStore';
import { cn } from '@/lib/utils';

interface Props {
  monthCount: number;
  limit: number;
  isPro: boolean;
  advancedOpen: boolean;
  onAdvancedToggle: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onOpenQueue: () => void;
  queueCount: number;
  onBulk: () => void;
  onAi: () => void;
}

/** Workspace command strip above the entry surfaces. */
export const WorkspaceToolbar: React.FC<Props> = ({
  monthCount,
  limit,
  isPro,
  advancedOpen,
  onAdvancedToggle,
  canUndo,
  onUndo,
  onOpenQueue,
  queueCount,
  onBulk,
  onAi,
}) => {
  const { prefs, setPref } = usePrefsStore();
  const compact = prefs.density === 'compact';
  const focus = prefs.focusMode;
  const pct = isPro ? 100 : Math.min(100, Math.round((monthCount / limit) * 100));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 me-auto">
        <h1 className="text-[19px] sm:text-[21px] font-semibold tracking-tight leading-tight">
          Product entry
        </h1>
        <div className="flex items-center gap-2 mt-1">
          {isPro ? (
            <span className="text-[12px] text-muted-foreground">
              Unlimited products · {monthCount} added this month
            </span>
          ) : (
            <>
              <span className="h-1 w-20 rounded-full bg-border overflow-hidden">
                <span
                  className={cn('block h-full', pct >= 100 ? 'bg-destructive' : 'bg-foreground/70')}
                  style={{ inlineSize: `${pct}%` }}
                />
              </span>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {monthCount}/{limit} this month
              </span>
            </>
          )}
        </div>
      </div>

      {canUndo && (
        <Button variant="ghost" size="sm" onClick={onUndo} className="h-8 text-[12px]">
          <Undo2 className="h-3.5 w-3.5 me-1.5" /> Undo delete
        </Button>
      )}

      {/* Density */}
      <div className="seg" role="group" aria-label="Density">
        <button
          type="button"
          className="seg-item"
          data-active={!compact}
          onClick={() => setPref('density', 'comfortable')}
          title="Comfortable density"
        >
          <Rows3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="seg-item"
          data-active={compact}
          onClick={() => setPref('density', 'compact')}
          title="Compact density"
        >
          <ListChecks className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onAdvancedToggle}
        className="h-8 text-[12px] hidden sm:inline-flex"
      >
        {advancedOpen ? (
          <PanelRightClose className="h-3.5 w-3.5 me-1.5" />
        ) : (
          <PanelRightOpen className="h-3.5 w-3.5 me-1.5" />
        )}
        {advancedOpen ? 'Hide extended' : 'Extended'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenQueue}
        className="h-8 text-[12px] lg:hidden"
      >
        <Columns2 className="h-3.5 w-3.5 me-1.5" /> Queue
        <span className="ms-1.5 tabular-nums opacity-60">{queueCount}</span>
      </Button>

      <Button
        variant={focus ? 'default' : 'outline'}
        size="sm"
        onClick={() => setPref('focusMode', !focus)}
        className="h-8 text-[12px]"
        title="Focus mode — hide everything except product entry"
      >
        {focus ? (
          <Minimize2 className="h-3.5 w-3.5 me-1.5" />
        ) : (
          <Focus className="h-3.5 w-3.5 me-1.5" />
        )}
        {focus ? 'Exit focus' : 'Focus'}
      </Button>

      {!focus && (
        <div className="hidden xl:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBulk} className="h-8 text-[12px]">
            {isPro ? (
              <FileSpreadsheet className="h-3.5 w-3.5 me-1.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 me-1.5" />
            )}
            Bulk CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onAi} className="h-8 text-[12px]">
            {isPro ? (
              <Sparkles className="h-3.5 w-3.5 me-1.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 me-1.5" />
            )}
            AI descriptions
          </Button>
        </div>
      )}
    </div>
  );
};
