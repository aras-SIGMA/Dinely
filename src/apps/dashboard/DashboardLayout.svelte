<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { homePathForRole, LOGIN_PATH } from '@/lib/guards';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const nav = [
    { href: '/dashboard', label: 'Ringkasan' },
    { href: '/dashboard/menu', label: 'Kategori & Menu' },
    { href: '/dashboard/pesanan', label: 'Pesanan' },
    { href: '/dashboard/profil', label: 'Profil Usaha' },
    { href: '/dashboard/langganan', label: 'Langganan' }
  ];

  async function signOut() {
    await authStore.signOut();
    window.location.href = LOGIN_PATH;
  }
</script>

<div class="min-h-screen bg-slate-50 lg:flex">
  <aside class="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
    <div class="px-5 py-4">
      <a href={homePathForRole('owner')} class="text-lg font-bold text-brand-600">RestoLink</a>
      <p class="mt-1 text-xs text-slate-500">Dashboard Pemilik</p>
    </div>
    <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {#each nav as item (item.href)}
        <a
          href={item.href}
          class="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {item.label}
        </a>
      {/each}
    </nav>
    <div class="hidden px-3 pb-4 lg:block">
      <button
        type="button"
        onclick={signOut}
        class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
      >
        Keluar
      </button>
    </div>
  </aside>
  <div class="flex-1">
    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {@render children()}
    </main>
  </div>
</div>
