<script lang="ts">
  import { authStore } from '@/stores/auth.svelte';
  import { supabase } from '@/lib/supabase';
  import { formatRupiah, formatDate } from '@/lib/format';
  import { ordersStore, getOrderStatusLabel, getOrderStatusTone } from '@/stores/orders.svelte';
  import Badge from '@/components/ui/Badge.svelte';

  let totalMenuItems = $state(0);
  let availableMenuItems = $state(0);
  let totalCategories = $state(0);
  let loadingMetrics = $state(true);
  let copiedLink = $state(false);

  const tenant = $derived(authStore.tenant);
  const profile = $derived(authStore.profile);

  const storeUrl = $derived.by(() => {
    if (!tenant?.subdomain) return '';
    if (window.location.hostname.includes('localhost')) {
      return `${window.location.origin}/?tenant=${tenant.subdomain}`;
    }
    return `https://${tenant.subdomain}.dinely.site`;
  });

  $effect(() => {
    const currentTenantId = authStore.tenant?.id;
    if (!currentTenantId) return;

    fetchMenuMetrics(currentTenantId);
    ordersStore.fetchOrders(currentTenantId);
    ordersStore.startPolling(currentTenantId, 15000);

    return () => {
      ordersStore.stopPolling();
    };
  });

  async function fetchMenuMetrics(tenantId: string) {
    loadingMetrics = true;
    try {
      const [menuRes, catRes] = await Promise.all([
        supabase.from('menu_items').select('id, is_available').eq('tenant_id', tenantId),
        supabase.from('categories').select('id').eq('tenant_id', tenantId)
      ]);

      if (menuRes.data) {
        totalMenuItems = menuRes.data.length;
        availableMenuItems = menuRes.data.filter((m) => m.is_available).length;
      }
      if (catRes.data) {
        totalCategories = catRes.data.length;
      }
    } catch (err) {
      console.error('[Overview] Fetch metrics failed:', err);
    } finally {
      loadingMetrics = false;
    }
  }

  async function copyStoreLink() {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      copiedLink = true;
      setTimeout(() => {
        copiedLink = false;
      }, 2000);
    } catch {
      // Fallback
    }
  }

  const remainingDays = $derived.by(() => {
    if (!tenant) return null;
    const targetDateStr = tenant.subscription_ends_at || tenant.trial_ends_at;
    if (!targetDateStr) return null;
    const targetDate = new Date(targetDateStr).getTime();
    return Math.ceil((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
  });

  const recentOrders = $derived.by(() => {
    return ordersStore.orders.slice(0, 5);
  });
</script>

<div class="space-y-8">
  <!-- Welcome Store Hero Banner -->
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex size-2 rounded-full bg-emerald-500"></span>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dinely Portal Pemilik
          </span>
        </div>

        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Selamat Datang, {profile?.full_name || tenant?.business_name || 'Pemilik Usaha'}
        </h1>

        <p class="text-xs text-slate-500 sm:text-sm">
          Kelola pesanan pelanggan dan operasional <strong>{tenant?.business_name ?? 'restoran Anda'}</strong> secara real-time.
        </p>
      </div>

      <!-- Quick Store Link Box -->
      {#if tenant?.subdomain}
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
          <div class="min-w-0 flex-1 px-1">
            <p class="text-[11px] font-semibold text-slate-500">Website Pemesanan Pelanggan:</p>
            <p class="truncate font-mono text-xs font-bold text-slate-900">
              {tenant.subdomain}.dinely.site
            </p>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onclick={copyStoreLink}
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100"
            >
              {#if copiedLink}
                <svg class="size-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tersalin</span>
              {:else}
                <svg class="size-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Salin Link</span>
              {/if}
            </button>

            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-brand-700"
            >
              <span>Buka</span>
              <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Key Operational Metrics Grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Metric 1: Pesanan Baru -->
    <a
      href="/dashboard/pesanan"
      class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-brand-300 hover:shadow-xs"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Antrean Baru</span>
        <div class="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      </div>
      <p class="mt-3 text-3xl font-extrabold text-slate-900">
        {ordersStore.countsByStatus.baru}
      </p>
      <p class="mt-1 text-xs text-slate-500">Perlu konfirmasi dapur</p>
    </a>

    <!-- Metric 2: Sedang Diproses -->
    <a
      href="/dashboard/pesanan"
      class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-brand-300 hover:shadow-xs"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Sedang Dimasak</span>
        <div class="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <p class="mt-3 text-3xl font-extrabold text-slate-900">
        {ordersStore.countsByStatus.diproses}
      </p>
      <p class="mt-1 text-xs text-slate-500">Sedang disiapkan di dapur</p>
    </a>

    <!-- Metric 3: Menu Aktif -->
    <a
      href="/dashboard/menu"
      class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-brand-300 hover:shadow-xs"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Katalog Menu</span>
        <div class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <p class="mt-3 text-3xl font-extrabold text-slate-900">
        {loadingMetrics ? '-' : availableMenuItems}
        <span class="text-sm font-normal text-slate-500">/ {totalMenuItems}</span>
      </p>
      <p class="mt-1 text-xs text-slate-500">{totalCategories} kategori kuliner</p>
    </a>

    <!-- Metric 4: Masa Langganan -->
    <a
      href="/dashboard/langganan"
      class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-brand-300 hover:shadow-xs"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Masa Langganan</span>
        <div class="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>
      <p class="mt-3 text-2xl font-extrabold text-slate-900">
        {#if remainingDays !== null}
          {remainingDays > 0 ? `${remainingDays} Hari` : 'Hari Ini'}
        {:else}
          Aktif
        {/if}
      </p>
      <p class="mt-1 text-xs text-slate-500">Paket Mikro Rp 49.000</p>
    </a>
  </div>

  <!-- Quick Actions & Recent Orders Grid -->
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Quick Shortcuts Card -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <h3 class="text-base font-bold text-slate-900">Jalan Pintas Cepat</h3>
      <p class="mt-0.5 text-xs text-slate-500">Operasi harian restoran yang sering digunakan.</p>

      <div class="mt-4 space-y-2.5">
        <a
          href="/dashboard/pesanan"
          class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span>Buka Antrean Dapur</span>
          </div>
          <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          href="/dashboard/menu"
          class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Tambah Menu Kuliner Baru</span>
          </div>
          <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          href="/dashboard/profil"
          class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Atur Logo & Kontak Toko</span>
          </div>
          <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>

    <!-- Recent Orders Snapshot (2 columns) -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-2">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Pesanan Masuk Terbaru</h3>
          <p class="mt-0.5 text-xs text-slate-500">Update pesanan pelanggan secara langsung.</p>
        </div>
        <a href="/dashboard/pesanan" class="text-xs font-semibold text-brand-600 hover:underline">
          Lihat Semua Pesanan &rarr;
        </a>
      </div>

      {#if ordersStore.loading && ordersStore.isEmpty}
        <div class="py-12 text-center text-xs text-slate-400">Memuat antrean pesanan...</div>
      {:else if recentOrders.length === 0}
        <div class="py-12 text-center">
          <p class="text-xs text-slate-500">Belum ada pesanan yang masuk hari ini.</p>
        </div>
      {:else}
        <div class="mt-4 divide-y divide-slate-100">
          {#each recentOrders as order (order.id)}
            <div class="flex items-center justify-between py-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-slate-900">
                    {order.order_code}
                  </span>
                  <Badge tone={getOrderStatusTone(order.status)} label={getOrderStatusLabel(order.status)} />
                </div>
                <p class="mt-1 text-xs text-slate-500 truncate">
                  Pemesan: <strong>{order.buyer_name}</strong> &bull; {order.order_items?.length ?? 0} item
                </p>
              </div>

              <div class="text-right pl-4">
                <p class="text-xs font-bold text-slate-900">
                  {formatRupiah(Number(order.total_amount))}
                </p>
                <p class="text-[11px] text-slate-400">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
