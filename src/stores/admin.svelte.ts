/**
 * ============================================================================
 * RESTOLINK - Platform Admin Store (FS-14 / Milestone 8)
 * ============================================================================
 * Mengelola data lintas-tenant, riwayat transaksi Midtrans platform,
 * filter & pencarian, serta aksi manual override status untuk role platform_admin.
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import { toastState } from '@/stores/toast.svelte';
import { formatRupiah, formatDate } from '@/lib/format';
import type {
  AdminTenantItem,
  AdminTransactionItem,
  Package,
  TenantStatus,
  TransactionStatus
} from '@/types';

export { formatRupiah, formatDate };

export type TenantStatusFilter = TenantStatus | 'all';
export type TransactionStatusFilter = TransactionStatus | 'all';

export function getTenantStatusLabel(status: TenantStatus): string {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'trial':
      return 'Masa Percobaan';
    case 'pending':
      return 'Menunggu Pembayaran';
    case 'suspended':
      return 'Ditangguhkan';
    case 'expired':
      return 'Kedaluwarsa';
    default:
      return status;
  }
}

export function getTenantStatusTone(
  status: TenantStatus
): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' {
  switch (status) {
    case 'active':
      return 'success';
    case 'trial':
      return 'brand';
    case 'pending':
      return 'warning';
    case 'suspended':
    case 'expired':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case 'settlement':
    case 'capture':
      return 'Berhasil (Settlement)';
    case 'pending':
      return 'Menunggu';
    case 'expire':
      return 'Kedaluwarsa';
    case 'cancel':
      return 'Dibatalkan';
    case 'deny':
    case 'failure':
      return 'Gagal';
    default:
      return status;
  }
}

export function getTransactionStatusTone(
  status: TransactionStatus
): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' {
  switch (status) {
    case 'settlement':
    case 'capture':
      return 'success';
    case 'pending':
      return 'warning';
    case 'expire':
      return 'neutral';
    case 'cancel':
    case 'deny':
    case 'failure':
      return 'danger';
    default:
      return 'neutral';
  }
}

class AdminStore {
  tenants = $state<AdminTenantItem[]>([]);
  transactions = $state<AdminTransactionItem[]>([]);
  packages = $state<Package[]>([]);

  loadingTenants = $state(false);
  loadingTransactions = $state(false);
  updatingTenantId = $state<string | null>(null);
  updatingTransactionId = $state<string | null>(null);

  tenantStatusFilter = $state<TenantStatusFilter>('all');
  tenantSearchQuery = $state('');

  transactionStatusFilter = $state<TransactionStatusFilter>('all');
  transactionSearchQuery = $state('');

  errorMessage = $state<string | null>(null);

  #pollTimer: any = null;

  // --------------------------------------------------------------------------
  // DERIVED GETTERS - TENANTS
  // --------------------------------------------------------------------------
  get filteredTenants(): AdminTenantItem[] {
    const q = this.tenantSearchQuery.trim().toLowerCase();
    const filter = this.tenantStatusFilter;

    return this.tenants.filter((item) => {
      const matchStatus = filter === 'all' || item.status === filter;
      if (!matchStatus) return false;

      if (!q) return true;

      const businessMatch = item.business_name?.toLowerCase().includes(q) ?? false;
      const subdomainMatch = item.subdomain?.toLowerCase().includes(q) ?? false;
      const ownerNameMatch = item.owner?.full_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = item.contact_phone?.includes(q) || item.owner?.phone?.includes(q);

      return businessMatch || subdomainMatch || ownerNameMatch || Boolean(phoneMatch);
    });
  }

  get tenantCounts(): Record<TenantStatusFilter, number> {
    const counts: Record<TenantStatusFilter, number> = {
      all: this.tenants.length,
      active: 0,
      trial: 0,
      pending: 0,
      suspended: 0,
      expired: 0
    };

    for (const t of this.tenants) {
      if (t.status in counts) {
        counts[t.status]++;
      }
    }

    return counts;
  }

  // --------------------------------------------------------------------------
  // DERIVED GETTERS - TRANSACTIONS
  // --------------------------------------------------------------------------
  get filteredTransactions(): AdminTransactionItem[] {
    const q = this.transactionSearchQuery.trim().toLowerCase();
    const filter = this.transactionStatusFilter;

    return this.transactions.filter((item) => {
      const matchStatus = filter === 'all' || item.status === filter;
      if (!matchStatus) return false;

      if (!q) return true;

      const orderIdMatch = item.midtrans_order_id?.toLowerCase().includes(q) ?? false;
      const tenantMatch = item.tenant?.business_name?.toLowerCase().includes(q) ?? false;
      const subdomainMatch = item.tenant?.subdomain?.toLowerCase().includes(q) ?? false;

      return orderIdMatch || tenantMatch || subdomainMatch;
    });
  }

  get transactionStats() {
    let settlementCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let totalSettledAmount = 0;

    for (const tx of this.transactions) {
      if (tx.status === 'settlement' || tx.status === 'capture') {
        settlementCount++;
        totalSettledAmount += Number(tx.amount || 0);
      } else if (tx.status === 'pending') {
        pendingCount++;
      } else {
        failedCount++;
      }
    }

    return {
      total: this.transactions.length,
      settlementCount,
      pendingCount,
      failedCount,
      totalSettledAmount,
      formattedSettledAmount: formatRupiah(totalSettledAmount)
    };
  }

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------
  async fetchTenants(silent = false): Promise<void> {
    if (!silent) this.loadingTenants = true;
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          owner_id,
          business_name,
          subdomain,
          logo_url,
          description,
          contact_phone,
          contact_whatsapp,
          address,
          primary_color,
          status,
          current_package_id,
          trial_ends_at,
          subscription_ends_at,
          created_at,
          updated_at,
          owner:profiles!tenants_owner_id_fkey(id, full_name, phone),
          package:packages!tenants_current_package_id_fkey(id, name, tier)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[adminStore] Fetch tenants failed:', error.message);
        this.errorMessage = error.message;
        if (!silent) toastState.push('Gagal memuat daftar tenant.', 'error');
        return;
      }

      this.tenants = (data as unknown as AdminTenantItem[]) || [];
      this.errorMessage = null;
    } catch (err: any) {
      console.error('[adminStore] Exception in fetchTenants:', err);
      this.errorMessage = err?.message || 'Terjadi kesalahan sistem.';
    } finally {
      if (!silent) this.loadingTenants = false;
    }
  }

  async fetchTransactions(silent = false): Promise<void> {
    if (!silent) this.loadingTransactions = true;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          tenant_id,
          package_id,
          billing_cycle,
          amount,
          midtrans_order_id,
          midtrans_transaction_id,
          status,
          settled_at,
          created_at,
          tenant:tenants!transactions_tenant_id_fkey(id, business_name, subdomain),
          package:packages!transactions_package_id_fkey(id, name, tier)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[adminStore] Fetch transactions failed:', error.message);
        if (!silent) toastState.push('Gagal memuat riwayat transaksi.', 'error');
        return;
      }

      this.transactions = (data as unknown as AdminTransactionItem[]) || [];
    } catch (err: any) {
      console.error('[adminStore] Exception in fetchTransactions:', err);
    } finally {
      if (!silent) this.loadingTransactions = false;
    }
  }

  async fetchPackages(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (!error && data) {
        this.packages = data as Package[];
      }
    } catch (err) {
      console.error('[adminStore] Exception in fetchPackages:', err);
    }
  }

  // --------------------------------------------------------------------------
  // ACTIONS / OVERRIDE
  // --------------------------------------------------------------------------
  /**
   * Manual override status tenant oleh platform_admin.
   * Mendukung penambahan masa aktif langganan secara kustom dan pencatatan audit log.
   */
  async updateTenantStatus(
    tenantId: string,
    nextStatus: TenantStatus,
    options?: {
      extendDays?: number;
      packageId?: string | null;
      reason?: string;
      silentToast?: boolean;
    }
  ): Promise<boolean> {
    this.updatingTenantId = tenantId;
    try {
      const currentTenant = this.tenants.find((t) => t.id === tenantId);
      const oldStatus = currentTenant?.status || 'unknown';

      const updatePayload: Record<string, any> = {
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      if (options?.packageId) {
        updatePayload.current_package_id = options.packageId;
      }

      if (options?.extendDays && options.extendDays > 0) {
        const days = options.extendDays;
        const baseDate = new Date();
        const targetExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

        if (nextStatus === 'trial') {
          updatePayload.trial_ends_at = targetExpiry.toISOString();
        } else if (nextStatus === 'active') {
          updatePayload.subscription_ends_at = targetExpiry.toISOString();
        }
      }

      const { error } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('id', tenantId);

      if (error) {
        console.error('[adminStore] Override tenant status failed:', error.message);
        toastState.push(`Gagal memperbarui status tenant: ${error.message}`, 'error');
        return false;
      }

      // Catat ke audit trail log
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: authData.user.id,
            action: 'override_tenant_status',
            target_entity: 'tenants',
            target_id: tenantId,
            details: {
              old_status: oldStatus,
              new_status: nextStatus,
              reason: options?.reason || 'Manual override oleh platform admin',
              extend_days: options?.extendDays,
              package_id: options?.packageId
            }
          });
        }
      } catch (auditErr) {
        console.warn('[adminStore] Gagal mencatat audit log:', auditErr);
      }

      // Optimistic update lokal
      const idx = this.tenants.findIndex((t) => t.id === tenantId);
      if (idx !== -1) {
        this.tenants[idx] = {
          ...this.tenants[idx],
          ...updatePayload
        };
      }

      if (!options?.silentToast) {
        toastState.push(
          `Status tenant berhasil diubah menjadi "${getTenantStatusLabel(nextStatus)}".`,
          'success'
        );
      }
      return true;
    } catch (err: any) {
      console.error('[adminStore] Exception in updateTenantStatus:', err);
      toastState.push('Koneksi terganggu saat memperbarui tenant.', 'error');
      return false;
    } finally {
      this.updatingTenantId = null;
    }
  }

  /**
   * Manual override status transaksi Midtrans (misal: jika webhook Midtrans macet)
   */
  async updateTransactionStatus(
    transactionId: string,
    nextStatus: TransactionStatus,
    syncTenant = true
  ): Promise<boolean> {
    this.updatingTransactionId = transactionId;
    try {
      const tx = this.transactions.find((t) => t.id === transactionId);
      const oldStatus = tx?.status || 'unknown';
      const isSettlement = nextStatus === 'settlement' || nextStatus === 'capture';

      const updatePayload: Record<string, any> = {
        status: nextStatus,
        settled_at: isSettlement ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', transactionId);

      if (error) {
        console.error('[adminStore] Override transaction failed:', error.message);
        toastState.push(`Gagal memperbarui transaksi: ${error.message}`, 'error');
        return false;
      }

      // Catat ke audit trail log
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: authData.user.id,
            action: 'override_transaction_status',
            target_entity: 'transactions',
            target_id: transactionId,
            details: {
              old_status: oldStatus,
              new_status: nextStatus,
              sync_tenant: syncTenant,
              order_id: tx?.midtrans_order_id
            }
          });
        }
      } catch (auditErr) {
        console.warn('[adminStore] Gagal mencatat audit log transaksi:', auditErr);
      }

      // Update transaksi lokal
      if (tx) {
        tx.status = nextStatus;
        tx.settled_at = updatePayload.settled_at;
      }

      // Sinkronisasi status tenant menjadi aktif (+30 hari) bila diminta
      if (syncTenant && tx?.tenant_id && isSettlement) {
        await this.updateTenantStatus(tx.tenant_id, 'active', {
          extendDays: 30,
          packageId: tx.package_id,
          reason: `Auto-sync aktivasi dari override settlement transaksi ${tx.midtrans_order_id}`,
          silentToast: true
        });
      }

      toastState.push(
        `Transaksi ${tx?.midtrans_order_id ?? ''} berhasil diubah ke "${getTransactionStatusLabel(nextStatus)}"${syncTenant && isSettlement ? ' & tenant diaktifkan.' : '.'}`,
        'success'
      );
      return true;
    } catch (err: any) {
      console.error('[adminStore] Exception in updateTransactionStatus:', err);
      toastState.push('Koneksi terganggu saat memperbarui transaksi.', 'error');
      return false;
    } finally {
      this.updatingTransactionId = null;
    }
  }

  startPolling(intervalMs = 30000): void {
    this.stopPolling();
    this.#pollTimer = setInterval(() => {
      this.fetchTenants(true);
      this.fetchTransactions(true);
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.#pollTimer) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
  }
}

export const adminStore = new AdminStore();
