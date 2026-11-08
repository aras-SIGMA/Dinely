<script lang="ts">
  import { host } from '@/lib/host';
  import { tenantStore } from '@/stores/tenant.svelte';

  const slug = $derived(tenantStore.slug ?? host.slug ?? '');

  function goToPlatform() {
    // Arahkan ke domain utama tanpa query tenant
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('tenant');
      url.searchParams.delete('t');
      // Jika di subdomain lokal (contoh: toko.localhost:5173), arahkan ke localhost:5173
      if (url.hostname.includes('.localhost')) {
        url.hostname = 'localhost';
      } else if (url.hostname.endsWith('.restolink.site')) {
        url.hostname = 'restolink.site';
      }
      window.location.href = url.origin + '/';
    }
  }

  function goToRegister() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('tenant');
      url.searchParams.delete('t');
      if (url.hostname.includes('.localhost')) {
        url.hostname = 'localhost';
      } else if (url.hostname.endsWith('.restolink.site')) {
        url.hostname = 'restolink.site';
      }
      window.location.href = url.origin + '/daftar';
    }
  }
</script>

<main class="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
  <div class="flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs sm:size-20">
    <svg class="size-8 sm:size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  </div>

  <span class="mt-6 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
    404 — Usaha Tidak Ditemukan
  </span>

  <h1 class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
    Halaman Usaha Tidak Tersedia
  </h1>

  <p class="mt-3 max-w-md text-sm text-slate-600 sm:text-base">
    {#if slug}
      Alamat website usaha kuliner <code class="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">{slug}</code> belum terdaftar di RestoLink atau status berlangganannya sedang tidak aktif.
    {:else}
      Alamat website usaha kuliner ini belum terdaftar di RestoLink atau status layanannya sedang tidak aktif.
    {/if}
  </p>

  <div class="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full max-w-xs sm:max-w-none">
    <button
      type="button"
      onclick={goToPlatform}
      class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 w-full sm:w-auto"
    >
      Buka Beranda RestoLink
    </button>

    <button
      type="button"
      onclick={goToRegister}
      class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 w-full sm:w-auto"
    >
      Daftarkan Usaha Kuliner
    </button>
  </div>
</main>
