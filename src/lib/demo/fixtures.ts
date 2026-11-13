/**
 * ============================================================================
 * DINELY - Demo Mode Fixtures
 * ============================================================================
 * Data contoh untuk Mode Demo. Tidak pernah menyentuh Supabase.
 * Tanggal pesanan dibuat relatif terhadap hari ini agar laporan selalu berisi.
 * ============================================================================
 */

import type {
  Category,
  MenuItem,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  Package,
  Profile,
  PublicTenant,
  Tenant
} from '@/types';

export const DEMO_TENANT_ID = 'd0000000-0000-0000-0000-000000000001';
export const DEMO_OWNER_ID = 'd0000000-0000-0000-0000-000000000099';
export const DEMO_SUBDOMAIN = 'demo';
export const DEMO_PASSWORD_HINT = 'demo12345';

export const demoProfile: Profile = {
  id: DEMO_OWNER_ID,
  full_name: 'Nia Kusuma',
  phone: '081234567890',
  role: 'owner',
  created_at: '2025-01-01T00:00:00.000Z'
};

export const demoTenant: Tenant = {
  id: DEMO_TENANT_ID,
  owner_id: DEMO_OWNER_ID,
  business_name: 'Dapur Bu Nia',
  subdomain: DEMO_SUBDOMAIN,
  logo_url: null,
  description:
    'Masakan rumahan khas Sunda dengan bahan segar setiap hari. Melayani pesanan dine-in, bungkus, dan katering kecil.',
  contact_phone: '081234567890',
  contact_whatsapp: '6281234567890',
  address: 'Jl. Melati No. 12, Bandung',
  primary_color: '#ea580c',
  status: 'active',
  current_package_id: 'p-mikro',
  trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  subscription_ends_at: null,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString()
};

export const demoPublicTenant: PublicTenant = {
  id: demoTenant.id,
  business_name: demoTenant.business_name,
  subdomain: demoTenant.subdomain,
  logo_url: demoTenant.logo_url,
  description: demoTenant.description,
  contact_phone: demoTenant.contact_phone,
  contact_whatsapp: demoTenant.contact_whatsapp,
  address: demoTenant.address,
  primary_color: demoTenant.primary_color,
  status: demoTenant.status
};

export const demoPackages: Package[] = [
  {
    id: 'p-mikro',
    name: 'Mikro',
    tier: 'mikro',
    price_monthly: 49000,
    price_6_months: 249000,
    price_yearly: 449000,
    trial_days: 30,
    feature_flags: { website: true, menu_management: true, basic_orders: true },
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  }
];

export const demoCategories: Category[] = [
  { id: 'c-1', tenant_id: DEMO_TENANT_ID, name: 'Makanan Utama', sort_order: 1, created_at: '2025-01-01T00:00:00.000Z' },
  { id: 'c-2', tenant_id: DEMO_TENANT_ID, name: 'Lauk Tambahan', sort_order: 2, created_at: '2025-01-01T00:00:00.000Z' },
  { id: 'c-3', tenant_id: DEMO_TENANT_ID, name: 'Minuman', sort_order: 3, created_at: '2025-01-01T00:00:00.000Z' },
  { id: 'c-4', tenant_id: DEMO_TENANT_ID, name: 'Camilan', sort_order: 4, created_at: '2025-01-01T00:00:00.000Z' },
  { id: 'c-5', tenant_id: DEMO_TENANT_ID, name: 'Paket Hemat', sort_order: 5, created_at: '2025-01-01T00:00:00.000Z' },
  { id: 'c-6', tenant_id: DEMO_TENANT_ID, name: 'Katering', sort_order: 6, created_at: '2025-01-01T00:00:00.000Z' }
];

type MenuSeed = [string, string, number, string, boolean];

const MENU_SEEDS: MenuSeed[] = [
  ['Nasi Goreng Kampung', 'Nasi goreng dengan telur, ikan asin, dan sambal terasi.', 22000, 'c-1', true],
  ['Nasi Ayam Bakar', 'Ayam bakar bumbu kecap dengan lalapan dan sambal.', 28000, 'c-1', true],
  ['Sop Iga Sapi', 'Iga sapi empuk dalam kuah bening rempah.', 35000, 'c-1', true],
  ['Mie Goreng Jawa', 'Mie kuning goreng dengan sayuran dan telur.', 20000, 'c-1', true],
  ['Ayam Geprek Sambal Bawang', 'Ayam krispi digeprek dengan sambal bawang pedas.', 25000, 'c-1', true],
  ['Tahu Tempe Goreng', 'Porsi 4 potong, disajikan hangat.', 8000, 'c-2', true],
  ['Perkedel Kentang', 'Dua buah perkedel kentang goreng.', 6000, 'c-2', true],
  ['Es Teh Manis', 'Teh manis segar dengan es batu.', 5000, 'c-3', true],
  ['Es Jeruk Peras', 'Jeruk peras asli tanpa pemanis buatan.', 8000, 'c-3', true],
  ['Kopi Tubruk', 'Kopi robusta lokal diseduh tradisional.', 10000, 'c-3', true],
  ['Pisang Goreng Keju', 'Lima potong pisang goreng dengan topping keju.', 15000, 'c-4', true],
  ['Tempe Mendoan', 'Tempe tipis berbalut tepung bumbu.', 12000, 'c-4', false],
  ['Paket Hemat 1', 'Nasi + ayam bakar + es teh manis.', 33000, 'c-5', true],
  ['Paket Hemat 2', 'Nasi + ayam geprek + es jeruk.', 32000, 'c-5', true]
];

export const demoMenuItems: MenuItem[] = MENU_SEEDS.map((seed, index) => ({
  id: `m-${index + 1}`,
  tenant_id: DEMO_TENANT_ID,
  category_id: seed[3],
  name: seed[0],
  description: seed[1],
  price: seed[2],
  image_url: null,
  is_available: seed[4],
  sort_order: index + 1,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}));

const BUYERS = [
  'Budi Santoso',
  'Siti Rahayu',
  'Agus Setiawan',
  'Dewi Lestari',
  'Rizky Pratama',
  'Maya Anggraini',
  'Fajar Nugroho',
  'Nur Aisyah'
];

const NOTES = [null, null, 'Tanpa sambal', 'Pedas level 2', 'Bungkus terpisah', null];

/** Pseudo-random deterministik agar data demo stabil antar reload. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function jakartaDateKey(daysAgo: number): string {
  const now = new Date();
  const target = new Date(now.getTime() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(target);
}

/**
 * Membangun pesanan demo 30 hari terakhir.
 * Sebagian sengaja dibatalkan agar kedua laporan menunjukkan angka berbeda.
 */
export function buildDemoOrders(): OrderWithItems[] {
  const orders: OrderWithItems[] = [];
  const statusPool: OrderStatus[] = [
    'selesai', 'selesai', 'selesai', 'selesai', 'selesai',
    'selesai', 'selesai', 'dibatalkan', 'diproses', 'baru'
  ];

  let counter = 1;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    // Akhir pekan lebih ramai
    const date = new Date(Date.now() - daysAgo * 86_400_000);
    const weekday = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const baseCount = isWeekend ? 3 : 2;
    const count = baseCount + Math.floor(seeded(daysAgo) * 2);

    for (let i = 0; i < count; i++) {
      const seed = daysAgo * 100 + i;
      const status = statusPool[Math.floor(seeded(seed) * statusPool.length)];
      const dateKey = jakartaDateKey(daysAgo);

      // Jam operasional 07:00 - 21:00 WIB, puncak siang & malam
      const hourPool = [7, 8, 11, 12, 12, 13, 17, 18, 19, 19, 20];
      const hour = hourPool[Math.floor(seeded(seed + 7) * hourPool.length)];
      const minute = Math.floor(seeded(seed + 13) * 60);
      const createdISO = new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`).toISOString();

      const itemCount = 1 + Math.floor(seeded(seed + 3) * 3);
      const orderItems: OrderItem[] = [];
      let total = 0;

      for (let k = 0; k < itemCount; k++) {
        const menuIndex = Math.floor(seeded(seed + k * 17) * demoMenuItems.length);
        const menu = demoMenuItems[menuIndex];
        const quantity = 1 + Math.floor(seeded(seed + k * 31) * 3);
        const subtotal = menu.price * quantity;
        total += subtotal;
        orderItems.push({
          id: `oi-${counter}-${k}`,
          order_id: `o-${counter}`,
          menu_item_id: menu.id,
          menu_item_name_snapshot: menu.name,
          price_snapshot: menu.price,
          quantity,
          subtotal
        });
      }

      // Durasi penyelesaian realistis: 12-45 menit
      const durationMinutes = 12 + Math.floor(seeded(seed + 41) * 33);
      const updatedISO = new Date(
        new Date(createdISO).getTime() + durationMinutes * 60_000
      ).toISOString();

      orders.push({
        id: `o-${counter}`,
        tenant_id: DEMO_TENANT_ID,
        order_code: `DN-${String(1000 + counter)}`,
        buyer_name: BUYERS[Math.floor(seeded(seed + 23) * BUYERS.length)],
        buyer_contact: `08${Math.floor(seeded(seed + 29) * 900000000 + 100000000)}`,
        note: NOTES[Math.floor(seeded(seed + 37) * NOTES.length)],
        status,
        total_amount: total,
        created_at: createdISO,
        updated_at: updatedISO,
        order_items: orderItems
      });

      counter++;
    }
  }

  // Urutkan terbaru dulu, konsisten dengan query asli
  return orders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
