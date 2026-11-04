/**
 * ============================================================================
 * RESTOLINK - Reactive Cart Store (FS-11 / Milestone 6)
 * ============================================================================
 * Mengelola keranjang belanja pembeli (guest) berbasis Svelte 5 Runes.
 *
 * Fitur Utama:
 * 1. Multi-Tenant Isolated: Keranjang belanja terikat unik per tenant_id
 *    sehingga item tidak saling bercampur antar toko/subdomain.
 * 2. Persistent: Otomatis sinkronisasi ke LocalStorage browser.
 * 3. Reactive Metrics: Perhitungan subtotal, total items, dan validasi stok/ketersediaan.
 * 4. Payload Generator: Siap dipetakan langsung ke RPC Postgres `create_guest_order`.
 * ============================================================================
 */

import type { GuestOrderItemPayload } from '@/types';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  categoryName?: string | null;
}

export interface AddItemInput {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryName?: string | null;
  is_available?: boolean;
}

export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_ITEMS_IN_CART = 50; // Sesuai constraint RPC create_guest_order (1-50 item)

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

class CartStore {
  items = $state<CartItem[]>([]);
  tenantId = $state<string | null>(null);

  get totalItems(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get formattedSubtotal(): string {
    return formatRupiah(this.subtotal);
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  get itemCount(): number {
    return this.items.length;
  }

  /**
   * Menghasilkan payload format array yang dibutuhkan oleh RPC `create_guest_order`
   */
  get rpcPayloadItems(): GuestOrderItemPayload[] {
    return this.items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity
    }));
  }

  /**
   * Inisialisasi keranjang untuk tenant tertentu.
   * Jika tenant berpindah, load item milik tenant tersebut dari LocalStorage.
   */
  initTenant(targetTenantId: string): void {
    if (!targetTenantId) return;

    if (this.tenantId !== targetTenantId) {
      this.tenantId = targetTenantId;
      this.loadFromStorage();
    }
  }

  /**
   * Mengambil kuantitas item tertentu di dalam keranjang saat ini.
   */
  getItemQuantity(menuItemId: string): number {
    const found = this.items.find((item) => item.menuItemId === menuItemId);
    return found ? found.quantity : 0;
  }

  /**
   * Menambahkan item menu ke keranjang.
   * Validasi:
   * - Menolak item yang berstatus tidak tersedia (is_available === false)
   * - Menolak jika variasi item melebihi MAX_ITEMS_IN_CART (50)
   * - Membatasi kuantitas maksimum per item hingga MAX_QUANTITY_PER_ITEM (99)
   */
  addItem(item: AddItemInput, quantity = 1): { success: boolean; message?: string } {
    if (item.is_available === false) {
      return { success: false, message: `Menu "${item.name}" saat ini sedang habis.` };
    }

    if (quantity <= 0) {
      return { success: false, message: 'Kuantitas pesanan minimal 1.' };
    }

    const existingIndex = this.items.findIndex((i) => i.menuItemId === item.id);

    if (existingIndex >= 0) {
      const currentQty = this.items[existingIndex].quantity;
      const nextQty = Math.min(MAX_QUANTITY_PER_ITEM, currentQty + quantity);

      if (currentQty >= MAX_QUANTITY_PER_ITEM) {
        return {
          success: false,
          message: `Maksimal pemesanan per menu adalah ${MAX_QUANTITY_PER_ITEM}.`
        };
      }

      this.items[existingIndex].quantity = nextQty;
    } else {
      if (this.items.length >= MAX_ITEMS_IN_CART) {
        return {
          success: false,
          message: `Keranjang sudah mencapai batas maksimal ${MAX_ITEMS_IN_CART} jenis menu.`
        };
      }

      this.items.push({
        menuItemId: item.id,
        name: item.name,
        price: Math.max(0, item.price),
        quantity: Math.min(MAX_QUANTITY_PER_ITEM, quantity),
        imageUrl: item.imageUrl ?? null,
        categoryName: item.categoryName ?? null
      });
    }

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Memperbarui kuantitas suatu item dalam keranjang.
   * Jika kuantitas <= 0, item otomatis dihapus.
   */
  updateQuantity(menuItemId: string, newQuantity: number): void {
    const index = this.items.findIndex((item) => item.menuItemId === menuItemId);
    if (index === -1) return;

    if (newQuantity <= 0) {
      this.items.splice(index, 1);
    } else {
      this.items[index].quantity = Math.min(MAX_QUANTITY_PER_ITEM, newQuantity);
    }

    this.saveToStorage();
  }

  /**
   * Menambah kuantitas item sebanyak 1.
   */
  increment(menuItemId: string): void {
    const current = this.getItemQuantity(menuItemId);
    this.updateQuantity(menuItemId, current + 1);
  }

  /**
   * Mengurangi kuantitas item sebanyak 1. Otomatis terhapus jika menjadi 0.
   */
  decrement(menuItemId: string): void {
    const current = this.getItemQuantity(menuItemId);
    this.updateQuantity(menuItemId, current - 1);
  }

  /**
   * Menghapus item dari keranjang berdasarkan ID menu.
   */
  removeItem(menuItemId: string): void {
    this.items = this.items.filter((item) => item.menuItemId !== menuItemId);
    this.saveToStorage();
  }

  /**
   * Mengosongkan seluruh item dalam keranjang untuk tenant aktif.
   */
  clearCart(): void {
    this.items = [];
    this.saveToStorage();
  }

  /**
   * Kunci penyimpanan unik per tenant di LocalStorage.
   */
  #getStorageKey(): string {
    const tenantKey = this.tenantId ? this.tenantId : 'global';
    return `restolink_cart_${tenantKey}`;
  }

  /**
   * Menyimpan state keranjang saat ini ke LocalStorage.
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const key = this.#getStorageKey();
      if (this.items.length === 0) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(this.items));
      }
    } catch (err) {
      console.warn('[cartStore] Gagal menyimpan keranjang ke LocalStorage:', err);
    }
  }

  /**
   * Memuat data keranjang dari LocalStorage untuk tenant aktif.
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.items = [];
      return;
    }

    try {
      const key = this.#getStorageKey();
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        this.items = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Validasi dan sanitasi item hasil muatan storage
        this.items = parsed
          .filter(
            (item): item is CartItem =>
              item &&
              typeof item.menuItemId === 'string' &&
              typeof item.name === 'string' &&
              typeof item.price === 'number' &&
              typeof item.quantity === 'number' &&
              item.quantity > 0
          )
          .map((item) => ({
            ...item,
            quantity: Math.min(MAX_QUANTITY_PER_ITEM, item.quantity)
          }));
      } else {
        this.items = [];
      }
    } catch {
      this.items = [];
    }
  }
}

export const cartStore = new CartStore();
