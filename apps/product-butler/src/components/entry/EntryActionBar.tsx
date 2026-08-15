import React from 'react';
import { ArrowRight, Circle, Loader2, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefsStore } from '@/stores/prefsStore';
import { cn } from '@/lib/utils';
import { Explain } from '@/components/ui/help-tip';
import { __, sprintf } from '@/production/core/i18n/wordpress';

interface Props {
  disabled?: boolean;
  disabledReason?: string;
  clearLabel?: string;
  isSubmitting?: boolean;
  /** Draft has unsaved content */
  dirty: boolean;
  productName?: string;
  onClear: () => void;
  onSaveDraft?: () => void;
  onTrash?: () => void;
  submitLabel?: string;
  className?: string;
}

/** Signature action area for continuous product entry. */
export const EntryActionBar: React.FC<Props> = ({
  disabled = false,
  disabledReason,
  clearLabel = __('Clear', "yaxii-product-workspace"),
  isSubmitting,
  dirty,
  productName,
  onClear,
  onSaveDraft,
  onTrash,
  submitLabel = __('Save & next', "yaxii-product-workspace"),
  className,
}) => {
  const showHints = usePrefsStore((s) => s.prefs.showKeyboardHints);

  return (
    <div
      className={cn(
        'sticky bottom-0 -mx-[var(--panel-x)] -mb-[var(--panel-x)] mt-[var(--stack-lg)]',
        'border-t border-border bg-card/95 backdrop-blur px-[var(--panel-x)] py-3',
        'flex flex-col-reverse sm:flex-row sm:items-center gap-2.5',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 sm:flex-1">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium truncate',
            dirty ? 'text-warning' : 'text-muted-foreground'
          )}
        >
          <Circle
            className={cn('h-2 w-2 shrink-0', dirty ? 'fill-warning stroke-warning' : 'fill-muted-foreground/40 stroke-none')}
          />
          <span className="truncate">
            {dirty
              ? productName
                ? /* translators: %s: product name. */ sprintf(__("Unsaved draft · %s", "yaxii-product-workspace"), productName)
                : __("Unsaved draft", "yaxii-product-workspace")
              : __("No changes", "yaxii-product-workspace")}
          </span>
        </span>
        {onSaveDraft && <div className="hidden lg:flex items-center gap-1.5 ms-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-[12px] text-muted-foreground"
            onClick={onSaveDraft}
          >
            {__("Save draft", "yaxii-product-workspace")}
            {showHints && <span className="kbd ms-1.5" dir="ltr">Ctrl S</span>}
          </Button>
        </div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onTrash && (
          <Button type="button" variant="ghost" onClick={onTrash}
            className="ctl px-3 text-[13px] text-destructive hover:text-destructive">
            <Trash2 className="me-1.5 h-3.5 w-3.5" /> {__("Trash", "yaxii-product-workspace")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="ctl px-3 text-[13px] text-muted-foreground hover:text-foreground"
          title={__("Clear the form (Esc)", "yaxii-product-workspace")}
        >
          <RotateCcw className="h-3.5 w-3.5 me-1.5" /> {clearLabel}
        </Button>
        <Explain tip={__("Saves this product and clears the form for the next one. Shortcut: Ctrl + Enter.", "yaxii-product-workspace")} side="top">
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className="ctl flex-1 sm:flex-none min-w-[190px] px-4 text-[13px] font-semibold group"
          title={disabledReason}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 me-2" />
          )}
          {isSubmitting ? __('Saving…', "yaxii-product-workspace") : submitLabel}
          {showHints && !isSubmitting && (
            <span className="kbd ms-2 bg-primary-foreground/15 text-primary-foreground/80 border-primary-foreground/25" dir="ltr">
              Ctrl ⏎
            </span>
          )}
          <ArrowRight className="h-3.5 w-3.5 ms-1.5 opacity-0 -translate-x-1 transition group-hover:opacity-70 group-hover:translate-x-0 rtl:translate-x-1 rtl:-scale-x-100" />
        </Button>
        </Explain>
      </div>
    </div>
  );
};
