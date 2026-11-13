/**
 * ============================================================================
 * DINELY - Reports & Analytics Data Layer
 * ============================================================================
 * Agregasi laporan operasional pemilik usaha dari data pesanan.
 *
 * Dua laporan dibedakan secara sengaja:
 * 1. Laporan Pendapatan  -> hanya pesanan berstatus `selesai` (uang benar-benar masuk).
 * 2. Laporan Aktivitas   -> seluruh pesanan, termasuk yang dibatalkan (mengukur keramaian
 *                           operasional dan kebocoran pesanan).
 *
 * Seluruh pengelompokan tanggal dan jam memakai zona Asia/Jakarta agar konsisten
 * untuk pengguna di zona waktu mana pun.
 * ============================================================================
 */

import type { OrderStatus, OrderWithItems } from '@/types';

export const REPORT_TIME_ZONE = 'Asia/Jakarta';

export type ReportRangePreset = 7 | 30 | 90;
export type ReportRangeMode = ReportRangePreset | 'custom';

export type ReportRange = {
  mode: ReportRangeMode;
  /** Batas awal inklusif dalam ISO 8601. */
  startISO: string;
  /** Batas akhir inklusif dalam ISO 8601. */
  endISO: string;
  /** Kunci tanggal Jakarta (YYYY-MM-DD) untuk awal rentang. */
  startDateKey: string;
  /** Kunci tanggal Jakarta (YYYY-MM-DD) untuk akhir rentang. */
  endDateKey: string;
};

export type DailyBucket = {
  dateKey: string;
  label: string;
  value: number;
  count: number;
};

export type TopMenuRow = {
  name: string;
  quantity: number;
  revenue: number;
};

export type RevenueReport = {
  totalRevenue: number;
  completedOrders: number;
  averageOrderValue: number;
  daily: DailyBucket[];
  topMenus: TopMenuRow[];
};

export type HourlyBucket = {
  hour: number;
  label: string;
  count: number;
};

export type ActivityReport = {
  totalOrders: number;
  activeOrders: number;
  statusCounts: Record<OrderStatus, number>;
  cancellationRate: number;
  daily: DailyBucket[];
  hourly: HourlyBucket[];
  busiestHour: number | null;
  averageFulfillmentMinutes: number | null;
  measuredFulfillmentOrders: number;
};

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const HOUR_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: REPORT_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23'
});

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short'
});

/** Mengubah timestamp menjadi kunci tanggal Jakarta (YYYY-MM-DD). */
export function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return DATE_KEY_FORMATTER.format(date);
}

/** Mengambil jam (0-23) menurut zona Asia/Jakarta. */
export function toJakartaHour(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Number(HOUR_FORMATTER.format(date));
}

/** Membangun daftar kunci tanggal berurutan (inklusif) antara dua kunci. */
export function dateKeysBetween(startKey: string, endKey: string, maxDays = 400): string[] {
  const keys: string[] = [];
  let cursor = new Date(`${startKey}T12:00:00Z`).getTime();
  const end = new Date(`${endKey}T12:00:00Z`).getTime();
  if (Number.isNaN(cursor) || Number.isNaN(end)) return keys;

  while (cursor <= end && keys.length < maxDays) {
    keys.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += 86_400_000;
  }
  return keys;
}

function dayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return DAY_LABEL_FORMATTER.format(date);
}

/**
 * Menyusun rentang laporan dari preset hari atau tanggal kustom.
 * Tanggal kustom diinterpretasikan sebagai tanggal kalender Jakarta.
 */
export function resolveRange(
  mode: ReportRangeMode,
  customStart?: string,
  customEnd?: string
): ReportRange {
  const todayKey = toDateKey(new Date());

  if (mode === 'custom' && customStart && customEnd) {
    const [startKey, endKey] = customStart <= customEnd
      ? [customStart, customEnd]
      : [customEnd, customStart];

    return {
      mode: 'custom',
      startISO: `${startKey}T00:00:00+07:00`,
      endISO: `${endKey}T23:59:59.999+07:00`,
      startDateKey: startKey,
      endDateKey: endKey
    };
  }

  const days = typeof mode === 'number' ? mode : 30;
  const startTime = new Date(`${todayKey}T12:00:00Z`).getTime() - (days - 1) * 86_400_000;
  const startKey = new Date(startTime).toISOString().slice(0, 10);

  return {
    mode: days,
    startISO: `${startKey}T00:00:00+07:00`,
    endISO: `${todayKey}T23:59:59.999+07:00`,
    startDateKey: startKey,
    endDateKey: todayKey
  };
}

/**
 * Mengambil pesanan beserta rincian item dalam satu rentang tanggal.
 * Implementasi I/O berada di `@/lib/reports-data`.
 */

function buildDailyBuckets(
  range: ReportRange,
  bucketMap: Map<string, { value: number; count: number }>
): DailyBucket[] {
  return dateKeysBetween(range.startDateKey, range.endDateKey).map((dateKey) => {
    const bucket = bucketMap.get(dateKey);
    return {
      dateKey,
      label: dayLabel(dateKey),
      value: bucket?.value ?? 0,
      count: bucket?.count ?? 0
    };
  });
}

/**
 * Laporan Pendapatan: hanya pesanan `selesai` yang dihitung sebagai omzet.
 * Pesanan yang masih berjalan atau dibatalkan tidak dianggap pendapatan.
 */
export function computeRevenueReport(
  orders: OrderWithItems[],
  range: ReportRange
): RevenueReport {
  const completed = orders.filter((order) => order.status === 'selesai');

  const dailyMap = new Map<string, { value: number; count: number }>();
  const menuMap = new Map<string, TopMenuRow>();

  let totalRevenue = 0;

  for (const order of completed) {
    const amount = Number(order.total_amount) || 0;
    totalRevenue += amount;

    const dateKey = toDateKey(order.created_at);
    if (dateKey) {
      const current = dailyMap.get(dateKey) ?? { value: 0, count: 0 };
      dailyMap.set(dateKey, { value: current.value + amount, count: current.count + 1 });
    }

    for (const item of order.order_items ?? []) {
      const name = item.menu_item_name_snapshot || 'Tanpa Nama';
      const quantity = Number(item.quantity) || 0;
      const revenue = Number(item.subtotal) || 0;
      const current = menuMap.get(name) ?? { name, quantity: 0, revenue: 0 };
      menuMap.set(name, {
        name,
        quantity: current.quantity + quantity,
        revenue: current.revenue + revenue
      });
    }
  }

  const topMenus = [...menuMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue,
    completedOrders: completed.length,
    averageOrderValue: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
    daily: buildDailyBuckets(range, dailyMap),
    topMenus
  };
}

/**
 * Laporan Aktivitas: mengukur seluruh pesanan masuk pada rentang.
 * Mencakup pesanan batal untuk menghitung tingkat pembatalan dan
 * jam sibuk operasional.
 */
export function computeActivityReport(
  orders: OrderWithItems[],
  range: ReportRange
): ActivityReport {
  const statusCounts: Record<OrderStatus, number> = {
    baru: 0,
    diproses: 0,
    selesai: 0,
    dibatalkan: 0
  };

  const dailyMap = new Map<string, { value: number; count: number }>();
  const hourlyCounts = new Array<number>(24).fill(0);

  let fulfillmentTotalMinutes = 0;
  let measuredFulfillmentOrders = 0;

  for (const order of orders) {
    if (order.status in statusCounts) {
      statusCounts[order.status]++;
    }

    const dateKey = toDateKey(order.created_at);
    if (dateKey) {
      const current = dailyMap.get(dateKey) ?? { value: 0, count: 0 };
      const nextCount = current.count + 1;
      dailyMap.set(dateKey, { value: nextCount, count: nextCount });
    }

    const hour = toJakartaHour(order.created_at);
    if (hour >= 0 && hour < 24) {
      hourlyCounts[hour]++;
    }

    if (order.status === 'selesai') {
      const created = new Date(order.created_at).getTime();
      const updated = new Date(order.updated_at).getTime();
      if (!Number.isNaN(created) && !Number.isNaN(updated) && updated >= created) {
        // ponytail: updated_at adalah sentuhan terakhir, bukan cap waktu selesai khusus.
        // Tambah kolom completed_at saat butuh akurasi durasi yang lebih ketat.
        fulfillmentTotalMinutes += (updated - created) / 60_000;
        measuredFulfillmentOrders++;
      }
    }
  }

  const totalOrders = orders.length;
  const activeOrders = totalOrders - statusCounts.dibatalkan;

  const hourly: HourlyBucket[] = hourlyCounts.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    count
  }));

  const busiest = hourly.reduce<HourlyBucket | null>(
    (best, current) => (current.count > (best?.count ?? 0) ? current : best),
    null
  );

  return {
    totalOrders,
    activeOrders,
    statusCounts,
    cancellationRate: totalOrders > 0 ? (statusCounts.dibatalkan / totalOrders) * 100 : 0,
    daily: buildDailyBuckets(range, dailyMap),
    hourly,
    busiestHour: busiest && busiest.count > 0 ? busiest.hour : null,
    averageFulfillmentMinutes:
      measuredFulfillmentOrders > 0
        ? Math.round(fulfillmentTotalMinutes / measuredFulfillmentOrders)
        : null,
    measuredFulfillmentOrders
  };
}

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Membuat satu berkas CSV gabungan berisi kedua laporan.
 * Kolom: laporan, kelompok, label, nilai, satuan
 */
export function buildCombinedCsv(
  revenue: RevenueReport,
  activity: ActivityReport,
  range: ReportRange
): string {
  const rows: Array<[string, string, string, string | number, string]> = [
    ['Info', 'Rentang', 'Mulai', range.startDateKey, 'Tanggal'],
    ['Info', 'Rentang', 'Selesai', range.endDateKey, 'Tanggal'],
    ['Info', 'Rentang', 'Zona Waktu', REPORT_TIME_ZONE, 'Zona'],
    ['Pendapatan', 'Ringkasan', 'Total Omzet', revenue.totalRevenue, 'Rupiah'],
    ['Pendapatan', 'Ringkasan', 'Pesanan Selesai', revenue.completedOrders, 'Pesanan'],
    ['Pendapatan', 'Ringkasan', 'Rata-rata Nilai Pesanan', revenue.averageOrderValue, 'Rupiah'],
    ['Aktivitas', 'Ringkasan', 'Total Pesanan', activity.totalOrders, 'Pesanan'],
    ['Aktivitas', 'Ringkasan', 'Pesanan Aktif', activity.activeOrders, 'Pesanan'],
    ['Aktivitas', 'Ringkasan', 'Tingkat Pembatalan', activity.cancellationRate.toFixed(1), 'Persen'],
    [
      'Aktivitas',
      'Ringkasan',
      'Rata-rata Durasi Penyelesaian',
      activity.averageFulfillmentMinutes ?? '-',
      'Menit'
    ],
    ['Aktivitas', 'Ringkasan', 'Pesanan Baru', activity.statusCounts.baru, 'Pesanan'],
    ['Aktivitas', 'Ringkasan', 'Pesanan Diproses', activity.statusCounts.diproses, 'Pesanan'],
    ['Aktivitas', 'Ringkasan', 'Pesanan Selesai', activity.statusCounts.selesai, 'Pesanan'],
    ['Aktivitas', 'Ringkasan', 'Pesanan Dibatalkan', activity.statusCounts.dibatalkan, 'Pesanan']
  ];

  for (const bucket of revenue.daily) {
    rows.push(['Pendapatan', 'Harian', bucket.dateKey, bucket.value, 'Rupiah']);
  }

  for (const menu of revenue.topMenus) {
    rows.push(['Pendapatan', 'Menu Terlaris', menu.name, menu.revenue, 'Rupiah']);
  }

  for (const bucket of activity.daily) {
    rows.push(['Aktivitas', 'Harian', bucket.dateKey, bucket.count, 'Pesanan']);
  }

  for (const bucket of activity.hourly) {
    rows.push(['Aktivitas', 'Jam Sibuk', bucket.label, bucket.count, 'Pesanan']);
  }

  const header = ['laporan', 'kelompok', 'label', 'nilai', 'satuan'];
  const lines = [header.join(','), ...rows.map((row) => row.map(csvCell).join(','))];
  return lines.join('\r\n');
}
