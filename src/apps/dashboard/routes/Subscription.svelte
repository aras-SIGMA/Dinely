<script lang="ts">
  import { onMount } from 'svelte';
  import { subscriptionStore } from '@/stores/subscription.svelte';
  import { authStore } from '@/stores/auth.svelte';

  onMount(() => {
    subscriptionStore.fetchPackages();
    authStore.refreshTenant();
  });
</script>

<main class="mx-auto min-h-screen max-w-5xl px-6 py-10">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900">Langganan & Pembayaran</h1>
    <p class="mt-2 text-sm text-slate-600">
      Status resto:
      <span
        class="inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase {authStore.tenant?.status === 'active'
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800'}"
      >
        {authStore.tenant?.status ?? 'pending'}
      </span>
    </p>
  </div>

  <!-- Dummy test harness untuk pengujian Midtrans Snap sebelum FE slicing selesai -->
  <div class="rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
    <h2 class="text-lg font-semibold text-slate-800">Paket Tersedia (Dummy Test Harness)</h2>
    <p class="mt-1 text-xs text-slate-500">Pilih paket untuk menguji integrasi popup Midtrans Snap.</p>

    {#if subscriptionStore.loadingPackages}
      <div class="py-8 text-center text-sm text-slate-500">Memuat paket...</div>
    {:else if subscriptionStore.packages.length === 0}
      <div class="py-8 text-center text-sm text-slate-500">Belum ada paket aktif di database.</div>
    {:else}
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each subscriptionStore.packages as pkg (pkg.id)}
          <div class="flex flex-col justify-between rounded-lg border border-slate-200 p-5 hover:border-brand-500">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900">{pkg.name}</h3>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-600">{pkg.tier}</span>
              </div>
              <p class="mt-3 text-2xl font-extrabold text-slate-900">
                Rp {Number(pkg.price_monthly).toLocaleString('id-ID')}
                <span class="text-xs font-normal text-slate-500">/bln</span>
              </p>
            </div>

            <button
              type="button"
              disabled={subscriptionStore.checkoutLoading}
              onclick={() => subscriptionStore.checkout(pkg.id, 'monthly')}
              class="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {subscriptionStore.checkoutLoading ? 'Memproses...' : 'Pilih & Bayar'}
            </button>
          </div>
        {/each}
      </div>
    {/if}

    {#if subscriptionStore.lastOrderId}
      <div class="mt-6 rounded-md bg-slate-50 p-4 text-xs text-slate-600">
        Order ID Terakhir: <code class="font-mono font-semibold">{subscriptionStore.lastOrderId}</code> | Status:{' '}
        <span class="font-semibold">{subscriptionStore.paymentStatus}</span>
      </div>
    {/if}
  </div>
</main>
