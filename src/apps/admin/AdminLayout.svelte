<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { LOGIN_PATH } from '@/lib/guards';
  import { router } from '@/lib/router';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const nav = [
    {
      href: '/admin',
      label: 'Monitoring Tenant',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      href: '/admin/transaksi',
      label: 'Transaksi Midtrans',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    }
  ];

  let currentPath = $derived(router.route.pathname);

  let sidebarOpen = $state(true); // desktop collapse toggle
  let mobileOpen = $state(false); // mobile drawer

  function isItemActive(itemHref: string, path: string): boolean {
    if (itemHref === '/admin') {
      return path === '/admin' || path === '/admin/';
    }
    return path.startsWith(itemHref);
  }

  function initials(name: string | undefined): string {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'A';
  }

  function firstName(name: string | undefined): string {
    if (!name) return 'Admin';
    return name.trim().split(/\s+/)[0];
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeMobile() {
    mobileOpen = false;
  }

  async function signOut() {
    await authStore.signOut();
    window.location.href = LOGIN_PATH;
  }
</script>

<div class="min-h-screen bg-slate-50">
  <!-- ===== Mobile overlay ===== -->
  {#if mobileOpen}
    <button
      type="button"
      class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
      onclick={closeMobile}
      aria-label="Tutup menu navigasi"
    ></button>
  {/if}

  <div class="lg:flex">
    <!-- ===== Sidebar (light, collapsible) ===== -->
    <aside
      class={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarOpen ? 'lg:w-64' : 'lg:w-[68px]'}`}
      aria-label="Navigasi admin"
    >
      <!-- Brand -->
      <div class={`border-b border-slate-100 ${sidebarOpen ? 'px-4' : 'px-2'} py-4`}>
        {#if sidebarOpen}
          <a href="/admin" class="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
            <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-black text-sm text-white">
              R
            </span>
            <span class="truncate">RestoLink</span>
            <span class="ml-auto rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              Admin
            </span>
          </a>
        {:else}
          <a href="/admin" class="flex size-9 items-center justify-center rounded-lg bg-brand-600 font-black text-sm text-white" title="RestoLink Admin">
            R
          </a>
        {/if}
      </div>

      <!-- Nav -->
      <nav class={`flex flex-1 flex-col gap-1 overflow-y-auto p-3 ${sidebarOpen ? '' : 'items-center'}`}>
        {#each nav as item (item.href)}
          {@const active = isItemActive(item.href, currentPath)}
          <a
            href={item.href}
            onclick={closeMobile}
            title={item.label}
            class={`flex items-center rounded-lg text-sm font-medium transition-colors ${
              sidebarOpen ? 'gap-2.5 px-3 py-2' : 'w-10 justify-center p-2.5'
            } ${
              active
                ? 'bg-brand-50 font-semibold text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <svg class="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={item.icon} />
            </svg>
            {#if sidebarOpen}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Footer: collapse hint (desktop) + sign out -->
      <div class={`border-t border-slate-100 p-3 ${sidebarOpen ? '' : 'flex flex-col items-center gap-2'}`}>
        {#if authStore.profile && sidebarOpen}
          <div class="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(authStore.profile.full_name)}
            </span>
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-slate-900">{authStore.profile.full_name}</p>
              <p class="text-[10px] text-slate-500">Platform Admin</p>
            </div>
          </div>
        {/if}
        <button
          type="button"
          onclick={signOut}
          title="Keluar Akun"
          class={`flex items-center rounded-lg text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
            sidebarOpen ? 'w-full gap-2 px-3 py-2' : 'w-10 justify-center p-2.5'
          }`}
        >
          <svg class="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {#if sidebarOpen}
            Keluar Akun
          {/if}
        </button>
      </div>
    </aside>

    <!-- ===== Main column ===== -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Sticky header -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <!-- Mobile trigger -->
        <button
          type="button"
          onclick={() => (mobileOpen = true)}
          class="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <!-- Desktop collapse trigger -->
        <button
          type="button"
          onclick={toggleSidebar}
          class="hidden size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:inline-flex lg:size-9"
          aria-label={sidebarOpen ? 'Ciutkan sidebar' : 'Perluas sidebar'}
        >
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <h1 class="truncate text-base font-semibold text-slate-900 sm:text-lg">
          Panel Superadmin{#if authStore.profile}&nbsp;— Selamat kembali, {firstName(authStore.profile.full_name)}{/if}
        </h1>

        <!-- Avatar (mobile only; desktop shows identity in sidebar) -->
        <div class="ml-auto flex items-center gap-2 lg:hidden">
          <span class="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials(authStore.profile?.full_name)}
          </span>
        </div>
      </header>

      <!-- Content -->
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {@render children()}
      </main>
    </div>
  </div>
</div>
