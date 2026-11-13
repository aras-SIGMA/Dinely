import { supabase } from '@/lib/supabase';
import { authStore } from '@/stores/auth.svelte';
import { toastState } from '@/stores/toast.svelte';
import { isDemoMode } from '@/lib/demo/mode';
import { demoStore } from '@/lib/demo/store';
import {
  createSubscriptionTransaction,
  openSnapPayment,
  pollTenantActivation
} from '@/lib/midtrans';
import type { BillingCycle, Package } from '@/types';

export type PaymentFlowStatus =
  | 'idle'
  | 'creating_transaction'
  | 'awaiting_payment'
  | 'verifying'
  | 'active'
  | 'failed';

class SubscriptionStore {
  packages = $state<Package[]>([]);
  loadingPackages = $state(false);
  checkoutLoading = $state(false);
  paymentStatus = $state<PaymentFlowStatus>('idle');
  lastOrderId = $state<string | null>(null);
  errorMessage = $state<string | null>(null);

  /**
   * Mengambil daftar paket langganan aktif dari tabel packages Supabase.
   */
  async fetchPackages(): Promise<void> {
    // Mode demo: paket berasal dari fixture.
    if (isDemoMode()) {
      this.packages = demoStore.packages;
      this.loadingPackages = false;
      return;
    }

    this.loadingPackages = true;
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('[subscriptionStore] Error fetch packages:', error.message);
        return;
      }

      this.packages = (data as Package[]) || [];
    } finally {
      this.loadingPackages = false;
    }
  }

  /**
   * Menjalankan checkout paket: request token -> buka popup Midtrans -> polling aktivasi.
   */
  async checkout(packageId: string, billingCycle: BillingCycle = 'monthly'): Promise<boolean> {
    if (!authStore.tenant?.id) {
      this.errorMessage = 'Data resto tidak ditemukan. Silakan lengkapi pendaftaran.';
      toastState.push(this.errorMessage, 'error');
      return false;
    }

    // Mode demo: bayar selalu berhasil, tanpa membuka Snap maupun webhook.
    if (isDemoMode()) {
      this.checkoutLoading = true;
      this.paymentStatus = 'creating_transaction';
      await new Promise((resolve) => setTimeout(resolve, 900));
      this.lastOrderId = `DEMO-${Date.now()}`;
      this.paymentStatus = 'active';
      this.checkoutLoading = false;
      demoStore.markSubscriptionActive();
      if (authStore.tenant) {
        authStore.tenant.subscription_ends_at = new Date(
          Date.now() + 31 * 86_400_000
        ).toISOString();
        authStore.tenant.trial_ends_at = null;
      }
      toastState.push('Pembayaran berhasil. Paket langganan Anda sudah aktif.', 'success');
      return true;
    }

    this.checkoutLoading = true;
    this.errorMessage = null;
    this.paymentStatus = 'creating_transaction';

    try {
      // 1. Minta snap token ke backend
      const transaction = await createSubscriptionTransaction({
        packageId,
        billingCycle,
        tenantId: authStore.tenant.id
      });

      this.lastOrderId = transaction.order_id;
      this.paymentStatus = 'awaiting_payment';

      // 2. Tampilkan dialog Snap popup
      return new Promise<boolean>((resolve) => {
        openSnapPayment(transaction.token, {
          onSuccess: async () => {
            this.paymentStatus = 'verifying';
            toastState.push('Pembayaran diterima! Memverifikasi aktivasi resto...', 'info');

            // 3. Polling webhook aktivasi
            const isActive = await pollTenantActivation({ maxAttempts: 15, intervalMs: 2000 });
            if (isActive) {
              this.paymentStatus = 'active';
              toastState.push('Selamat! Website resto Anda sekarang telah aktif.', 'success');
              resolve(true);
            } else {
              this.paymentStatus = 'verifying';
              toastState.push(
                'Pembayaran berhasil, sistem sedang menyelesaikan aktivasi. Silakan refresh halaman beberapa saat lagi.',
                'info'
              );
              resolve(true);
            }
          },
          onPending: async () => {
            this.paymentStatus = 'verifying';
            toastState.push('Menunggu penyelesaian pembayaran di Midtrans.', 'info');
            resolve(false);
          },
          onError: () => {
            this.paymentStatus = 'failed';
            this.errorMessage = 'Pembayaran gagal diproses oleh gateway Midtrans.';
            toastState.push(this.errorMessage, 'error');
            resolve(false);
          },
          onClose: () => {
            if (this.paymentStatus === 'awaiting_payment') {
              this.paymentStatus = 'idle';
              toastState.push('Dialog pembayaran ditutup sebelum transaksi selesai.', 'info');
            }
            resolve(false);
          }
        }).catch((err: any) => {
          this.paymentStatus = 'failed';
          const msg = err?.message || 'Gagal membuka antarmuka pembayaran Midtrans.';
          this.errorMessage = msg;
          toastState.push(msg, 'error');
          resolve(false);
        });
      });
    } catch (err: any) {
      console.error('[subscriptionStore] Checkout error:', err);
      const msg = err?.message || 'Terjadi kesalahan saat memproses checkout.';
      this.errorMessage = msg;
      this.paymentStatus = 'failed';
      toastState.push(msg, 'error');
      return false;
    } finally {
      this.checkoutLoading = false;
    }
  }

  reset(): void {
    this.paymentStatus = 'idle';
    this.lastOrderId = null;
    this.errorMessage = null;
    this.checkoutLoading = false;
  }
}

export const subscriptionStore = new SubscriptionStore();
