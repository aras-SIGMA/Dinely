<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { host } from '@/lib/host';
  import { tenantStore } from '@/stores/tenant.svelte';
  import Skeleton from '@/components/ui/Skeleton.svelte';
  import NotFound from './routes/NotFound.svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  onMount(() => {
    if (host.slug && !tenantStore.isReady && !tenantStore.loading && !tenantStore.notFound) {
      tenantStore.fetchTenant(host.slug);
    }
  });

  const pageTitle = $derived(
    tenantStore.businessName
      ? `${tenantStore.businessName} - Menu Digital`
      : 'Menu Digital'
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div
  class="min-h-screen bg-slate-50 text-slate-900 antialiased"
  style="--brand-primary: {tenantStore.primaryColor};"
>
  {#if tenantStore.loading}
    <!-- Skeleton Loading State saat fetch public_tenants -->
    <div class="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <!-- Resto Header Skeleton -->
      <div class="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Skeleton class="size-16 rounded-full sm:size-20" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-7 w-48 sm:h-8 sm:w-64" />
          <Skeleton class="h-4 w-32 sm:w-40" />
        </div>
      </div>

      <!-- Resto Info Bar Skeleton -->
      <div class="mt-6 flex flex-wrap gap-4">
        <Skeleton class="h-5 w-44" />
        <Skeleton class="h-5 w-36" />
      </div>

      <!-- Category Filter Tabs Skeleton -->
      <div class="mt-8 flex gap-2 overflow-x-auto pb-2">
        <Skeleton class="h-10 w-24 shrink-0 rounded-full" />
        <Skeleton class="h-10 w-28 shrink-0 rounded-full" />
        <Skeleton class="h-10 w-24 shrink-0 rounded-full" />
        <Skeleton class="h-10 w-32 shrink-0 rounded-full" />
      </div>

      <!-- Menu Grid Skeleton -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton class="h-32 rounded-xl" />
        <Skeleton class="h-32 rounded-xl" />
        <Skeleton class="h-32 rounded-xl" />
        <Skeleton class="h-32 rounded-xl" />
      </div>
    </div>
  {:else if tenantStore.error}
    <!-- Gangguan Jaringan / Server Toko -->
    <div class="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div class="flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 class="mt-4 text-xl font-bold text-slate-900">Koneksi Sedang Terkendala</h1>
      <p class="mt-2 text-sm text-slate-600">
        Kami mengalami kendala saat menghubungkan ke database toko. Silakan coba muat ulang halaman.
      </p>
      <button
        type="button"
        onclick={() => tenantStore.fetchTenant(host.slug, true)}
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
      >
        Muat Ulang Halaman
      </button>
    </div>
  {:else if tenantStore.notFound}
    <!-- Tenant Tidak Ditemukan atau Non-Aktif -->
    <NotFound />
  {:else}
    <!-- Content Route Tenant -->
    {@render children()}

    <!-- Simple Minimalist Footer -->
    <footer class="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
      <p>
        Ditenagai oleh <span class="font-medium text-slate-600">Dinely</span>
      </p>
    </footer>
  {/if}
</div>
