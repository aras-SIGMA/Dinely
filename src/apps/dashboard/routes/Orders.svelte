<script lang="ts">
  import { ordersStore, getOrderStatusLabel, getOrderStatusTone, type StatusFilter } from '@/stores/orders.svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { formatRupiah } from '@/lib/format';
  import Badge from '@/components/ui/Badge.svelte';
  import type { OrderStatus, OrderWithItems } from '@/types';

  const tenantId = $derived(authStore.tenant?.id);

  $effect(() => {
    const currentTenantId = authStore.tenant?.id;
    if (!currentTenantId) return;

    ordersStore.fetchOrders(currentTenantId);
    ordersStore.startPolling(currentTenantId, 15000);

    return () => {
      ordersStore.stopPolling();
    };
  });

  const filterTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Semua Pesanan' },
    { id: 'baru', label: 'Pesanan Baru' },
    { id: 'diproses', label: 'Sedang Diproses' },
    { id: 'selesai', label: 'Selesai' },
    { id: 'dibatalkan', label: 'Dibatalkan' }
  ];

  function openDetail(order: OrderWithItems) {
    ordersStore.selectOrder(order);
  }

  function closeDetail() {
    ordersStore.selectOrder(null);
  }

  function formatCode(code: string): string {
    return code.startsWith('#') ? code : `#${code}`;
  }
</script>

<div class="space-y-6">
  <!-- Header Antrean Pesanan -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Manajemen Pesanan</h1>
      <p class="mt-1 text-sm text-slate-500">
        Kelola antrean dan pantau progres pesanan pelanggan secara real-time (sinkronisasi otomatis 15s).
      </p>
    </div>

    <button
      type="button"
      disabled={ordersStore.loading || !tenantId}
      onclick={() => tenantId && ordersStore.fetchOrders(tenantId)}
      class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
    >
      <svg class="size-4 {ordersStore.loading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>{ordersStore.loading ? 'Memuat...' : 'Muat Ulang'}</span>
    </button>
  </div>

  <!-- Filter Status Tabs -->
  <div class="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
    {#each filterTabs as tab (tab.id)}
      {@const count = ordersStore.countsByStatus[tab.id]}
      <button
        type="button"
        onclick={() => ordersStore.setStatusFilter(tab.id)}
        class="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors {ordersStore.selectedStatus === tab.id
          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
          : 'text-slate-600 hover:bg-slate-100'}"
      >
        <span>{tab.label}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs font-semibold {tab.id === 'baru' && count > 0
            ? 'bg-brand-600 text-white'
            : 'bg-slate-200 text-slate-700'}"
        >
          {count}
        </span>
      </button>
    {/each}
  </div>

  <!-- Daftar Pesanan -->
  <div class="mt-6">
    {#if ordersStore.loading && ordersStore.isEmpty}
      <div class="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p class="text-sm text-slate-500">Memuat data pesanan...</p>
      </div>
    {:else if ordersStore.isFilteredEmpty}
      <div class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <svg class="mx-auto size-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 class="mt-3 text-base font-semibold text-slate-800">Tidak ada pesanan</h3>
        <p class="mt-1 text-xs text-slate-500">
          Belum ada pesanan dengan status "{filterTabs.find((t) => t.id === ordersStore.selectedStatus)?.label}".
        </p>
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each ordersStore.filteredOrders as order (order.id)}
          <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
            <div>
              <!-- Baris Atas: Kode & Status -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <span class="font-mono text-base font-bold text-slate-900">
                  {formatCode(order.order_code)}
                </span>
                <Badge tone={getOrderStatusTone(order.status)} label={getOrderStatusLabel(order.status)} />
              </div>

              <!-- Data Pemesan -->
              <div class="mt-3">
                <h4 class="font-semibold text-slate-800">{order.buyer_name}</h4>
                {#if order.buyer_contact}
                  <p class="text-xs text-slate-500">{order.buyer_contact}</p>
                {/if}
                {#if order.note}
                  <p class="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800 italic">
                    "{order.note}"
                  </p>
                {/if}
              </div>

              <!-- Cuplikan Item -->
              {#if order.order_items && order.order_items.length > 0}
                <div class="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  {#each order.order_items.slice(0, 3) as item (item.id)}
                    <div class="flex justify-between">
                      <span>{item.quantity}x {item.menu_item_name_snapshot}</span>
                      <span class="font-mono text-slate-500">{formatRupiah(Number(item.subtotal))}</span>
                    </div>
                  {/each}
                  {#if order.order_items.length > 3}
                    <p class="text-[11px] text-slate-400">+{order.order_items.length - 3} menu lainnya</p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Footer Card: Total & Aksi Transisi -->
            <div class="mt-5 border-t border-slate-100 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Total Tagihan:</span>
                <span class="font-bold text-slate-900">{formatRupiah(Number(order.total_amount))}</span>
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  onclick={() => openDetail(order)}
                  class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Detail
                </button>

                {#if order.status === 'baru'}
                  <button
                    type="button"
                    disabled={ordersStore.updatingId === order.id}
                    onclick={() => ordersStore.updateStatus(order.id, 'diproses')}
                    class="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    Proses
                  </button>
                  <button
                    type="button"
                    disabled={ordersStore.updatingId === order.id}
                    onclick={() => ordersStore.updateStatus(order.id, 'dibatalkan')}
                    class="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Tolak
                  </button>
                {:else if order.status === 'diproses'}
                  <button
                    type="button"
                    disabled={ordersStore.updatingId === order.id}
                    onclick={() => ordersStore.updateStatus(order.id, 'selesai')}
                    class="flex-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Selesaikan
                  </button>
                  <button
                    type="button"
                    disabled={ordersStore.updatingId === order.id}
                    onclick={() => ordersStore.updateStatus(order.id, 'dibatalkan')}
                    class="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Batal
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Modal Detail Pesanan -->
  {#if ordersStore.selectedOrder}
    {@const sel = ordersStore.selectedOrder}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Rincian Pesanan {formatCode(sel.order_code)}</h3>
            <p class="text-xs text-slate-500">{new Date(sel.created_at).toLocaleString('id-ID')}</p>
          </div>
          <button
            type="button"
            onclick={closeDetail}
            aria-label="Tutup rincian pesanan"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <!-- Pemesan -->
          <div class="rounded-lg bg-slate-50 p-3 text-sm">
            <p class="font-semibold text-slate-800">{sel.buyer_name}</p>
            <p class="text-xs text-slate-600">Kontak: {sel.buyer_contact || '-'}</p>
            {#if sel.note}
              <p class="mt-1 text-xs text-amber-800">Catatan: {sel.note}</p>
            {/if}
          </div>

          <!-- Rincian Item Snapshot -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Menu yang Dipesan</h4>
            <div class="mt-2 divide-y divide-slate-100">
              {#each sel.order_items ?? [] as it (it.id)}
                <div class="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p class="font-medium text-slate-800">{it.menu_item_name_snapshot}</p>
                    <p class="text-xs text-slate-500">{it.quantity} x {formatRupiah(Number(it.price_snapshot))}</p>
                  </div>
                  <span class="font-semibold text-slate-900">{formatRupiah(Number(it.subtotal))}</span>
                </div>
              {/each}
            </div>

            <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span class="font-semibold text-slate-700">Total Pembayaran:</span>
              <span class="text-lg font-bold text-brand-600">{formatRupiah(Number(sel.total_amount))}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            onclick={closeDetail}
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
