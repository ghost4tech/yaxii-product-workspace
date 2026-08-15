import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  operationPulseMetrics,
  type PulseMetric,
  type PulseTrend,
} from "@/production/features/operations/operationPulse";
import { useOperationPulse } from "@/production/features/operations/useOperationPulse";
import { usePrefsStore } from "@/stores/prefsStore";
import { __ } from "@/production/core/i18n/wordpress";

function sparkPath(points: Array<number | null>): string | null {
  const finite = points.filter((point): point is number => point !== null);
  if (finite.length < 2) return null;
  const maximum = Math.max(...finite, 1);
  const minimum = Math.min(...finite);
  const range = maximum - minimum || 1;
  return points.map((point, index) => {
    if (point === null) return "";
    const x = (index / (points.length - 1)) * 100;
    const y = 23 - ((point - minimum) / range) * 22;
    const previous = index > 0 ? points[index - 1] : null;
    return `${previous === null ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function Sparkline({ points }: { points: Array<number | null> }) {
  const path = sparkPath(points);
  if (!path) return <span className="h-6 w-16 shrink-0" aria-hidden="true" />;
  return <svg viewBox="0 0 100 24" preserveAspectRatio="none"
    className="h-6 w-16 shrink-0 text-foreground/25" aria-hidden="true">
    <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function trendTone(trend: PulseTrend): string {
  if (trend.amount === 0 || trend.improvesWhen === "neutral") return "text-muted-foreground";
  const improved = trend.improvesWhen === "increase" ? trend.amount > 0 : trend.amount < 0;
  return improved ? "text-success" : "text-destructive";
}

function Delta({ trend }: { trend: PulseTrend }) {
  const Icon = trend.amount > 0 ? ArrowUpRight : trend.amount < 0 ? ArrowDownRight : Minus;
  const unit = trend.unit === "percentage-points" ? " pp" : "";
  const sign = trend.amount > 0 ? "+" : trend.amount < 0 ? "−" : "";
  return <span dir="ltr" className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums", trendTone(trend))}>
    <Icon className="h-3 w-3" />{sign}{Math.abs(trend.amount)}{unit}
  </span>;
}

function unavailableMetrics(hint: string): PulseMetric[] {
  return [__("Recent operations", "yaxii-product-workspace"), __("Published", "yaxii-product-workspace"), __("Success rate", "yaxii-product-workspace"), __("Needs attention", "yaxii-product-workspace")].map((label) => ({
    hint, label, spark: [], trend: null, value: "—",
  }));
}

export function StatsBar() {
  const pulse = useOperationPulse();
  const showTrends = usePrefsStore((state) => state.prefs.showKpiTrends);
  const metrics = pulse.data
    ? operationPulseMetrics(pulse.data)
    : unavailableMetrics(pulse.isError ? __("unavailable", "yaxii-product-workspace") : __("loading", "yaxii-product-workspace"));

  return (
    <div className="surface-card grid grid-cols-2 divide-y divide-border overflow-hidden sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0 px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="label-eyebrow truncate">{metric.label}</p>
            {showTrends && metric.trend && <Delta trend={metric.trend} />}
          </div>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <bdi className="num-kpi text-[26px] leading-none" dir="ltr">{metric.value}</bdi>
              <span className="ms-1.5 truncate text-[11px] text-muted-foreground">{metric.hint}</span>
            </div>
            {showTrends && <Sparkline points={metric.spark} />}
          </div>
        </div>
      ))}
    </div>
  );
}
