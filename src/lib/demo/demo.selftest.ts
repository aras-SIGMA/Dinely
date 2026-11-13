/**
 * Self-check Mode Demo (tanpa framework).
 * Jalankan: npx tsx src/lib/demo/demo.selftest.ts
 */

import { buildDemoOrders, demoMenuItems, demoCategories } from './fixtures';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[PASS] ${message}`);
}

const first = buildDemoOrders();
const second = buildDemoOrders();

assert(first.length > 0, 'Fixture menghasilkan pesanan');
assert(
  first.length === second.length &&
    first.every((o, i) => o.order_code === second[i].order_code && o.status === second[i].status),
  'Fixture deterministik antar pemanggilan'
);

const statuses = new Set(first.map((o) => o.status));
assert(statuses.has('selesai'), 'Ada pesanan selesai (basis laporan pendapatan)');
assert(statuses.has('dibatalkan'), 'Ada pesanan dibatalkan agar kedua laporan berbeda');

const now = Date.now();
const oldest = Math.min(...first.map((o) => new Date(o.created_at).getTime()));
assert(now - oldest <= 31 * 86_400_000, 'Pesanan berada dalam 30 hari terakhir');

assert(
  first.every((o) => (o.order_items ?? []).length > 0),
  'Setiap pesanan punya minimal satu item'
);
assert(
  first.every((o) =>
    (o.order_items ?? []).every((item) => item.subtotal === item.price_snapshot * item.quantity)
  ),
  'Subtotal item konsisten dengan harga snapshot'
);
assert(
  first.every(
    (o) => o.total_amount === (o.order_items ?? []).reduce((sum, item) => sum + item.subtotal, 0)
  ),
  'Total pesanan sama dengan jumlah subtotal item'
);

assert(demoCategories.length > 0 && demoMenuItems.length > 0, 'Katalog demo terisi');
assert(
  demoMenuItems.every((m) => demoCategories.some((c) => c.id === m.category_id)),
  'Setiap menu menunjuk kategori yang ada'
);
