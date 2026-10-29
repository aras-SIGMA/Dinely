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
      ? `${tenantStore.businessName} - Menu Digital | RestoLink`
      : 'RestoLink'
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
  {:else if tenantStore.notFound}
    <!-- Tenant Tidak Ditemukan atau Non-Aktif -->
    <NotFound />
  {:else}
    <!-- Content Route Tenant -->
    {@render children()}

    <!-- Simple Footer Platform -->
    <footer class="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
      <p>
        Ditenagai oleh <a href="https://restolink.site" class="font-semibold text-brand-600 hover:underline">RestoLink</a> — Solusi Menu Digital UMKM Kuliner
      </p>
    </footer>
  {/if}
</div>
