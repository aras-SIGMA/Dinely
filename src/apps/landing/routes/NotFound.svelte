<script lang="ts">
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';
</script>

<svelte:head>
  <title>404 - Halaman Tidak Ditemukan | RestoLink</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 px-4 py-12 sm:px-6">
  <div class="mx-auto flex w-full max-w-md flex-col items-center justify-center text-center my-auto">
    <a href="/" class="mb-8" aria-label="RestoLink Beranda">
      <Logo size="md" />
    </a>

    <div class="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs sm:size-20">
      <svg class="size-8 sm:size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>

    <span class="mt-6 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      Error 404
    </span>

    <h1 class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
      Halaman Tidak Ditemukan
    </h1>

    <p class="mt-3 max-w-sm text-xs leading-relaxed text-slate-600 sm:text-sm">
      Tautan yang Anda tuju mungkin salah ketik, sudah dipindahkan, atau tidak lagi aktif di platform RestoLink.
    </p>

    <div class="mt-8 flex w-full max-w-xs flex-col gap-3">
      <a href="/" class="w-full">
        <Button size="lg" full>Kembali ke Beranda</Button>
      </a>
      <a href="/fitur" class="w-full">
        <Button size="lg" variant="secondary" full>Lihat Fitur RestoLink</Button>
      </a>
    </div>
  </div>

  <footer class="mt-8 text-center text-xs text-slate-400">
    &copy; 2026 RestoLink Platform. Hak Cipta Dilindungi.
  </footer>
</div>
