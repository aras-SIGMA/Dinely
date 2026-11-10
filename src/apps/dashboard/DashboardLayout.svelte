<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { LOGIN_PATH } from '@/lib/guards';
  import { router } from '@/lib/router';
  import Logo from '@/components/ui/Logo.svelte';
  import Badge from '@/components/ui/Badge.svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  let mobileMenuOpen = $state(false);
  let copiedLink = $state(false);

  const nav = [
    {
      href: '/dashboard',
      label: 'Ringkasan',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      href: '/dashboard/menu',
      label: 'Kategori & Menu',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    {
      href: '/dashboard/pesanan',
      label: 'Antrean Pesanan',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    },
    {
      href: '/dashboard/profil',
      label: 'Profil Usaha',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      href: '/dashboard/langganan',
      label: 'Langganan',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    }
  ];

  let currentPath = $derived(router.route.pathname);
  const tenant = $derived(authStore.tenant);
  const profile = $derived(authStore.profile);

  function isItemActive(itemHref: string, path: string): boolean {
    if (itemHref === '/dashboard') {
      return path === '/dashboard' || path === '/dashboard/';
    }
    return path.startsWith(itemHref);
  }

  const tenantStatusTone = $derived.by(() => {
    switch (tenant?.status) {
      case 'active':
        return 'success' as const;
      case 'trial':
        return 'warning' as const;
      case 'expired':
        return 'danger' as const;
      default:
        return 'neutral' as const;
    }
  });

  const tenantStatusLabel = $derived.by(() => {
    switch (tenant?.status) {
      case 'active':
        return 'Aktif';
      case 'trial':
        return 'Trial';
      case 'pending':
        return 'Menunggu Aktivasi';
      case 'expired':
        return 'Kedaluwarsa';
      default:
        return 'Status Tidak Diketahui';
    }
  });

  const storeUrl = $derived.by(() => {
    if (!tenant?.subdomain) return '';
    if (window.location.hostname.includes('localhost')) {
      return `${window.location.origin}/?tenant=${tenant.subdomain}`;
    }
    return `https://${tenant.subdomain}.restolink.site`;
  });

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

  async function signOut() {
    await authStore.signOut();
    window.location.href = LOGIN_PATH;
  }
</script>

<div class="min-h-screen bg-slate-50">
  <!-- Mobile Top Bar -->
  <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
    <div class="flex items-center gap-3">
      <Logo size="sm" />
      <span class="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Panel Pemilik</span>
    </div>

    <button
      type="button"
      onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
      class="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
      aria-label="Buka navigasi"
      aria-expanded={mobileMenuOpen}
    >
      {#if mobileMenuOpen}
        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      {/if}
    </button>
  </header>

  <!-- Mobile Drawer Backdrop -->
  {#if mobileMenuOpen}
    <div
      role="button"
      tabindex="0"
      class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
      onclick={() => (mobileMenuOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
      aria-label="Tutup navigasi latar"
    ></div>
  {/if}

  <!-- Sidebar (Desktop & Mobile Slide-over) -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:w-64 lg:translate-x-0 {mobileMenuOpen
      ? 'translate-x-0 shadow-xl'
      : '-translate-x-full lg:shadow-none'}"
  >
    <div class="flex flex-1 flex-col overflow-y-auto min-h-0">
      <!-- Header Sidebar -->
      <div class="border-b border-slate-100 p-5">
        <div class="flex items-center justify-between">
          <Logo size="sm" />
          <span class="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
            Pemilik
          </span>
        </div>

        <!-- Tenant Information Card -->
        <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-sm font-bold text-slate-900" title={tenant?.business_name ?? 'RestoLink Usaha'}>
                {tenant?.business_name ?? 'RestoLink Usaha'}
              </h2>
              <p class="truncate text-xs text-slate-500">
                {tenant?.subdomain ? `${tenant.subdomain}.restolink.site` : 'Subdomain belum diatur'}
              </p>
            </div>
            <Badge tone={tenantStatusTone} label={tenantStatusLabel} />
          </div>

          {#if tenant?.subdomain}
            <div class="mt-3 flex items-center gap-2 border-t border-slate-200/80 pt-2.5">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100"
              >
                <span>Lihat Toko</span>
                <svg class="size-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <button
                type="button"
                onclick={copyStoreLink}
                class="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                title="Salin tautan toko"
                aria-label="Salin tautan toko"
              >
                {#if copiedLink}
                  <svg class="size-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="space-y-1 p-3">
        {#each nav as item (item.href)}
          {@const active = isItemActive(item.href, currentPath)}
          <a
            href={item.href}
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors {active
              ? 'bg-brand-50 text-brand-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
          >
            <svg
              class="size-5 shrink-0 {active ? 'text-brand-600' : 'text-slate-400'}"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>

    <!-- User Profile & Sign Out Footer -->
    <div class="shrink-0 border-t border-slate-100 p-3">
      <div class="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5">
        <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-semibold text-white">
          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold text-slate-900">
            {profile?.full_name ?? 'Pemilik Toko'}
          </p>
          <p class="truncate text-[11px] text-slate-500">
            {profile?.phone ?? 'Akun Terverifikasi'}
          </p>
        </div>

        <button
          type="button"
          onclick={signOut}
          class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 focus:outline-hidden"
          title="Keluar dari akun"
          aria-label="Keluar dari akun"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="lg:pl-64">
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {@render children()}
    </main>
  </div>
</div>
