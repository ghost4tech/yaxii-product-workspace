import { describe, expect, it } from "vitest";
import type { OperationMetricCounts, OperationSummary } from "@/production/domain/products";
import { operationPulseMetrics } from "./operationPulse";

const current: OperationMetricCounts = {
  eligible: 4,
  needs_attention: 3,
  operations: 6,
  published: 1,
  succeeded: 2,
};

function pulseSummary(previous: OperationMetricCounts): OperationSummary {
  return {
    buckets: [
      { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 },
      { eligible: 1, needs_attention: 0, operations: 1, published: 1, succeeded: 1 },
      { eligible: 1, needs_attention: 1, operations: 1, published: 0, succeeded: 0 },
      { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 },
      { eligible: 1, needs_attention: 1, operations: 2, published: 0, succeeded: 1 },
      { eligible: 1, needs_attention: 1, operations: 2, published: 0, succeeded: 0 },
      { eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0 },
    ],
    current,
    previous,
    window: {
      bucket_hours: 24,
      ends_at: "2026-08-14T12:00:00+00:00",
      previous_starts_at: "2026-07-31T12:00:00+00:00",
      starts_at: "2026-08-07T12:00:00+00:00",
    },
  };
}

describe("operationPulseMetrics", () => {
  it("uses only final writes for the success-rate denominator", () => {
    const metrics = operationPulseMetrics(pulseSummary({
      eligible: 2, needs_attention: 1, operations: 2, published: 1, succeeded: 1,
    }));

    expect(metrics.map((metric) => metric.value)).toEqual([6, 1, "50%", 3]);
    expect(metrics[2]?.hint).toBe("2 of 4 final writes");
    expect(metrics[0]?.trend).toMatchObject({ amount: 4, improvesWhen: "neutral" });
    expect(metrics[2]?.trend).toMatchObject({ amount: 0, unit: "percentage-points" });
    expect(metrics[3]?.trend).toMatchObject({ amount: 2, improvesWhen: "decrease" });
  });

  it("shows neutral trends when no previous-period history exists", () => {
    const metrics = operationPulseMetrics(pulseSummary({
      eligible: 0, needs_attention: 0, operations: 0, published: 0, succeeded: 0,
    }));

    expect(metrics.every((metric) => metric.trend === null)).toBe(true);
    expect(metrics[0]?.spark).toEqual([0, 1, 1, 0, 2, 2, 0]);
  });
});
