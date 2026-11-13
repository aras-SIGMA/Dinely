<script lang="ts">
  /**
   * Tombol masuk ke Mode Demo. Dipakai di halaman masuk dan daftar.
   */
  import { enterDemo } from '@/lib/demo/mode';

  type Props = {
    /** Varian visual mengikuti latar halaman induk. */
    variant?: 'light' | 'brand';
    class?: string;
  };

  let { variant = 'light', class: className = '' }: Props = $props();
</script>

<div class="w-full {className}">
  <div class="flex items-center gap-3">
    <span class="h-px flex-1 bg-slate-200"></span>
    <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">atau</span>
    <span class="h-px flex-1 bg-slate-200"></span>
  </div>

  <button
    type="button"
    onclick={enterDemo}
    class="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition {variant ===
    'brand'
      ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}"
  >
    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>Coba Mode Demo</span>
  </button>

  <p class="mt-2 text-center text-[11px] leading-relaxed {variant === 'brand' ? 'text-white/80' : 'text-slate-400'}">
    Akun contoh tanpa pendaftaran. Data tersimpan lokal di browser Anda.
  </p>
</div>
