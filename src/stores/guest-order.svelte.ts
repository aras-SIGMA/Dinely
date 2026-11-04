/**
 * ============================================================================
 * RESTOLINK - Guest Order Reactive Store (FS-12 / Milestone 6)
 * ============================================================================
 * Mengelola state interaktif proses pemesanan guest dan pelacakan status pesanan
 * secara real-time via polling ringan (10-15s).
 * ============================================================================
 */

import { cartStore } from '@/stores/cart.svelte';
import { toastState } from '@/stores/toast.svelte';
import {
  submitGuestOrder,
  fetchGuestOrderStatus,
  getLastOrderCode,
  clearLastOrderCode,
  type SubmitGuestOrderInput
} from '@/lib/guest-order';
import type {
  CreateGuestOrderResult,
  GetGuestOrderStatusResult,
  GuestOrderItemPayload,
  OrderStatus
} from '@/types';

export interface SubmitOrderForm {
  buyerName: string;
  buyerContact?: string | null;
  note?: string | null;
}

export type OrderBadgeTone = 'info' | 'warning' | 'success' | 'error';

class GuestOrderStore {
  submitting = $state(false);
  trackingLoading = $state(false);
  lastOrder = $state<CreateGuestOrderResult | null>(null);
  orderDetail = $state<GetGuestOrderStatusResult | null>(null);
  errorMessage = $state<string | null>(null);

  #pollTimer: any = null;

  get currentStatus(): OrderStatus | null {
    return this.orderDetail?.status ?? this.lastOrder?.status ?? null;
  }

  get statusLabel(): string {
    switch (this.currentStatus) {
      case 'baru':
        return 'Pesanan Diterima (Menunggu Konfirmasi Kasir)';
      case 'diproses':
        return 'Sedang Dipersiapkan di Dapur';
      case 'selesai':
        return 'Pesanan Siap / Selesai';
      case 'dibatalkan':
        return 'Pesanan Dibatalkan';
      default:
        return 'Memuat Status...';
    }
  }

  get statusTone(): OrderBadgeTone {
    switch (this.currentStatus) {
      case 'baru':
        return 'info';
      case 'diproses':
        return 'warning';
      case 'selesai':
        return 'success';
      case 'dibatalkan':
        return 'error';
      default:
        return 'info';
    }
  }

  get isTerminal(): boolean {
    const status = this.currentStatus;
    return status === 'selesai' || status === 'dibatalkan';
  }

  get activeOrderCode(): string | null {
    return this.orderDetail?.order_code ?? this.lastOrder?.order_code ?? null;
  }

  /**
   * Mengirim pesanan guest: validasi -> RPC Postgres -> kosongkan keranjang -> mulai tracking.
   */
  async submit(
    tenantId: string,
    form: SubmitOrderForm,
    items?: GuestOrderItemPayload[]
  ): Promise<CreateGuestOrderResult | null> {
    const payloadItems = items ?? cartStore.rpcPayloadItems;

    if (!payloadItems || payloadItems.length === 0) {
      this.errorMessage = 'Keranjang belanja masih kosong.';
      toastState.push(this.errorMessage, 'error');
      return null;
    }

    this.submitting = true;
    this.errorMessage = null;

    try {
      const input: SubmitGuestOrderInput = {
        tenantId,
        buyerName: form.buyerName,
        buyerContact: form.buyerContact,
        note: form.note,
        items: payloadItems
      };

      const result = await submitGuestOrder(input);
      this.lastOrder = result;

      // Kosongkan keranjang belanja setelah sukses membuat pesanan
      cartStore.clearCart();
      toastState.push(`Pesanan berhasil dibuat! Kode: ${result.order_code}`, 'success');

      // Ambil rincian pesanan dan mulai polling status otomatis
      await this.track(tenantId, result.order_code);
      this.startPolling(tenantId, result.order_code);

      return result;
    } catch (err: any) {
      console.error('[guestOrderStore] Submit order failed:', err);
      const msg = err?.message || 'Gagal mengirim pesanan. Silakan coba kembali.';
      this.errorMessage = msg;
      toastState.push(msg, 'error');
      return null;
    } finally {
      this.submitting = false;
    }
  }

  /**
   * Mengambil status pesanan tunggal berdasarkan order_code.
   */
  async track(tenantId: string, orderCode: string): Promise<GetGuestOrderStatusResult | null> {
    if (!tenantId || !orderCode) return null;

    this.trackingLoading = true;
    try {
      const res = await fetchGuestOrderStatus(tenantId, orderCode);
      if (res.success) {
        this.orderDetail = res;
        this.errorMessage = null;

        // Jika sudah mencapai status terminal (selesai/batal), hentikan polling
        if (res.status === 'selesai' || res.status === 'dibatalkan') {
          this.stopPolling();
        }
      } else {
        this.errorMessage = res.message || 'Pesanan tidak ditemukan.';
      }
      return res;
    } catch (err: any) {
      console.error('[guestOrderStore] Track order error:', err);
      this.errorMessage = err?.message || 'Koneksi terganggu saat memuat status pesanan.';
      return null;
    } finally {
      this.trackingLoading = false;
    }
  }

  /**
   * Menjalankan polling berkala status pesanan (interval 12 detik).
   */
  startPolling(tenantId: string, orderCode: string, intervalMs = 12000): void {
    this.stopPolling();

    this.#pollTimer = setInterval(async () => {
      if (this.isTerminal) {
        this.stopPolling();
        return;
      }
      await this.track(tenantId, orderCode);
    }, intervalMs);
  }

  /**
   * Menghentikan polling berkala.
   */
  stopPolling(): void {
    if (this.#pollTimer) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
  }

  /**
   * Memulihkan pesanan terakhir pelanggan jika pelanggan me-refresh halaman website.
   */
  async recoverLastOrder(tenantId: string): Promise<boolean> {
    const lastCode = getLastOrderCode(tenantId);
    if (!lastCode) return false;

    const res = await this.track(tenantId, lastCode);
    if (res && res.success) {
      if (!this.isTerminal) {
        this.startPolling(tenantId, lastCode);
      }
      return true;
    }
    return false;
  }

  /**
   * Reset state pelacakan pesanan.
   */
  reset(tenantId?: string): void {
    this.stopPolling();
    this.lastOrder = null;
    this.orderDetail = null;
    this.errorMessage = null;
    this.submitting = false;
    this.trackingLoading = false;
    if (tenantId) {
      clearLastOrderCode(tenantId);
    }
  }
}

export const guestOrderStore = new GuestOrderStore();
