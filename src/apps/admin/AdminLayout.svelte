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

  function isItemActive(itemHref: string, path: string): boolean {
    if (itemHref === '/admin') {
      return path === '/admin' || path === '/admin/';
    }
    return path.startsWith(itemHref);
  }

  async function signOut() {
    await authStore.signOut();
    window.location.href = LOGIN_PATH;
  }
</script>

<div class="min-h-screen bg-slate-50 lg:flex">
  <!-- Sidebar -->
  <aside class="border-b border-slate-200 bg-slate-900 text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:flex lg:flex-col lg:justify-between">
    <div>
      <!-- Brand & Admin Badge -->
      <div class="px-5 py-4 border-b border-slate-800">
        <div class="flex items-center justify-between">
          <a href="/admin" class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span class="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white font-black text-sm">
              R
            </span>
            RestoLink
          </a>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-400 border border-brand-500/30">
              Admin
            </span>
            <button
              type="button"
              onclick={signOut}
              class="lg:hidden inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-rose-400 transition"
              title="Keluar Akun"
              aria-label="Keluar dari akun admin"
            >
              <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
        {#if authStore.profile}
          <p class="mt-2 text-xs text-slate-400 truncate">
            {authStore.profile.full_name}
          </p>
        {/if}
      </div>

      <!-- Navigation Links -->
      <nav class="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {#each nav as item (item.href)}
          {@const active = isItemActive(item.href, currentPath)}
          <a
            href={item.href}
            class="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors {active ? 'bg-brand-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}"
            aria-current={active ? 'page' : undefined}
          >
            <svg class="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
            </svg>
            {item.label}
          </a>
        {/each}
      </nav>
    </div>

    <!-- Sign out button in sidebar footer -->
    <div class="hidden border-t border-slate-800 p-3 lg:block">
      <button
        type="button"
        onclick={signOut}
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Keluar Akun
      </button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1">
    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {@render children()}
    </main>
  </div>
</div>
