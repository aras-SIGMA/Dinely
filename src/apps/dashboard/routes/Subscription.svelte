<script lang="ts">
  import { subscriptionStore } from '@/stores/subscription.svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { supabase } from '@/lib/supabase';
  import { toastState } from '@/stores/toast.svelte';
  import { formatRupiah, formatDate } from '@/lib/format';
  import Badge from '@/components/ui/Badge.svelte';
  import type { Transaction } from '@/types';

  interface TransactionItem extends Transaction {
    package?: {
      name: string;
      tier: string;
    } | null;
  }

  let transactions = $state<TransactionItem[]>([]);
  let loadingTransactions = $state(false);
  let refreshingStatus = $state(false);

  const tenant = $derived(authStore.tenant);

  $effect(() => {
    subscriptionStore.fetchPackages();
    const currentTenantId = authStore.tenant?.id;
    if (currentTenantId) {
      fetchTransactions(currentTenantId);
    }
  });

  async function fetchTransactions(tenantId: string) {
    loadingTransactions = true;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, package:packages(name, tier)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      transactions = (data as TransactionItem[]) || [];
    } catch (err: any) {
      console.error('[Subscription] Fetch transactions failed:', err);
    } finally {
      loadingTransactions = false;
    }
  }

  async function handleRefreshStatus() {
    refreshingStatus = true;
    try {
      await authStore.refreshTenant();
      if (tenant?.id) {
        await fetchTransactions(tenant.id);
      }
      toastState.push('Status langganan berhasil diperbarui dari server', 'success');
    } catch {
      toastState.push('Gagal memperbarui status', 'error');
    } finally {
      refreshingStatus = false;
    }
  }

  // Calculate remaining days
  const remainingDays = $derived.by(() => {
    if (!tenant) return null;
    const targetDateStr = tenant.subscription_ends_at || tenant.trial_ends_at;
    if (!targetDateStr) return null;

    const targetDate = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  });

  function getStatusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'warning';
      case 'expired':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  function getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'Aktif Berlangganan';
      case 'trial':
        return 'Masa Uji Coba (Trial)';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'expired':
        return 'Langganan Berakhir';
      default:
        return 'Belum Ditentukan';
    }
  }

  function getTransactionTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'settlement':
      case 'capture':
        return 'success';
      case 'pending':
        return 'warning';
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  function getTransactionLabel(status: string): string {
    switch (status) {
      case 'settlement':
      case 'capture':
        return 'Berhasil';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'deny':
        return 'Ditolak';
      case 'cancel':
        return 'Dibatalkan';
      case 'expire':
        return 'Kedaluwarsa';
      default:
        return status;
    }
  }

  async function handleCheckout(packageId: string) {
    const success = await subscriptionStore.checkout(packageId, 'monthly');
    if (success && tenant?.id) {
      await fetchTransactions(tenant.id);
    }
  }
</script>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Langganan & Tagihan</h1>
      <p class="mt-1 text-sm text-slate-500">
        Kelola paket langganan aktif, perpanjang masa operasional toko, dan pantau riwayat faktur.
      </p>
    </div>

    <!-- Manual Sync Status Button -->
    <button
      type="button"
      onclick={handleRefreshStatus}
      disabled={refreshingStatus}
      class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
    >
      <svg class="size-3.5 text-slate-500 {refreshingStatus ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>{refreshingStatus ? 'Memperbarui...' : 'Cek Status Ulang'}</span>
    </button>
  </div>

  <!-- Subscription Status Summary Hero -->
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-3">
        <div class="flex items-center gap-2.5">
          <Badge tone={getStatusTone(tenant?.status)} label={getStatusLabel(tenant?.status)} />
          <span class="text-xs text-slate-400">|</span>
          <span class="text-xs font-semibold text-slate-700">Paket Mikro MVP</span>
        </div>

        <h2 class="text-xl font-bold text-slate-900 sm:text-2xl">
          {tenant?.business_name ?? 'Restoran Anda'}
        </h2>

        <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
          <div>
            Subdomain: <code class="font-mono font-semibold text-slate-700">{tenant?.subdomain}.restolink.site</code>
          </div>
          {#if tenant?.subscription_ends_at}
            <div>
              Masa Aktif Berakhir: <strong class="font-semibold text-slate-800">{formatDate(tenant.subscription_ends_at)}</strong>
            </div>
          {:else if tenant?.trial_ends_at}
            <div>
              Trial Berakhir: <strong class="font-semibold text-slate-800">{formatDate(tenant.trial_ends_at)}</strong>
            </div>
          {/if}
        </div>
      </div>

      <!-- Days Remaining Callout -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 lg:min-w-[280px]">
        <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          {#if remainingDays !== null}
            <p class="text-xs font-medium text-slate-500">Sisa Masa Operasional</p>
            <p class="text-lg font-extrabold {remainingDays <= 3 ? 'text-red-600' : 'text-slate-900'}">
              {remainingDays > 0 ? `${remainingDays} Hari Lagi` : 'Kedaluwarsa Hari Ini'}
            </p>
          {:else}
            <p class="text-xs font-medium text-slate-500">Masa Langganan</p>
            <p class="text-sm font-bold text-slate-700">Perlu Aktivasi Pertama</p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Available Plans Matrix -->
  <div>
    <div class="border-b border-slate-100 pb-3">
      <h3 class="text-base font-bold text-slate-900">Pilihan Paket Langganan</h3>
      <p class="mt-0.5 text-xs text-slate-500">
        Biaya operasional flat tanpa persentase potongan komisi per pesanan.
      </p>
    </div>

    {#if subscriptionStore.loadingPackages}
      <div class="mt-5 grid gap-5 md:grid-cols-3">
        {#each Array(3) as _}
          <div class="h-80 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
            <div class="h-6 w-1/3 rounded bg-slate-100"></div>
            <div class="mt-4 h-10 w-2/3 rounded bg-slate-100"></div>
            <div class="mt-8 space-y-2">
              <div class="h-4 rounded bg-slate-100"></div>
              <div class="h-4 rounded bg-slate-100"></div>
              <div class="h-4 rounded bg-slate-100"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="mt-5 grid gap-5 md:grid-cols-3">
        <!-- Paket Mikro (Active MVP Plan) -->
        <div class="relative flex flex-col justify-between rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-sm ring-4 ring-brand-500/10">
          <span class="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-2xs">
            Paket Rekomendasi UMKM
          </span>

          <div>
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-bold text-slate-900">Mikro</h4>
              <span class="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Tersedia</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">Solusi lengkap digitalisasi resto dan kedai kuliner.</p>

            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-slate-900">Rp 49.000</span>
              <span class="text-xs font-medium text-slate-500">/ bulan</span>
            </div>

            <!-- Features -->
            <ul class="mt-6 space-y-2.5 text-xs text-slate-600">
              <li class="flex items-start gap-2">
                <svg class="size-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Subdomain Mandiri <code>namatoko.restolink.site</code></span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="size-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Katalog menu & foto kompresi WebP Cloudinary</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="size-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pemesanan tamu (Guest Checkout) langsung</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="size-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Manajemen antrean dapur realtime</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="size-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>0% Komisi</strong> per transaksi pesanan</span>
              </li>
            </ul>
          </div>

          <!-- Checkout Action -->
          <div class="mt-8 border-t border-slate-100 pt-4">
            {#each subscriptionStore.packages as pkg}
              {#if pkg.tier === 'mikro'}
                <button
                  type="button"
                  disabled={subscriptionStore.checkoutLoading}
                  onclick={() => handleCheckout(pkg.id)}
                  class="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {subscriptionStore.checkoutLoading ? 'Membuka Midtrans...' : 'Perpanjang / Bayar Sekarang'}
                </button>
              {/if}
            {/each}
          </div>
        </div>

        <!-- Paket Kecil (Coming Soon) -->
        <div class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 opacity-85">
          <div>
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-bold text-slate-700">Kecil</h4>
              <span class="rounded-lg bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Segera Hadir</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">Untuk resto dengan multi-cabang dan kasir terpisah.</p>

            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-slate-600">Rp 149.000</span>
              <span class="text-xs font-medium text-slate-400">/ bulan</span>
            </div>

            <ul class="mt-6 space-y-2.5 text-xs text-slate-500">
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Seluruh fitur Paket Mikro</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Dukungan hingga 3 cabang resto</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Multi-akun staff kasir</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Laporan ekspor CSV & PDF</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 border-t border-slate-200/80 pt-4">
            <button
              type="button"
              disabled
              class="w-full cursor-not-allowed rounded-xl bg-slate-200 py-2.5 text-xs font-semibold text-slate-500"
            >
              Segera Hadir
            </button>
          </div>
        </div>

        <!-- Paket Menengah (Coming Soon) -->
        <div class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 opacity-85">
          <div>
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-bold text-slate-700">Menengah</h4>
              <span class="rounded-lg bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Segera Hadir</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">Untuk jaringan waralaba kuliner skala enterprise.</p>

            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-slate-600">Rp 299.000</span>
              <span class="text-xs font-medium text-slate-400">/ bulan</span>
            </div>

            <ul class="mt-6 space-y-2.5 text-xs text-slate-500">
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Seluruh fitur Paket Kecil</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Custom domain sendiri (contoh.com)</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Integrasi printer thermal bluetooth</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-slate-400"></span>
                <span>Dukungan prioritas 24/7</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 border-t border-slate-200/80 pt-4">
            <button
              type="button"
              disabled
              class="w-full cursor-not-allowed rounded-xl bg-slate-200 py-2.5 text-xs font-semibold text-slate-500"
            >
              Segera Hadir
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Billing History Table -->
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
    <div class="border-b border-slate-100 pb-4">
      <h3 class="text-base font-bold text-slate-900">Riwayat Pembayaran Langganan</h3>
      <p class="mt-0.5 text-xs text-slate-500">
        Catatan transaksi pembayaran yang diproses melalui payment gateway Midtrans.
      </p>
    </div>

    {#if loadingTransactions}
      <div class="py-8 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
    {:else if transactions.length === 0}
      <div class="py-10 text-center">
        <p class="text-xs text-slate-500">Belum ada riwayat pembayaran langganan.</p>
      </div>
    {:else}
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[540px] text-left text-xs">
          <thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
            <tr>
              <th scope="col" class="py-3 pl-3 pr-4">Order ID</th>
              <th scope="col" class="py-3 px-4">Paket</th>
              <th scope="col" class="py-3 px-4">Tanggal Transaksi</th>
              <th scope="col" class="py-3 px-4">Nominal</th>
              <th scope="col" class="py-3 px-4 text-right pr-3">Status Pembayaran</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each transactions as trx (trx.id)}
              <tr class="hover:bg-slate-50/50">
                <td class="py-3 pl-3 pr-4 font-mono font-medium text-slate-900">
                  {trx.midtrans_order_id}
                </td>
                <td class="py-3 px-4 text-slate-700">
                  {trx.package?.name ?? 'Paket Mikro'}
                </td>
                <td class="py-3 px-4 text-slate-500">
                  {formatDate(trx.created_at)}
                </td>
                <td class="py-3 px-4 font-semibold text-slate-900">
                  {formatRupiah(Number(trx.amount))}
                </td>
                <td class="py-3 px-4 text-right pr-3">
                  <Badge tone={getTransactionTone(trx.status)} label={getTransactionLabel(trx.status)} />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
