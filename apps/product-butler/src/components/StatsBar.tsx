import { useOperationSummary } from "@/production/features/operations/useOperationSummary";

interface Metric {
  hint: string;
  label: string;
  value: number | string;
}

export function StatsBar() {
  const counts = useOperationSummary();
  const completed = counts.synced + counts.draft;
  const successRate = counts.all ? `${Math.round((completed / counts.all) * 100)}%` : "—";
  const metrics: Metric[] = [
    { hint: "retained", label: "Recent operations", value: counts.all },
    { hint: "products", label: "Published", value: counts.synced },
    { hint: counts.all ? `${completed} completed` : "no operations", label: "Sync success", value: successRate },
    { hint: counts.error ? "failed operations" : "all clear", label: "Needs attention", value: counts.error },
  ];

  return (
    <div className="surface-card grid grid-cols-2 divide-y divide-border overflow-hidden sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0 px-4 py-3.5">
          <p className="label-eyebrow truncate">{metric.label}</p>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="num-kpi text-[26px] leading-none">{metric.value}</span>
            <span className="truncate text-[11px] text-muted-foreground">{metric.hint}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
