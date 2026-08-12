import { Focus, ListChecks, ShieldCheck } from "lucide-react";
import type { LocaleFormatters } from "../../core/i18n/formatters";
import type { Translate } from "../../core/i18n/messages";
import type { WorkspaceSnapshot } from "../../domain/workspace";
import { QueuePanel } from "../queue/QueuePanel";
import { ProductEntryForm } from "./ProductEntryForm";

interface EntryWorkspaceProps {
  focusMode: boolean;
  formatters: LocaleFormatters;
  onFocusToggle: () => void;
  onQueueOpen: () => void;
  snapshot: WorkspaceSnapshot;
  t: Translate;
}

export function EntryWorkspace(props: EntryWorkspaceProps) {
  return (
    <main className="ypw-main">
      <section className="ypw-workspace-toolbar">
        <div>
          <span className="ypw-eyebrow">{props.t("freeWorkspace")}</span>
          <h1>{props.t("addProduct")}</h1>
          <p>{props.t("prepareProduct")} {props.t("phase1SavingUnavailable")}</p>
        </div>
        <div className="ypw-toolbar-actions">
          <span className="ypw-safety-chip"><ShieldCheck aria-hidden="true" size={15} /> {props.t("noStoreWrites")}</span>
          <button className="ypw-button ypw-button--quiet ypw-mobile-queue" onClick={props.onQueueOpen} type="button">
            <ListChecks aria-hidden="true" size={16} /> {props.t("queue")}
          </button>
          <button
            aria-pressed={props.focusMode}
            className="ypw-button ypw-button--secondary"
            onClick={props.onFocusToggle}
            type="button"
          >
            <Focus aria-hidden="true" size={16} /> {props.t("focusMode")}
          </button>
        </div>
      </section>

      <div className={`ypw-workspace-grid${props.focusMode ? " ypw-workspace-grid--focus" : ""}`}>
        <section className="ypw-panel ypw-form-panel" aria-labelledby="ypw-entry-title">
          <header className="ypw-panel__header">
            <div>
              <span className="ypw-eyebrow">{props.t("productDraft")}</span>
              <h2 id="ypw-entry-title">{props.t("form")}</h2>
            </div>
            <span className="ypw-chip">{props.t("localDraft")}</span>
          </header>
          <ProductEntryForm productWritesAvailable={props.snapshot.capabilities.productWrites} t={props.t} />
        </section>

        {!props.focusMode ? (
          <div className="ypw-queue-column">
            <QueuePanel formatters={props.formatters} operations={props.snapshot.operations} t={props.t} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
