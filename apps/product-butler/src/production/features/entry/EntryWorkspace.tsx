import { Focus, ListChecks, ShieldCheck } from "lucide-react";
import type { LocaleFormatters } from "../../core/i18n/formatters";
import type { WorkspaceSnapshot } from "../../domain/workspace";
import { QueuePanel } from "../queue/QueuePanel";
import { ProductEntryForm } from "./ProductEntryForm";

interface EntryWorkspaceProps {
  focusMode: boolean;
  formatters: LocaleFormatters;
  onFocusToggle: () => void;
  onQueueOpen: () => void;
  snapshot: WorkspaceSnapshot;
}

export function EntryWorkspace(props: EntryWorkspaceProps) {
  return (
    <main className="ypw-main">
      <section className="ypw-workspace-toolbar">
        <div>
          <span className="ypw-eyebrow">Free workspace</span>
          <h1>Add a product</h1>
          <p>Prepare product details quickly. Server product saving is intentionally unavailable in Phase 1.</p>
        </div>
        <div className="ypw-toolbar-actions">
          <span className="ypw-safety-chip"><ShieldCheck aria-hidden="true" size={15} /> No store writes</span>
          <button className="ypw-button ypw-button--quiet ypw-mobile-queue" onClick={props.onQueueOpen} type="button">
            <ListChecks aria-hidden="true" size={16} /> Queue
          </button>
          <button
            aria-pressed={props.focusMode}
            className="ypw-button ypw-button--secondary"
            onClick={props.onFocusToggle}
            type="button"
          >
            <Focus aria-hidden="true" size={16} /> Focus Mode
          </button>
        </div>
      </section>

      <div className={`ypw-workspace-grid${props.focusMode ? " ypw-workspace-grid--focus" : ""}`}>
        <section className="ypw-panel ypw-form-panel" aria-labelledby="ypw-entry-title">
          <header className="ypw-panel__header">
            <div>
              <span className="ypw-eyebrow">Product draft</span>
              <h2 id="ypw-entry-title">Form</h2>
            </div>
            <span className="ypw-chip">Local draft</span>
          </header>
          <ProductEntryForm productWritesAvailable={props.snapshot.capabilities.productWrites} />
        </section>

        {!props.focusMode ? (
          <div className="ypw-queue-column">
            <QueuePanel formatters={props.formatters} operations={props.snapshot.operations} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
