/**
 * ============================================================================
 * DINELY - Demo Mode Store
 * ============================================================================
 * Sandbox lokal persisten. Tidak pernah memanggil Supabase, Midtrans, Gemini.
 * Seluruh mutasi disimpan di `localStorage` agar demo terasa hidup, dan dapat
 * dikembalikan ke kondisi awal lewat tombol reset manual.
 * ============================================================================
 */

import {
  DEMO_TENANT_ID,
  buildDemoOrders,
  demoCategories,
  demoMenuItems,
  demoPackages,
  demoProfile,
  demoTenant
} from './fixtures';
import type { Category, MenuItem, OrderStatus, OrderWithItems, Package } from '@/types';

export const DEMO_STORAGE_KEY = 'restolink_demo_state_v1';
export const DEMO_FLAG_KEY = 'restolink_demo_active';

export type DemoState = {
  orders: OrderWithItems[];
  categories: Category[];
  menuItems: MenuItem[];
  packages: Package[];
  /** Status langganan setelah pembayaran demo berhasil. */
  subscriptionStatus: 'trial' | 'active';
};

function buildInitialState(): DemoState {
  return {
    orders: buildDemoOrders(),
    categories: demoCategories.map((c) => ({ ...c })),
    menuItems: demoMenuItems.map((m) => ({ ...m })),
    packages: demoPackages.map((p) => ({ ...p })),
    subscriptionStatus: 'trial'
  };
}

let state: DemoState | null = null;

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function hydrate(): DemoState {
  if (state) return state;

  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (Array.isArray(parsed?.orders) && Array.isArray(parsed?.menuItems)) {
          state = parsed;
          return state;
        }
      }
    } catch {
      // Data lokal rusak -> bangun ulang dari fixture.
    }
  }

  state = buildInitialState();
  persist();
  return state;
}

function persist(): void {
  if (!hasStorage() || !state) return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[demo] Gagal menyimpan state demo:', err);
  }
}

/** Membersihkan seluruh jejak mode demo. */
export function resetDemoState(): void {
  state = buildInitialState();
  persist();
}

export const demoStore = {
  getState(): DemoState {
    return hydrate();
  },

  get orders(): OrderWithItems[] {
    return hydrate().orders;
  },

  get categories(): Category[] {
    return hydrate().categories;
  },

  get menuItems(): MenuItem[] {
    return hydrate().menuItems;
  },

  get packages(): Package[] {
    return hydrate().packages;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const current = hydrate();
    const target = current.orders.find((o) => o.id === orderId);
    if (!target) return;
    target.status = status;
    target.updated_at = new Date().toISOString();
    persist();
  },

  setMenuAvailability(menuItemId: string, isAvailable: boolean): void {
    const current = hydrate();
    const target = current.menuItems.find((m) => m.id === menuItemId);
    if (!target) return;
    target.is_available = isAvailable;
    target.updated_at = new Date().toISOString();
    persist();
  },

  upsertMenuItem(item: MenuItem): void {
    const current = hydrate();
    const index = current.menuItems.findIndex((m) => m.id === item.id);
    if (index >= 0) current.menuItems[index] = item;
    else current.menuItems.push(item);
    persist();
  },

  deleteMenuItem(menuItemId: string): void {
    const current = hydrate();
    current.menuItems = current.menuItems.filter((m) => m.id !== menuItemId);
    persist();
  },

  addCategory(category: Category): void {
    hydrate().categories.push(category);
    persist();
  },

  updateCategory(categoryId: string, name: string): void {
    const target = hydrate().categories.find((c) => c.id === categoryId);
    if (target) target.name = name;
    persist();
  },

  deleteCategory(categoryId: string): void {
    const current = hydrate();
    current.categories = current.categories.filter((c) => c.id !== categoryId);
    persist();
  },

  /** Menambahkan pesanan baru dari website tenant demo. */
  addOrder(order: OrderWithItems): void {
    hydrate().orders.unshift(order);
    persist();
  },

  markSubscriptionActive(): void {
    hydrate().subscriptionStatus = 'active';
    persist();
  },

  reset(): void {
    resetDemoState();
  }
};

/** Identitas fixture dipakai modul lain untuk mencocokkan tenant demo. */
export const DEMO_IDS = {
  tenantId: DEMO_TENANT_ID,
  profile: demoProfile,
  tenant: demoTenant
};
