<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminStore,
    getTransactionStatusLabel,
    getTransactionStatusTone,
    formatDate,
    formatRupiah,
    type TransactionStatusFilter
  } from '@/stores/admin.svelte';
  import { toastState } from '@/stores/toast.svelte';
  import Badge from '@/components/ui/Badge.svelte';
  import Button from '@/components/ui/Button.svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import StatCard from '../components/StatCard.svelte';
  import StatusDistribution from '../components/StatusDistribution.svelte';
  import type { AdminTransactionItem, TransactionStatus } from '@/types';

  let selectedTx = $state<AdminTransactionItem | null>(null);
  let isOverrideModalOpen = $state(false);

  // Form override modal
  let targetStatus = $state<TransactionStatus>('settlement');
  let autoSyncTenant = $state(true);
  let isSaving = $state(false);

  onMount(() => {
    adminStore.fetchTransactions();
    adminStore.startPolling(30000);

    return () => {
      adminStore.stopPolling();
    };
  });

  function openOverrideModal(tx: AdminTransactionItem) {
    selectedTx = tx;
    targetStatus = tx.status;
    autoSyncTenant = true;
    isOverrideModalOpen = true;
  }

  function closeOverrideModal() {
    isOverrideModalOpen = false;
    selectedTx = null;
  }

  async function handleSaveOverride() {
    if (!selectedTx) return;
    isSaving = true;

    try {
      const ok = await adminStore.updateTransactionStatus(
        selectedTx.id,
        targetStatus,
        autoSyncTenant
      );

      if (ok) {
        closeOverrideModal();
      }
    } finally {
      isSaving = false;
    }
  }

  function copyToClipboard(text: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    toastState.push(`Order ID ${text} disalin ke clipboard!`, 'info');
  }

  const statusFilters: { key: TransactionStatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'settlement', label: 'Settlement' },
    { key: 'pending', label: 'Pending' },
    { key: 'expire', label: 'Expire' },
    { key: 'cancel', label: 'Cancel' },
    { key: 'failure', label: 'Failure' }
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Riwayat Transaksi Midtrans</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-500">
        Monitoring transaksi pembayaran paket langganan seluruh tenant dan penanganan kendala webhook.
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        loading={adminStore.loadingTransactions}
        onclick={() => adminStore.fetchTransactions()}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="size-4"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992V7.348m-4.992 0l-3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Segarkan
      </Button>
    </div>
  </div>

  <!-- Metric Stat Cards (shadcn-style) -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <StatCard
      label="Total Transaksi"
      value={adminStore.transactionStats.total}
      tone="neutral"
      iconPath="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z"
      hint="Seluruh riwayat Midtrans"
    />
    <StatCard
      label="Settlement (Sukses)"
      value={adminStore.transactionStats.settlementCount}
      tone="success"
      iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      hint="Pembayaran terverifikasi"
    />
    <StatCard
      label="Menunggu (Pending)"
      value={adminStore.transactionStats.pendingCount}
      tone="warning"
      iconPath="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      hint="Belum terselesaikan"
    />
    <StatCard
      label="Pendapatan Terverifikasi"
      value={adminStore.transactionStats.formattedSettledAmount}
      tone="brand"
      iconPath="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
      hint="Akumulasi nominal settlement"
    />
  </div>

  <div class="grid items-start gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">

  <!-- Filters & Search -->
  <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
    <!-- Filter Tabs -->
    <div class="flex flex-wrap gap-1.5">
      {#each statusFilters as f}
        <button
          type="button"
          onclick={() => (adminStore.transactionStatusFilter = f.key)}
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors {adminStore.transactionStatusFilter === f.key ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
        >
          {f.label}
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="relative w-full sm:w-64">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <input
        type="search"
        placeholder="Cari order ID atau resto..."
        bind:value={adminStore.transactionSearchQuery}
        class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  </div>

  <!-- Data Table -->
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
    {#if adminStore.loadingTransactions && adminStore.transactions.length === 0}
      <div class="flex flex-col items-center justify-center p-12 text-slate-400">
        <div class="size-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
        <p class="mt-3 text-sm">Memuat data transaksi...</p>
      </div>
    {:else if adminStore.filteredTransactions.length === 0}
      <div class="p-12 text-center text-slate-500">
        <svg class="mx-auto size-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p class="mt-2 text-sm font-medium text-slate-700">Tidak ada transaksi ditemukan</p>
        <p class="mt-1 text-xs text-slate-400">
          Coba sesuaikan kata kunci pencarian atau filter status transaksi.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[680px] text-left text-xs text-slate-600">
          <thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase">
            <tr>
              <th scope="col" class="px-4 py-3">Order ID (Midtrans)</th>
              <th scope="col" class="px-4 py-3">Usaha / Subdomain</th>
              <th scope="col" class="px-4 py-3">Paket</th>
              <th scope="col" class="px-4 py-3">Nominal</th>
              <th scope="col" class="px-4 py-3">Status</th>
              <th scope="col" class="px-4 py-3">Waktu</th>
              <th scope="col" class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each adminStore.filteredTransactions as tx (tx.id)}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <!-- Order ID -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-900">
                    <span>{tx.midtrans_order_id}</span>
                    <button
                      type="button"
                      onclick={() => copyToClipboard(tx.midtrans_order_id)}
                      class="text-slate-400 hover:text-slate-700"
                      title="Salin Order ID"
                    >
                      <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12a1.5 1.5 0 0 1 .439 1.061V16.5A1.5 1.5 0 0 1 15.5 18h-7A1.5 1.5 0 0 1 7 16.5v-13Z" />
                        <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h.5v11.5a2.5 2.5 0 0 0 2.5 2.5h6.5v.5A1.5 1.5 0 0 1 14.5 21h-8A1.5 1.5 0 0 1 5 19.5v-13Z" />
                      </svg>
                    </button>
                  </div>
                  {#if tx.midtrans_transaction_id}
                    <p class="font-mono text-[10px] text-slate-400 truncate max-w-44">
                      TX: {tx.midtrans_transaction_id}
                    </p>
                  {/if}
                </td>

                <!-- Usaha / Subdomain -->
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{tx.tenant?.business_name || 'Resto Terhapus'}</p>
                  {#if tx.tenant?.subdomain}
                    <p class="font-mono text-[11px] text-slate-400">{tx.tenant.subdomain}.restolink.site</p>
                  {/if}
                </td>

                <!-- Paket & Billing Cycle -->
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{tx.package?.name || 'Paket Mikro'}</p>
                  <p class="text-[10px] text-slate-400 capitalize">{tx.billing_cycle}</p>
                </td>

                <!-- Nominal -->
                <td class="px-4 py-3 font-semibold text-slate-900">
                  {formatRupiah(Number(tx.amount || 0))}
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <Badge
                    tone={getTransactionStatusTone(tx.status)}
                    label={getTransactionStatusLabel(tx.status)}
                  />
                </td>

                <!-- Waktu -->
                <td class="px-4 py-3">
                  <p class="text-slate-800">{formatDate(tx.created_at)}</p>
                  {#if tx.settled_at}
                    <p class="text-[10px] text-emerald-600">Settled: {formatDate(tx.settled_at)}</p>
                  {/if}
                </td>

                <!-- Aksi -->
                <td class="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={adminStore.updatingTransactionId === tx.id}
                    onclick={() => openOverrideModal(tx)}
                  >
                    Override
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    </div>
  </div>

    <!-- Chart distribusi status transaksi (data store existing) -->
    <StatusDistribution
      title="Distribusi Status Transaksi"
      description="Proporsi seluruh transaksi Midtrans berdasarkan status"
      emptyLabel="Belum ada transaksi tercatat"
      items={[
        { label: 'Settlement (Berhasil)', count: adminStore.transactionStats.settlementCount, color: 'bg-green-500' },
        { label: 'Pending (Menunggu)', count: adminStore.transactionStats.pendingCount, color: 'bg-amber-500' },
        { label: 'Gagal / Kedaluwarsa', count: adminStore.transactionStats.failedCount, color: 'bg-red-500' }
      ]}
    />
  </div>
</div>

<!-- Modal Manual Override Status Transaksi -->
<Modal
  bind:open={isOverrideModalOpen}
  title="Manual Override Transaksi Midtrans"
  description="Gunakan fitur ini jika pembayaran berhasil di Midtrans tapi webhook gagal terkirim (idempotency override)."
  onclose={closeOverrideModal}
>
  {#if selectedTx}
    <div class="space-y-4">
      <!-- Info Ringkas Transaksi -->
      <div class="rounded-lg bg-slate-50 p-3 border border-slate-200">
        <p class="text-xs font-mono font-semibold text-slate-900">Order ID: {selectedTx.midtrans_order_id}</p>
        <p class="text-xs text-slate-600 mt-1">
          Usaha: <span class="font-medium text-slate-900">{selectedTx.tenant?.business_name || '-'}</span>
        </p>
        <p class="text-xs text-slate-600">
          Nominal: <span class="font-semibold text-slate-900">{formatRupiah(Number(selectedTx.amount || 0))}</span>
        </p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-[11px] text-slate-500">Status Saat Ini:</span>
          <Badge
            tone={getTransactionStatusTone(selectedTx.status)}
            label={getTransactionStatusLabel(selectedTx.status)}
          />
        </div>
      </div>

      <!-- Pilih Target Status Baru -->
      <div>
        <label for="txTargetStatus" class="block text-xs font-semibold text-slate-700">
          Ubah Status Transaksi Menjadi <span class="text-red-500">*</span>
        </label>
        <select
          id="txTargetStatus"
          bind:value={targetStatus}
          class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="settlement">settlement (Pembayaran Berhasil / Sah)</option>
          <option value="pending">pending (Menunggu Pembayaran)</option>
          <option value="expire">expire (Waktu Pembayaran Habis)</option>
          <option value="cancel">cancel (Dibatalkan)</option>
          <option value="deny">deny (Ditolak Fraud System)</option>
          <option value="failure">failure (Gagal Sistem)</option>
        </select>
      </div>

      <!-- Toggle Auto-Sync Aktivasi Tenant -->
      {#if targetStatus === 'settlement'}
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={autoSyncTenant}
              class="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <p class="text-xs font-semibold text-slate-800">Otomatis Aktifkan Tenant (+30 Hari Langganan)</p>
              <p class="text-[11px] text-slate-500">
                Jika dicentang, status tenant akan otomatis diubah ke 'active' dan masa aktif langganan ditambah 30 hari ke depan.
              </p>
            </div>
          </label>
        </div>
      {/if}
    </div>
  {/if}

  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={closeOverrideModal}>Batal</Button>
    <Button
      variant="primary"
      size="sm"
      loading={isSaving}
      onclick={handleSaveOverride}
    >
      Simpan Perubahan
    </Button>
  {/snippet}
</Modal>
