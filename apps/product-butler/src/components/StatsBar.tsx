import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { cn } from '@/lib/utils';

type Metric = {
  label: string;
  value: number | string;
  hint?: string;
  delta?: number;
  spark?: number[];
};

const Sparkline: React.FC<{ points: number[]; className?: string }> = ({ points, className }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 24 - ((p - min) / range) * 22 - 1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className={cn('h-6 w-16', className)}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const Delta: React.FC<{ value: number }> = ({ value }) => {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums',
        value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </span>
  );
};

export const StatsBar: React.FC = () => {
  const { products, getProductsAddedToday, getProductsAddedThisWeek } = useProductStore();
  const showTrends = usePrefsStore((s) => s.prefs.showKpiTrends);

  const perDay = React.useMemo(() => {
    const days = Array.from({ length: 7 }, () => 0);
    products.forEach((p) => {
      const diff = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
      const index = 6 - diff;
      if (diff >= 0 && diff < 7 && days[index] !== undefined) days[index] += 1;
    });
    return days;
  }, [products]);

  const today = getProductsAddedToday();
  const week = getProductsAddedThisWeek();
  const synced = products.filter((p) => p.status === 'synced').length;
  const failed = products.filter((p) => p.status === 'error').length;
  const successRate = products.length ? `${Math.round((synced / products.length) * 100)}%` : '—';
  const prevWeekAvg = perDay.slice(0, 4).reduce((a, b) => a + b, 0) / 4 || 0;
  const lastAvg = perDay.slice(4).reduce((a, b) => a + b, 0) / 3 || 0;
  const delta = prevWeekAvg ? Math.round(((lastAvg - prevWeekAvg) / prevWeekAvg) * 100) : 0;

  const metrics: Metric[] = [
    { label: 'Added today', value: today, hint: 'products', delta, spark: perDay },
    { label: 'Last 7 days', value: week, hint: 'products', spark: perDay },
    { label: 'Sync success', value: successRate, hint: products.length ? `${synced} synced` : 'no operations' },
    { label: 'Needs attention', value: failed, hint: failed ? 'failed syncs' : 'all clear' },
  ];

  return (
    <div className="surface-card divide-y sm:divide-y-0 sm:divide-x divide-border grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
      {metrics.map((m) => (
        <div key={m.label} className="px-4 py-3.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="label-eyebrow truncate">{m.label}</p>
            {showTrends && m.delta !== undefined && <Delta value={m.delta} />}
          </div>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[26px] leading-none num-kpi">{m.value}</span>
              {m.hint && (
                <span className="ml-1.5 text-[11px] text-muted-foreground truncate">{m.hint}</span>
              )}
            </div>
            {showTrends && m.spark && (
              <Sparkline points={m.spark} className="text-foreground/25 shrink-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
