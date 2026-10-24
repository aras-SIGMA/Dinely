<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { LOGIN_PATH } from '@/lib/guards';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const nav = [
    { href: '/admin', label: 'Tenant' },
    { href: '/admin/transaksi', label: 'Transaksi' }
  ];

  async function signOut() {
    await authStore.signOut();
    window.location.href = LOGIN_PATH;
  }
</script>

<div class="min-h-screen bg-slate-50 lg:flex">
  <aside class="border-b border-slate-200 bg-slate-900 lg:min-h-screen lg:w-64 lg:border-b-0">
    <div class="px-5 py-4">
      <a href="/admin" class="text-lg font-bold text-white">RestoLink</a>
      <p class="mt-1 text-xs text-slate-400">Admin Platform</p>
    </div>
    <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {#each nav as item (item.href)}
        <a
          href={item.href}
          class="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          {item.label}
        </a>
      {/each}
    </nav>
    <div class="hidden px-3 pb-4 lg:block">
      <button
        type="button"
        onclick={signOut}
        class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800"
      >
        Keluar
      </button>
    </div>
  </aside>
  <div class="flex-1">
    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {@render children()}
    </main>
  </div>
</div>
