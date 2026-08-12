import { useState } from 'react';
import { useTierStore } from '@/stores/tierStore';
import { ProLock } from '@/components/ProLock';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  throughputData,
  categoryBreakdown,
  teamActivity,
  hourlyActivity,
  topProducts,
  syncSources,
} from '@/lib/mockData';
import {
  TrendingUp, TrendingDown, Zap, CheckCircle2, Clock, Users,
  Download, Filter, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Range = '7d' | '14d' | '30d' | '90d';

function KPI({
  label,
  value,
  delta,
  positive = true,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  sub?: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded',
              positive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="text-[26px] num-kpi leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

const Analytics = () => {
  const { tier } = useTierStore();
  const [range, setRange] = useState<Range>('30d');
  if (tier !== 'pro') return <ProLock feature="analytics" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Performance overview across your stores and team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5 text-xs font-medium">
            {(['7d', '14d', '30d', '90d'] as Range[]).map((p) => (
              <button
                key={p}
                onClick={() => setRange(p)}
                className={cn(
                  'px-2.5 py-1 rounded-[5px] transition',
                  range === p
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-3.5 w-3.5 mr-1.5" /> Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Products created" value="1,247" delta="18.2%" sub="vs. previous 30d" />
        <KPI label="Sync success rate" value="98.4%" delta="2.1%" sub="847 of 861 syncs" />
        <KPI label="Avg. entry time" value="42s" delta="6s" positive={false} sub="per product" />
        <KPI label="Time saved" value="38.2h" delta="9.4%" sub="vs. manual workflow" />
      </div>

      {/* Throughput chart */}
      <div className="surface-card p-5">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold">Daily throughput</h3>
            <p className="text-xs text-muted-foreground">
              Products created vs. previous period · failures highlighted
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-foreground" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" /> Previous
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Failed
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={throughputData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="curr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.22} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={4} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: 'var(--shadow-card)',
              }}
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="transparent"
            />
            <Area type="monotone" dataKey="products" stroke="hsl(var(--foreground))" fill="url(#curr)" strokeWidth={2} />
            <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sources + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-1">Where products come from</h3>
          <p className="text-xs text-muted-foreground mb-4">Acquisition by source · {range}</p>
          <div className="space-y-3">
            {syncSources.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {s.value.toLocaleString()} · {s.pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="text-sm font-semibold mb-1">Category mix</h3>
          <p className="text-xs text-muted-foreground mb-3">By product count</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={75} paddingAngle={2}>
                {categoryBreakdown.map((c) => (
                  <Cell key={c.name} fill={c.color} stroke="hsl(var(--background))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="font-mono text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly activity + Sync health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold">Activity by hour</h3>
              <p className="text-xs text-muted-foreground">Local time · last 30 days</p>
            </div>
            <span className="text-[11px] font-semibold text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Peak at 14:00
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyActivity} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={2} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="products" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card p-5">
          <h3 className="text-sm font-semibold mb-1">Sync health</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
          <div className="space-y-3">
            {[
              { label: 'Successful', value: 824, pct: 97.3, color: 'hsl(var(--success))' },
              { label: 'Pending', value: 14, pct: 1.6, color: 'hsl(var(--warning))' },
              { label: 'Failed', value: 9, pct: 1.1, color: 'hsl(var(--destructive))' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {row.value} · {row.pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Median latency</div>
              <div className="font-mono text-base font-semibold">312ms</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Auto-retries</div>
              <div className="font-mono text-base font-semibold">3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top products + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Top products</h3>
              <p className="text-xs text-muted-foreground">Highest sync volume this period</p>
            </div>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                <th className="text-left px-5 py-2.5">Product</th>
                <th className="text-left px-5 py-2.5">SKU</th>
                <th className="text-right px-5 py-2.5">Synced</th>
                <th className="text-right px-5 py-2.5">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.sku} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-[10px] font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-5 py-3 text-right font-mono">{p.synced}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Team productivity</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Products created per member</p>
          <div className="space-y-3">
            {teamActivity.map((m) => {
              const max = Math.max(...teamActivity.map((x) => x.products));
              return (
                <div key={m.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{m.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {m.products} · {m.avg}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${(m.products / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
