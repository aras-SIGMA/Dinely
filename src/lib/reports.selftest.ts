/**
 * Self-check agregasi laporan (tanpa framework).
 * Jalankan: npx tsx src/lib/reports.selftest.ts
 */

import {
  computeActivityReport,
  computeRevenueReport,
  buildCombinedCsv,
  resolveRange,
  toDateKey,
  toJakartaHour,
  dateKeysBetween
} from './reports';
import type { OrderWithItems } from '../types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[PASS] ${message}`);
}

const range = resolveRange(7, undefined, undefined);

const order = (over: Partial<OrderWithItems>): OrderWithItems => ({
  id: 'o',
  tenant_id: 't',
  order_code: 'X',
  buyer_name: 'Budi',
  buyer_contact: null,
  note: null,
  status: 'selesai',
  total_amount: 0,
  created_at: '2026-01-10T03:00:00.000Z',
  updated_at: '2026-01-10T03:30:00.000Z',
  order_items: [],
  ...over
});

const items = (name: string, qty: number, subtotal: number) => [
  {
    id: 'i',
    order_id: 'o',
    menu_item_id: 'm',
    menu_item_name_snapshot: name,
    price_snapshot: subtotal / qty,
    quantity: qty,
    subtotal
  }
];

const orders: OrderWithItems[] = [
  order({ id: '1', status: 'selesai', total_amount: 50_000, order_items: items('Nasi Goreng', 2, 50_000) }),
  order({ id: '2', status: 'selesai', total_amount: 30_000, order_items: items('Es Teh', 3, 30_000) }),
  order({ id: '3', status: 'dibatalkan', total_amount: 25_000, order_items: items('Nasi Goreng', 1, 25_000) }),
  order({ id: '4', status: 'baru', total_amount: 10_000, order_items: items('Es Teh', 1, 10_000) })
];

const revenue = computeRevenueReport(orders, range);
assert(revenue.totalRevenue === 80_000, 'Omzet hanya menghitung pesanan selesai (80.000)');
assert(revenue.completedOrders === 2, 'Jumlah pesanan selesai = 2');
assert(revenue.averageOrderValue === 40_000, 'Rata-rata nilai pesanan selesai = 40.000');
assert(revenue.topMenus[0].name === 'Nasi Goreng', 'Menu terlaris berdasarkan omzet = Nasi Goreng');
assert(
  revenue.topMenus.find((m) => m.name === 'Nasi Goreng')?.revenue === 50_000,
  'Omzet menu mengabaikan pesanan dibatalkan'
);

const activity = computeActivityReport(orders, range);
assert(activity.totalOrders === 4, 'Aktivitas menghitung seluruh pesanan = 4');
assert(activity.activeOrders === 3, 'Pesanan aktif = 3 (4 dikurangi 1 batal)');
assert(activity.statusCounts.dibatalkan === 1, 'Status dibatalkan terhitung = 1');
assert(Math.round(activity.cancellationRate) === 25, 'Tingkat pembatalan = 25%');
assert(activity.averageFulfillmentMinutes === 30, 'Rata-rata penyelesaian = 30 menit');
assert(activity.measuredFulfillmentOrders === 2, 'Sampel durasi = 2 pesanan selesai');

const csv = buildCombinedCsv(revenue, activity, range);
assert(csv.startsWith('laporan,kelompok,label,nilai,satuan'), 'Header CSV sesuai kontrak');
assert(csv.includes('Pendapatan,Ringkasan,Total Omzet,80000,Rupiah'), 'Baris omzet ada di CSV');
assert(csv.includes('Aktivitas,Ringkasan,Tingkat Pembatalan,25.0,Persen'), 'Baris pembatalan ada di CSV');

assert(toDateKey('2026-01-10T03:00:00.000Z') === '2026-01-10', 'Konversi tanggal Jakarta benar');
assert(toJakartaHour('2026-01-10T01:00:00.000Z') === 8, 'Konversi jam Jakarta = WIB (+7)');
assert(dateKeysBetween('2026-01-01', '2026-01-07').length === 7, 'Rentang 7 hari menghasilkan 7 kunci');
assert(resolveRange(30).startDateKey < resolveRange(7).startDateKey, 'Preset 30 hari lebih panjang dari 7 hari');

const custom = resolveRange('custom', '2026-03-05', '2026-03-01');
assert(custom.startDateKey === '2026-03-01', 'Rentang kustom menormalkan urutan tanggal');
assert(custom.endDateKey === '2026-03-05', 'Rentang kustom menyimpan tanggal akhir');

console.log(process.exitCode === 1 ? '\nHasil: ADA YANG GAGAL' : '\nHasil: Semua self-check lulus');
