import { CheckCircle2, Clock3, ListChecks, TriangleAlert } from "lucide-react";
import type { LocaleFormatters } from "../../core/i18n/formatters";
import type { WorkspaceOperation } from "../../domain/workspace";

interface QueuePanelProps {
  formatters: LocaleFormatters;
  operations: readonly WorkspaceOperation[];
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

export function QueuePanel({ formatters, operations }: QueuePanelProps) {
  return (
    <section className="ypw-panel ypw-queue" aria-labelledby="ypw-queue-title">
      <header className="ypw-panel__header">
        <div>
          <span className="ypw-eyebrow">Operations</span>
          <h2 id="ypw-queue-title">Queue</h2>
        </div>
        <span className="ypw-count">{formatters.number(operations.length)}</span>
      </header>

      {operations.length === 0 ? (
        <div className="ypw-empty-state">
          <ListChecks aria-hidden="true" size={28} />
          <strong>No server operations yet</strong>
          <p>The real operation queue begins with the WordPress REST write layer. Nothing is inferred from local form state.</p>
        </div>
      ) : (
        <div className="ypw-operation-list">
          <p className="ypw-fixture-note">Deterministic development preview — not WooCommerce store data.</p>
          {operations.map((operation) => (
            <article className="ypw-operation" key={operation.id}>
              <span className={`ypw-operation__status ypw-operation__status--${operation.status}`}>
                <StatusIcon status={operation.status} />
              </span>
              <div>
                <strong>{operation.name}</strong>
                <span>{formatters.date(new Date(operation.timestamp))}</span>
              </div>
              <span className="ypw-chip">Fixture</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
