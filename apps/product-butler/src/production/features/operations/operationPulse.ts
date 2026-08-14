import type { OperationMetricCounts, OperationSummary } from "@/production/domain/products";

export interface PulseTrend {
  amount: number;
  improvesWhen: "decrease" | "increase" | "neutral";
  unit: "count" | "percentage-points";
}

export interface PulseMetric {
  hint: string;
  label: string;
  spark: Array<number | null>;
  trend: PulseTrend | null;
  value: number | string;
}

function successRate(counts: OperationMetricCounts): number | null {
  return counts.eligible > 0 ? (counts.succeeded / counts.eligible) * 100 : null;
}

function countTrend(
  current: number,
  previous: number,
  previousOperations: number,
  improvesWhen: PulseTrend["improvesWhen"],
): PulseTrend | null {
  return previousOperations > 0
    ? { amount: current - previous, improvesWhen, unit: "count" }
    : null;
}

function rateTrend(current: OperationMetricCounts, previous: OperationMetricCounts): PulseTrend | null {
  const currentRate = successRate(current);
  const previousRate = successRate(previous);
  if (currentRate === null || previousRate === null) return null;
  return {
    amount: Math.round((currentRate - previousRate) * 10) / 10,
    improvesWhen: "increase",
    unit: "percentage-points",
  };
}

function rateValue(counts: OperationMetricCounts): string {
  const rate = successRate(counts);
  return rate === null ? "—" : `${Math.round(rate)}%`;
}

export function operationPulseMetrics(summary: OperationSummary): PulseMetric[] {
  const { current, previous } = summary;
  return [
    {
      hint: "last 7 days",
      label: "Recent operations",
      spark: summary.buckets.map((bucket) => bucket.operations),
      trend: countTrend(current.operations, previous.operations, previous.operations, "neutral"),
      value: current.operations,
    },
    {
      hint: "successful publishes",
      label: "Published",
      spark: summary.buckets.map((bucket) => bucket.published),
      trend: countTrend(current.published, previous.published, previous.operations, "increase"),
      value: current.published,
    },
    {
      hint: current.eligible > 0 ? `${current.succeeded} of ${current.eligible} final writes` : "no final writes",
      label: "Success rate",
      spark: summary.buckets.map(successRate),
      trend: rateTrend(current, previous),
      value: rateValue(current),
    },
    {
      hint: current.needs_attention > 0 ? "failed, partial or uncertain" : "all clear",
      label: "Needs attention",
      spark: summary.buckets.map((bucket) => bucket.needs_attention),
      trend: countTrend(current.needs_attention, previous.needs_attention, previous.operations, "decrease"),
      value: current.needs_attention,
    },
  ];
}
