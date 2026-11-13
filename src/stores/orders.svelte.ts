/**
 * ============================================================================
 * DINELY - Owner Orders Store (FS-13 / Milestone 7)
 * ============================================================================
 * Mengelola antrean pesanan masuk, pembaruan status bertahap,
 * dan sinkronisasi real-time via polling 15 detik di Dashboard Pemilik Usaha.
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import { toastState } from '@/stores/toast.svelte';
import { isDemoMode } from '@/lib/demo/mode';
import { demoStore } from '@/lib/demo/store';
import type { OrderStatus, OrderWithItems } from '@/types';

export type StatusFilter = OrderStatus | 'all';

export interface StatusTransitionAction {
  label: string;
  nextStatus: OrderStatus;
  variant: 'primary' | 'secondary' | 'danger';
}

/**
 * Aturan transisi status pesanan yang sah.
 * Mencegah status yang sudah selesai atau dibatalkan diubah kembali.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  baru: ['diproses', 'dibatalkan'],
  diproses: ['selesai', 'dibatalkan'],
  selesai: [],
  dibatalkan: []
};

export function isTransitionAllowed(current: OrderStatus, next: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'baru':
      return 'Pesanan Baru';
    case 'diproses':
      return 'Sedang Diproses';
    case 'selesai':
      return 'Selesai';
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
}

export function getOrderStatusTone(
  status: OrderStatus
): 'brand' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'baru':
      return 'brand';
    case 'diproses':
      return 'warning';
    case 'selesai':
      return 'success';
    case 'dibatalkan':
      return 'danger';
    default:
      return 'brand';
  }
}

export function getNextStatusActions(current: OrderStatus): StatusTransitionAction[] {
  switch (current) {
    case 'baru':
      return [
        { label: 'Proses Pesanan', nextStatus: 'diproses', variant: 'primary' },
        { label: 'Tolak / Batalkan', nextStatus: 'dibatalkan', variant: 'danger' }
      ];
    case 'diproses':
      return [
        { label: 'Selesaikan Pesanan', nextStatus: 'selesai', variant: 'primary' },
        { label: 'Batalkan Pesanan', nextStatus: 'dibatalkan', variant: 'danger' }
      ];
    default:
      return [];
  }
}

class OrdersStore {
  orders = $state<OrderWithItems[]>([]);
  loading = $state(false);
  updatingId = $state<string | null>(null);
  selectedStatus = $state<StatusFilter>('all');
  selectedOrder = $state<OrderWithItems | null>(null);
  errorMessage = $state<string | null>(null);
  activeTenantId = $state<string | null>(null);

  #pollTimer: any = null;

  get filteredOrders(): OrderWithItems[] {
    if (this.selectedStatus === 'all') {
      return this.orders;
    }
    return this.orders.filter((order) => order.status === this.selectedStatus);
  }

  get countsByStatus(): Record<StatusFilter, number> {
    const counts: Record<StatusFilter, number> = {
      all: this.orders.length,
      baru: 0,
      diproses: 0,
      selesai: 0,
      dibatalkan: 0
    };

    for (const order of this.orders) {
      if (order.status in counts) {
        counts[order.status]++;
      }
    }

    return counts;
  }

  get newOrderCount(): number {
    return this.countsByStatus.baru;
  }

  get isEmpty(): boolean {
    return this.orders.length === 0;
  }

  get isFilteredEmpty(): boolean {
    return this.filteredOrders.length === 0;
  }

  /**
   * Mengambil daftar pesanan beserta rincian item (order_items) milik tenant.
   */
  async fetchOrders(tenantId: string, silent = false): Promise<void> {
    if (!tenantId) return;
    this.activeTenantId = tenantId;

    // Mode demo: baca langsung dari sandbox lokal, tanpa polling jaringan.
    if (isDemoMode()) {
      const demoOrders = demoStore.orders;
      this.orders = demoOrders;
      this.errorMessage = null;
      if (this.selectedOrder) {
        const updated = demoOrders.find((o) => o.id === this.selectedOrder?.id);
        if (updated) this.selectedOrder = updated;
      }
      this.loading = false;
      return;
    }

    if (!silent) {
      this.loading = true;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          tenant_id,
          order_code,
          buyer_name,
          buyer_contact,
          note,
          status,
          total_amount,
          created_at,
          updated_at,
          order_items (
            id,
            order_id,
            menu_item_id,
            menu_item_name_snapshot,
            price_snapshot,
            quantity,
            subtotal
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ordersStore] Error fetch orders:', error.message);
        this.errorMessage = error.message;
        if (!silent) {
          toastState.push('Gagal memuat daftar pesanan resto.', 'error');
        }
        return;
      }

      this.orders = (data as OrderWithItems[]) || [];
      this.errorMessage = null;

      // Sinkronkan selectedOrder jika sedang terbuka di modal
      if (this.selectedOrder) {
        const updated = this.orders.find((o) => o.id === this.selectedOrder?.id);
        if (updated) {
          this.selectedOrder = updated;
        }
      }
    } catch (err: any) {
      console.error('[ordersStore] Unexpected error in fetchOrders:', err);
      this.errorMessage = err?.message || 'Terjadi kesalahan sistem.';
    } finally {
      if (!silent) {
        this.loading = false;
      }
    }
  }

  /**
   * Memperbarui status pesanan secara bertahap dengan validasi integritas status.
   */
  async updateStatus(orderId: string, nextStatus: OrderStatus): Promise<boolean> {
    const targetOrder = this.orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      toastState.push('Data pesanan tidak ditemukan.', 'error');
      return false;
    }

    const currentStatus = targetOrder.status;

    if (!isTransitionAllowed(currentStatus, nextStatus)) {
      const msg = `Transisi status dari "${getOrderStatusLabel(currentStatus)}" ke "${getOrderStatusLabel(nextStatus)}" tidak diizinkan.`;
      toastState.push(msg, 'error');
      return false;
    }

    this.updatingId = orderId;

    // Mode demo: mutasi langsung ke sandbox lokal.
    if (isDemoMode()) {
      demoStore.updateOrderStatus(orderId, nextStatus);
      targetOrder.status = nextStatus;
      targetOrder.updated_at = new Date().toISOString();
      if (this.selectedOrder && this.selectedOrder.id === orderId) {
        this.selectedOrder.status = nextStatus;
        this.selectedOrder.updated_at = targetOrder.updated_at;
      }
      this.updatingId = null;
      this.notifyStatusChange(targetOrder);
      return true;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('[ordersStore] Error update status:', error.message);
        toastState.push(`Gagal memperbarui status: ${error.message}`, 'error');
        return false;
      }

      // Optimistic update lokal
      targetOrder.status = nextStatus;
      targetOrder.updated_at = new Date().toISOString();

      if (this.selectedOrder && this.selectedOrder.id === orderId) {
        this.selectedOrder.status = nextStatus;
        this.selectedOrder.updated_at = targetOrder.updated_at;
      }

      this.notifyStatusChange(targetOrder);
      return true;
    } catch (err: any) {
      console.error('[ordersStore] Exception in updateStatus:', err);
      toastState.push('Koneksi terganggu saat memperbarui pesanan.', 'error');
      return false;
    } finally {
      this.updatingId = null;
    }
  }

  /**
   * Menyetel pesanan yang sedang diinspeksi (untuk modal detail pesanan).
   */
  selectOrder(order: OrderWithItems | null): void {
    this.selectedOrder = order;
  }

  /** Toast sukses setelah transisi status, dipakai jalur daring maupun demo. */
  private notifyStatusChange(order: OrderWithItems): void {
    const displayCode = order.order_code.startsWith('#')
      ? order.order_code
      : `#${order.order_code}`;
    toastState.push(
      `Pesanan ${displayCode} diubah menjadi "${getOrderStatusLabel(order.status)}".`,
      'success'
    );
  }

  /**
   * Menyetel tab filter status pesanan.
   */
  setStatusFilter(status: StatusFilter): void {
    this.selectedStatus = status;
  }

  /**
   * Memulai polling sinkronisasi pesanan setiap 15 detik.
   */
  startPolling(tenantId: string, intervalMs = 15000): void {
    this.stopPolling();
    this.activeTenantId = tenantId;

    // Mode demo tidak perlu polling: tidak ada server yang berubah.
    if (isDemoMode()) return;

    this.#pollTimer = setInterval(() => {
      if (this.activeTenantId) {
        this.fetchOrders(this.activeTenantId, true);
      }
    }, intervalMs);
  }

  /**
   * Menghentikan interval polling.
   */
  stopPolling(): void {
    if (this.#pollTimer) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
  }

  /**
   * Reset store saat keluar dari dashboard.
   */
  reset(): void {
    this.stopPolling();
    this.orders = [];
    this.loading = false;
    this.updatingId = null;
    this.selectedStatus = 'all';
    this.selectedOrder = null;
    this.errorMessage = null;
    this.activeTenantId = null;
  }
}

export const ordersStore = new OrdersStore();
