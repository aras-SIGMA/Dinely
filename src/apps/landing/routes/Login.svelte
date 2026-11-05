<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { homePathForRole } from '@/lib/guards';
  import { router } from '@/lib/router';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import Modal from '@/components/ui/Modal.svelte';

  // Form Fields
  let email = $state('');
  let password = $state('');

  // UI States
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let errorMessage = $state('');
  let isForgotPasswordModalOpen = $state(false);

  // Form Validation
  let isFormValid = $derived(
    email.trim().includes('@') && password.length >= 6
  );

  // Handle Submit Login
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = '';

    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const result = await authStore.signIn({
        email: email.trim(),
        password
      });

      if (result.success) {
        // Ambil target rute sesuai role
        const targetPath = homePathForRole(authStore.role);
        router.navigate(targetPath as `/${string}`);
      } else {
        // Tampilkan pesan error ramah pengguna
        if (result.error?.toLowerCase().includes('invalid login credentials')) {
          errorMessage = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        } else if (result.error?.toLowerCase().includes('failed to fetch')) {
          errorMessage = 'Gagal terhubung ke database (Failed to fetch). Pastikan file .env sudah dibuat dan diisi VITE_SUPABASE_URL serta VITE_SUPABASE_ANON_KEY dari proyek Supabase tim.';
        } else {
          errorMessage = result.error || 'Gagal masuk. Silakan periksa kredensial Anda.';
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan. Silakan coba lagi.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Gagal terhubung ke database (Failed to fetch). Pastikan file .env sudah dibuat dan diisi VITE_SUPABASE_URL serta VITE_SUPABASE_ANON_KEY dari proyek Supabase tim.';
      } else {
        errorMessage = msg;
      }
    } finally {
      isSubmitting = false;
    }
  }

  onMount(() => {
    // Jika sudah login sebelumnya, otomatis redirect ke rute role masing-masing
    if (authStore.isAuthenticated) {
      const targetPath = homePathForRole(authStore.role);
      router.navigate(targetPath as `/${string}`);
    }
  });
</script>

<svelte:head>
  <title>Masuk - RestoLink Platform</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md mx-auto">
    <!-- Brand Header & Navigation Link -->
    <div class="flex items-center justify-between mb-8">
      <a
        href="/"
        class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md py-1 px-1.5"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Kembali ke Beranda</span>
      </a>

      <a href="/" aria-label="RestoLink Beranda">
        <Logo size="sm" />
      </a>
    </div>

    <!-- Main Login Card -->
    <div class="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl shadow-slate-200/50">
      <!-- Title & Headline -->
      <div class="text-center sm:text-left">
        <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
          Pusat Kendali RestoLink
        </span>
        <h1 class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
          Masuk ke Akun Anda
        </h1>
        <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Kelola menu, ketersediaan stok, dan antrean pesanan dapur dalam satu dashboard.
        </p>
      </div>

      <!-- Error Alert Banner -->
      {#if errorMessage}
        <div
          role="alert"
          class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-3"
        >
          <svg class="size-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <p class="font-bold">Gagal Masuk</p>
            <p class="mt-0.5 text-xs text-red-700">{errorMessage}</p>
          </div>
        </div>
      {/if}

      <!-- Form Inputs -->
      <form onsubmit={handleSubmit} class="mt-6 space-y-4" novalidate>
        <!-- 1. Email -->
        <div>
          <label for="email" class="block text-xs font-semibold text-slate-700">
            Email Akun <span class="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autocomplete="email"
            placeholder="nama@email.com"
            bind:value={email}
            class="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
          />
        </div>

        <!-- 2. Kata Sandi -->
        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-xs font-semibold text-slate-700">
              Kata Sandi <span class="text-red-500">*</span>
            </label>
            <button
              type="button"
              class="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              onclick={() => isForgotPasswordModalOpen = true}
            >
              Lupa kata sandi?
            </button>
          </div>

          <div class="mt-1.5 relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autocomplete="current-password"
              placeholder="Masukkan kata sandi"
              bind:value={password}
              class="h-11 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
            />
            <button
              type="button"
              class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              onclick={() => showPassword = !showPassword}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {#if showPassword}
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              {:else}
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- 3. Submit Button -->
        <div class="pt-2">
          <Button
            type="submit"
            size="lg"
            full
            loading={isSubmitting}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
          </Button>
        </div>
      </form>

      <!-- Register Link -->
      <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">
        Belum memiliki website toko?
        <a href="/daftar" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
          Daftar Gratis 30 Hari &rarr;
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Modal Bantuan Lupa Kata Sandi -->
<Modal
  open={isForgotPasswordModalOpen}
  title="Pemulihan Kata Sandi"
  onclose={() => isForgotPasswordModalOpen = false}
>
  <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
    <p>
      Untuk menjaga keamanan data transaksi dan akun usaha kuliner Anda, pemulihan kata sandi dilakukan melalui verifikasi tim operasional RestoLink.
    </p>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 font-mono text-xs text-slate-800">
      <p><strong>Email Layanan:</strong> support@restolink.site</p>
      <p><strong>WhatsApp Bantuan:</strong> +62 812-3456-7890</p>
      <p class="text-[11px] text-slate-500 font-sans mt-2">
        Sertakan nama usaha, alamat email terdaftar, dan nama subdomain toko Anda saat mengirim permintaan pemulihan.
      </p>
    </div>

    <div class="pt-3 flex justify-end">
      <Button size="sm" variant="secondary" onclick={() => isForgotPasswordModalOpen = false}>
        Tutup
      </Button>
    </div>
  </div>
</Modal>
