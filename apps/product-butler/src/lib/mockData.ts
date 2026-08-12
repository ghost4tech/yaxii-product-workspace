import { Product } from '@/types/product';

const names = [
  'Linen Crew Tee — Sand',
  'Aero Runner Sneaker 2.0',
  'Ceramic Pour-Over Kettle',
  'Merino Wool Beanie',
  'Field Notebook · Dotted',
  'Walnut Desk Organizer',
  'Cold Brew Glass Carafe',
  'Climbing Chalk Bag',
  'Heritage Denim Jacket',
  'Brass Pocket Compass',
  'Trail Daypack 22L',
  'Wireless Charging Pad',
];

const skus = ['LCT-S', 'AER-2', 'CPK-9', 'MWB-1', 'FND-D', 'WDO-7', 'CBG-3', 'CCB-X', 'HDJ-M', 'BPC-4', 'TDP-22', 'WCP-Q'];

const statuses: Product['status'][] = ['synced', 'synced', 'synced', 'pending', 'error', 'draft'];

export function generateMockProducts(count = 12): Product[] {
  return Array.from({ length: count }).map((_, i) => {
    const status = statuses[i % statuses.length];
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `mock-${i}-${Date.now()}`,
      name: names[i % names.length],
      sku: `${skus[i % skus.length]}-${100 + i}`,
      regularPrice: (19 + i * 7).toFixed(2),
      salePrice: i % 3 === 0 ? (14 + i * 6).toFixed(2) : '',
      categoryId: String((i % 4) + 1),
      stockQuantity: String(10 + i * 3),
      shortDescription: 'A premium item from our mock catalog.',
      longDescription: '',
      images: [],
      variations: [],
      status,
      errorMessage: status === 'error' ? 'Image upload failed (CORS).' : undefined,
      createdAt: date,
      createdBy: ['Sarah K.', 'Marco R.', 'You', 'Lina P.'][i % 4],
      wooCommerceId: status === 'synced' ? 1000 + i : undefined,
      isVariable: i % 5 === 0,
    } satisfies Product;
  });
}

/* ---------- Analytics datasets ---------- */
export const throughputData = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 40 + Math.sin(i / 3) * 18 + (i > 22 ? 22 : 0);
  return {
    day: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    products: Math.max(8, Math.round(base + Math.random() * 18)),
    failed: Math.max(0, Math.round(Math.random() * 4)),
    previous: Math.max(8, Math.round(base * 0.78 + Math.random() * 14)),
  };
});

export const hourlyActivity = Array.from({ length: 24 }).map((_, h) => ({
  hour: `${h.toString().padStart(2, '0')}:00`,
  products: Math.round(
    Math.max(
      0,
      (h > 8 && h < 19 ? 18 : 4) + Math.sin((h - 6) / 3) * 10 + Math.random() * 8
    )
  ),
}));

export const categoryBreakdown = [
  { name: 'Apparel', value: 412, color: 'hsl(var(--chart-1))' },
  { name: 'Accessories', value: 287, color: 'hsl(var(--chart-2))' },
  { name: 'Home', value: 198, color: 'hsl(var(--chart-3))' },
  { name: 'Outdoor', value: 154, color: 'hsl(var(--chart-4))' },
  { name: 'Tech', value: 96, color: 'hsl(var(--chart-5))' },
];

export const teamActivity = [
  { name: 'Sarah K.', products: 312, avg: '38s', success: 99.1 },
  { name: 'Marco R.', products: 248, avg: '42s', success: 98.4 },
  { name: 'Lina P.', products: 196, avg: '51s', success: 97.6 },
  { name: 'You', products: 89, avg: '47s', success: 98.9 },
];

export const topProducts = [
  { name: 'Aero Runner Sneaker 2.0', sku: 'AER-2-101', synced: 124, revenue: '$18,240' },
  { name: 'Heritage Denim Jacket', sku: 'HDJ-M-108', synced: 96, revenue: '$14,400' },
  { name: 'Ceramic Pour-Over Kettle', sku: 'CPK-9-102', synced: 84, revenue: '$9,660' },
  { name: 'Trail Daypack 22L', sku: 'TDP-22-110', synced: 72, revenue: '$8,640' },
  { name: 'Linen Crew Tee — Sand', sku: 'LCT-S-100', synced: 68, revenue: '$3,400' },
];

export const syncSources = [
  { label: 'Manual entry', value: 612, pct: 62.4, color: 'hsl(var(--chart-1))' },
  { label: 'CSV import', value: 248, pct: 25.3, color: 'hsl(var(--chart-2))' },
  { label: 'AI assist', value: 84, pct: 8.6, color: 'hsl(var(--chart-4))' },
  { label: 'API', value: 36, pct: 3.7, color: 'hsl(var(--chart-3))' },
];

export const recentEvents = [
  { time: '2 min ago', actor: 'Sarah K.', action: 'created', target: 'Aero Runner Sneaker 2.0' },
  { time: '6 min ago', actor: 'System', action: 'synced 12 products to', target: 'EU Warehouse' },
  { time: '14 min ago', actor: 'Marco R.', action: 'updated category for', target: 'Apparel' },
  { time: '38 min ago', actor: 'Lina P.', action: 'uploaded CSV with', target: '48 products' },
  { time: '1 hr ago', actor: 'System', action: 'retried failed sync on', target: 'Brass Pocket Compass' },
];
