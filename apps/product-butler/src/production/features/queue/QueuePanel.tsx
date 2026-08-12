import { CheckCircle2, Clock3, ListChecks, TriangleAlert } from "lucide-react";
import type { LocaleFormatters } from "../../core/i18n/formatters";
import type { Translate } from "../../core/i18n/messages";
import type { WorkspaceOperation } from "../../domain/workspace";

interface QueuePanelProps {
  formatters: LocaleFormatters;
  operations: readonly WorkspaceOperation[];
  t: Translate;
}

function StatusIcon({ status }: { status: WorkspaceOperation["status"] }) {
  if (status === "completed") {
    return <CheckCircle2 aria-hidden="true" size={17} />;
  }
  if (status === "failed") {
    return <TriangleAlert aria-hidden="true" size={17} />;
  }
  return <Clock3 aria-hidden="true" size={17} />;
}

export function QueuePanel({ formatters, operations, t }: QueuePanelProps) {
  return (
    <section className="ypw-panel ypw-queue" aria-labelledby="ypw-queue-title">
      <header className="ypw-panel__header">
        <div>
          <span className="ypw-eyebrow">{t("operations")}</span>
          <h2 id="ypw-queue-title">{t("queue")}</h2>
        </div>
        <span className="ypw-count">{formatters.number(operations.length)}</span>
      </header>

      {operations.length === 0 ? (
        <div className="ypw-empty-state">
          <ListChecks aria-hidden="true" size={28} />
          <strong>{t("noServerOperations")}</strong>
          <p>{t("queueDescription")}</p>
        </div>
      ) : (
        <div className="ypw-operation-list">
          <p className="ypw-fixture-note">{t("queueFixtureDescription")}</p>
          {operations.map((operation) => (
            <article className="ypw-operation" key={operation.id}>
              <span className={`ypw-operation__status ypw-operation__status--${operation.status}`}>
                <StatusIcon status={operation.status} />
              </span>
              <div>
                <strong>{operation.name}</strong>
                <span>{formatters.date(new Date(operation.timestamp))}</span>
              </div>
              <span className="ypw-chip">{t("fixture")}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
