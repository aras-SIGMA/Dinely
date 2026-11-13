<script lang="ts">
  /**
   * ============================================================================
   * DINELY - Onboarding Tour Pemilik Baru
   * ============================================================================
   * Tutorial singkat sekali jalan. Status "sudah dilihat" disimpan per akun
   * agar tidak mengganggu saat pemilik kembali di lain hari.
   * ============================================================================
   */
  import { authStore } from '@/stores/auth.svelte';
  import { isDemoMode } from '@/lib/demo/mode';

  type Step = {
    title: string;
    body: string;
    icon: string;
  };

  const STORAGE_PREFIX = 'restolink_onboarding_seen_';

  const steps: Step[] = [
    {
      title: 'Selamat datang di Dinely',
      body: 'Dashboard ini adalah pusat operasional resto Anda: pesanan masuk, menu, profil toko, dan laporan pendapatan.',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      title: 'Atur kategori dan menu',
      body: 'Buka "Kategori & Menu" untuk menambah hidangan, mengunggah foto, dan menandai menu yang sedang habis. Perubahan langsung tampil di website pelanggan.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    {
      title: 'Pantau antrean pesanan',
      body: 'Pesanan pelanggan masuk ke "Antrean Pesanan". Ubah statusnya mengikuti progres dapur: Baru, Diproses, lalu Selesai.',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    {
      title: 'Lihat laporan usaha',
      body: 'Halaman "Laporan & Analitik" merangkum omzet dari pesanan selesai, menu terlaris, dan jam sibuk. Bisa diunduh sebagai CSV untuk pembukuan.',
      icon: 'M3 3v18h18M7 16v-5m5 5V8m5 8v-3'
    },
    {
      title: 'Bagikan website Anda',
      body: 'Tautan toko ada di sidebar. Pelanggan bisa membuka menu dan memesan tanpa perlu membuat akun.',
      icon: 'M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5m3.5-3.5a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.5 1.5'
    }
  ];

  let index = $state(0);
  let open = $state(false);

  function storageKey(): string | null {
    const id = authStore.profile?.id;
    return id ? `${STORAGE_PREFIX}${id}` : null;
  }

  function markSeen(): void {
    const key = storageKey();
    if (!key || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // localStorage diblokir: tutorial akan muncul lagi, tidak fatal.
    }
  }

  const current = $derived(steps[index]);

  $effect(() => {
    if (typeof window === 'undefined') return;
    if (!authStore.profile || isDemoMode()) return;

    const key = storageKey();
    if (!key) return;

    try {
      if (window.localStorage.getItem(key) !== '1') {
        open = true;
      }
    } catch {
      open = false;
    }
  });

  function next(): void {
    if (index < steps.length - 1) {
      index += 1;
      return;
    }
    finish();
  }

  function finish(): void {
    markSeen();
    open = false;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan singkat Dinely"
      class="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d={current.icon} />
          </svg>
        </div>
        <button
          type="button"
          onclick={finish}
          class="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Lewati panduan"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="size-4" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <h2 class="mt-4 text-lg font-bold text-slate-900">{current.title}</h2>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">{current.body}</p>

      <div class="mt-5 flex items-center gap-1.5" aria-hidden="true">
        {#each steps as _, stepIndex (stepIndex)}
          <span
            class="h-1.5 rounded-full transition-all {stepIndex === index
              ? 'w-6 bg-brand-600'
              : 'w-1.5 bg-slate-200'}"
          ></span>
        {/each}
      </div>

      <div class="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onclick={finish}
          class="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Lewati
        </button>

        <div class="flex items-center gap-2">
          {#if index > 0}
            <button
              type="button"
              onclick={() => (index -= 1)}
              class="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
          {/if}
          <button
            type="button"
            onclick={next}
            class="inline-flex min-h-[40px] items-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            {index === steps.length - 1 ? 'Mulai Pakai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
