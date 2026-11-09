<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import {
    slugify,
    checkSubdomainAvailability,
    validateSubdomainFormat
  } from '@/lib/subdomain-validator';
  import { router } from '@/lib/router';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';

  // Form Fields
  let fullName = $state('');
  let phone = $state('');
  let businessName = $state('');
  let subdomain = $state('');
  let email = $state('');
  let password = $state('');

  // UI States
  let currentStep = $state<'form' | 'otp'>('form');
  let registeredEmail = $state('');
  let otpCode = $state('');
  let otpError = $state('');
  let isVerifyingOtp = $state(false);
  let isResendingOtp = $state(false);
  let resendCountdown = $state(0);
  let resendNotice = $state('');
  let resendInterval: ReturnType<typeof setInterval> | null = null;

  let isSubdomainManuallyEdited = $state(false);
  let showPassword = $state(false);
  let isCheckingSubdomain = $state(false);
  let subdomainStatus = $state<'idle' | 'valid' | 'invalid'>('idle');
  let subdomainErrorMessage = $state('');
  let isSubmitting = $state(false);
  let formError = $state('');
  let successNotice = $state('');

  // Debounce Timer Reference
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  function startResendTimer(seconds = 60) {
    if (resendInterval) clearInterval(resendInterval);
    resendCountdown = seconds;
    resendInterval = setInterval(() => {
      resendCountdown -= 1;
      if (resendCountdown <= 0) {
        if (resendInterval) clearInterval(resendInterval);
        resendInterval = null;
      }
    }, 1000);
  }

  async function handleVerifyOtp(e: SubmitEvent) {
    e.preventDefault();
    otpError = '';
    const cleanToken = otpCode.trim().replace(/\D/g, '');

    if (cleanToken.length < 6 || cleanToken.length > 8 || isVerifyingOtp) {
      otpError = 'Harap masukkan 6 sampai 8 digit kode angka verifikasi.';
      return;
    }

    isVerifyingOtp = true;

    try {
      const result = await authStore.verifyEmailOtp(registeredEmail, cleanToken);
      if (result.success) {
        router.navigate('/dashboard');
      } else {
        if (result.error?.toLowerCase().includes('token has expired') || result.error?.toLowerCase().includes('expired')) {
          otpError = 'Kode verifikasi sudah kedaluwarsa. Silakan klik tombol kirim ulang kode.';
        } else if (result.error?.toLowerCase().includes('invalid')) {
          otpError = 'Kode verifikasi tidak cocok. Silakan periksa kembali email Anda.';
        } else {
          otpError = result.error || 'Verifikasi gagal. Pastikan kode yang dimasukkan benar.';
        }
      }
    } catch (err: unknown) {
      otpError = err instanceof Error ? err.message : 'Terjadi kendala saat memverifikasi kode.';
    } finally {
      isVerifyingOtp = false;
    }
  }

  async function handleResendOtp() {
    if (resendCountdown > 0 || isResendingOtp || !registeredEmail) return;

    isResendingOtp = true;
    resendNotice = '';
    otpError = '';

    try {
      const result = await authStore.resendOtp(registeredEmail);
      if (result.success) {
        resendNotice = 'Kode verifikasi baru berhasil dikirim ke Gmail Anda.';
        startResendTimer(60);
      } else {
        otpError = result.error || 'Gagal mengirim ulang kode. Silakan coba sesaat lagi.';
      }
    } catch (err: unknown) {
      otpError = err instanceof Error ? err.message : 'Koneksi bermasalah saat meminta kode baru.';
    } finally {
      isResendingOtp = false;
    }
  }

  // Auto-slugify Subdomain when Business Name changes (if not manually edited)
  function handleBusinessNameInput(e: Event) {
    const target = e.target as HTMLInputElement;
    businessName = target.value;

    if (!isSubdomainManuallyEdited) {
      const generatedSlug = slugify(businessName);
      subdomain = generatedSlug;
      triggerSubdomainCheck(generatedSlug);
    }
  }

  // Handle Manual Subdomain Edit
  function handleSubdomainInput(e: Event) {
    const target = e.target as HTMLInputElement;
    isSubdomainManuallyEdited = true;
    const cleaned = target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    subdomain = cleaned;
    triggerSubdomainCheck(cleaned);
  }

  // Trigger Debounced Subdomain Availability Check (350ms)
  function triggerSubdomainCheck(slug: string) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!slug) {
      subdomainStatus = 'idle';
      subdomainErrorMessage = '';
      isCheckingSubdomain = false;
      return;
    }

    // Client-side quick syntax validation first
    const clientCheck = validateSubdomainFormat(slug);
    if (!clientCheck.valid) {
      subdomainStatus = 'invalid';
      subdomainErrorMessage = clientCheck.error || 'Format subdomain tidak valid.';
      isCheckingSubdomain = false;
      return;
    }

    // Set loading indicator
    isCheckingSubdomain = true;
    subdomainStatus = 'idle';
    subdomainErrorMessage = '';

    debounceTimeout = setTimeout(async () => {
      try {
        const result = await checkSubdomainAvailability(slug);
        if (result.available) {
          subdomainStatus = 'valid';
          subdomainErrorMessage = '';
        } else {
          subdomainStatus = 'invalid';
          subdomainErrorMessage = result.error || 'Subdomain ini sudah digunakan.';
        }
      } catch (err) {
        subdomainStatus = 'invalid';
        subdomainErrorMessage = 'Gagal memeriksa ketersediaan subdomain.';
      } finally {
        isCheckingSubdomain = false;
      }
    }, 350);
  }

  // Form Validation Derived State
  let isFormValid = $derived(
    fullName.trim().length >= 2 &&
    phone.trim().length >= 8 &&
    businessName.trim().length >= 2 &&
    subdomain.trim().length >= 3 &&
    subdomainStatus === 'valid' &&
    email.trim().includes('@') &&
    password.length >= 8
  );

  // Handle Submit Registration
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    formError = '';
    successNotice = '';

    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const result = await authStore.signUp({
        fullName: fullName.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        email: email.trim(),
        password
      });

      if (result.success) {
        if (result.session) {
          // Auto-login session tersedia -> langsung arahkan ke dashboard
          router.navigate('/dashboard');
        } else {
          // Butuh konfirmasi email OTP 6-digit
          registeredEmail = email.trim();
          currentStep = 'otp';
          startResendTimer(60);
        }
      } else {
        if (result.error?.toLowerCase().includes('failed to fetch')) {
          formError = 'Gagal terhubung ke database (Failed to fetch). Pastikan file .env sudah dibuat dan diisi VITE_SUPABASE_URL serta VITE_SUPABASE_ANON_KEY.';
        } else {
          formError = result.error || 'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.';
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi bermasalah. Silakan periksa internet Anda.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        formError = 'Gagal terhubung ke database (Failed to fetch). Pastikan file .env sudah dibuat dan diisi VITE_SUPABASE_URL serta VITE_SUPABASE_ANON_KEY.';
      } else {
        formError = msg;
      }
    } finally {
      isSubmitting = false;
    }
  }

  onMount(() => {
    // Jika sudah login, redirect sesuai role
    if (authStore.isAuthenticated) {
      if (authStore.isOwner) {
        router.navigate('/dashboard');
      } else if (authStore.isPlatformAdmin) {
        router.navigate('/admin');
      }
    }

    return () => {
      if (resendInterval) clearInterval(resendInterval);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  });
</script>

<svelte:head>
  <title>Daftar Akun RestoLink - Website Menu Digital Mandiri</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-xl mx-auto">
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

    {#if currentStep === 'otp'}
      <!-- OTP Step Card: Verifikasi Kode Email Gmail OTP -->
      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl shadow-slate-200/50">
        <div class="text-center sm:text-left">
          <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200/80">
            Langkah 2 dari 2: Verifikasi Email
          </span>
          <h1 class="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Verifikasi Kode Akun Toko
          </h1>
          <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kami telah mengirimkan kode OTP ke alamat Gmail <strong class="text-slate-900 font-semibold">{registeredEmail}</strong>. Masukkan kode di bawah untuk mengaktifkan toko Anda.
          </p>
        </div>

        <!-- Alert Banners for OTP -->
        {#if otpError}
          <div
            role="alert"
            class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-3"
          >
            <svg class="size-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <p class="font-bold">Verifikasi Gagal</p>
              <p class="mt-0.5 text-xs text-red-700">{otpError}</p>
            </div>
          </div>
        {/if}

        {#if resendNotice}
          <div
            role="status"
            class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-start gap-3"
          >
            <svg class="size-5 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="font-bold">Kode Terkirim</p>
              <p class="mt-0.5 text-xs text-emerald-700">{resendNotice}</p>
            </div>
          </div>
        {/if}

        <!-- OTP Form -->
        <form onsubmit={handleVerifyOtp} class="mt-6 space-y-5" novalidate>
          <div>
            <label for="otpCode" class="block text-xs font-semibold text-slate-700 mb-2 text-center sm:text-left">
              Kode OTP <span class="text-red-500">*</span>
            </label>
            <input
              id="otpCode"
              name="otpCode"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="8"
              autocomplete="one-time-code"
              placeholder="000000"
              value={otpCode}
              oninput={(e) => {
                const target = e.target as HTMLInputElement;
                otpCode = target.value.replace(/\D/g, '').slice(0, 8);
              }}
              class="h-14 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 text-center font-mono text-2xl sm:text-3xl font-extrabold tracking-[0.4em] sm:tracking-[0.6em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:bg-white focus-visible:border-transparent transition-all"
            />
            <p class="mt-2 text-center text-[11px] text-slate-500">
              Periksa kotak masuk (Inbox) atau folder Spam pada Gmail Anda.
            </p>
          </div>

          <div class="pt-2">
            <Button
              type="submit"
              size="lg"
              full
              loading={isVerifyingOtp}
              disabled={isVerifyingOtp || otpCode.trim().length < 6 || otpCode.trim().length > 8}
            >
              {isVerifyingOtp ? 'Memverifikasi Kode...' : 'Verifikasi & Aktifkan Toko'}
            </Button>
          </div>
        </form>

        <!-- Resend & Back actions -->
        <div class="mt-6 border-t border-slate-100 pt-5 space-y-3 text-center">
          <div class="text-xs text-slate-600">
            {#if resendCountdown > 0}
              <span class="text-slate-500">
                Belum menerima kode? Kirim ulang dalam <strong class="text-brand-600 font-mono">{resendCountdown} detik</strong>
              </span>
            {:else}
              <button
                type="button"
                class="font-semibold text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                onclick={handleResendOtp}
                disabled={isResendingOtp}
              >
                {isResendingOtp ? 'Mengirim ulang...' : 'Kirim Ulang Kode OTP'}
              </button>
            {/if}
          </div>

          <div>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              onclick={() => {
                currentStep = 'form';
                otpCode = '';
                otpError = '';
                resendNotice = '';
              }}
            >
              &larr; Ubah data pendaftaran atau perbaiki email
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Main Registration Card -->
      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl shadow-slate-200/50">
      <!-- Title & Headline -->
      <div class="text-center sm:text-left">
        <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200/80">
          Uji Coba 30 Hari Tanpa Biaya
        </span>
        <h1 class="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Daftarkan Usaha Kuliner Anda
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Miliki website menu digital mandiri dengan subdomain unik yang aktif seketika. Tanpa komisi potongan pesanan.
        </p>
      </div>

      <!-- Alert Banners -->
      {#if formError}
        <div
          role="alert"
          class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-3"
        >
          <svg class="size-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <p class="font-bold">Gagal Mendaftar</p>
            <p class="mt-0.5 text-xs text-red-700">{formError}</p>
          </div>
        </div>
      {/if}

      {#if successNotice}
        <div
          role="status"
          class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-start gap-3"
        >
          <svg class="size-5 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="font-bold">Pendaftaran Berhasil</p>
            <p class="mt-0.5 text-xs text-emerald-700">{successNotice}</p>
            <div class="mt-3">
              <a href="/masuk">
                <Button size="sm">Menuju Halaman Masuk &rarr;</Button>
              </a>
            </div>
          </div>
        </div>
      {/if}

      <!-- Form Inputs -->
      <form onsubmit={handleSubmit} class="mt-6 space-y-4 sm:space-y-5" novalidate>
        <!-- 1. Nama Lengkap & No WhatsApp -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="fullName" class="block text-xs font-semibold text-slate-700">
              Nama Lengkap Pemilik <span class="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autocomplete="name"
              placeholder="Contoh: Nia Kurniawati"
              bind:value={fullName}
              class="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
            />
          </div>

          <div>
            <label for="phone" class="block text-xs font-semibold text-slate-700">
              No. WhatsApp Aktif <span class="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autocomplete="tel"
              placeholder="Contoh: 081234567890"
              bind:value={phone}
              class="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- 2. Nama Usaha / Kedai -->
        <div>
          <label for="businessName" class="block text-xs font-semibold text-slate-700">
            Nama Usaha / Kedai / Resto <span class="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            autocomplete="organization"
            placeholder="Contoh: Dapur Bu Nia"
            value={businessName}
            oninput={handleBusinessNameInput}
            class="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
          />
        </div>

        <!-- 3. Subdomain Pilihan & Live Preview Card -->
        <div>
          <div class="flex items-center justify-between">
            <label for="subdomain" class="block text-xs font-semibold text-slate-700">
              Pilihan Subdomain Usaha <span class="text-red-500">*</span>
            </label>
            <span class="text-[11px] text-slate-500">Huruf kecil, angka, tanda hubung</span>
          </div>

          <div class="mt-1.5 relative flex items-center">
            <input
              id="subdomain"
              name="subdomain"
              type="text"
              required
              placeholder="dapur-bu-nia"
              value={subdomain}
              oninput={handleSubdomainInput}
              class="h-11 w-full rounded-xl border bg-white pl-3.5 pr-32 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent font-mono transition-all {subdomainStatus === 'invalid'
                ? 'border-red-400'
                : subdomainStatus === 'valid'
                ? 'border-emerald-500'
                : 'border-slate-300'}"
            />
            <span class="absolute right-3 text-xs font-mono font-medium text-slate-400 pointer-events-none select-none">
              .restolink.site
            </span>
          </div>

          <!-- Live Subdomain Preview & Status Box -->
          <div class="mt-2.5 rounded-xl border p-3 text-xs transition-colors {subdomainStatus === 'valid'
            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
            : subdomainStatus === 'invalid'
            ? 'border-red-200 bg-red-50/70 text-red-900'
            : 'border-slate-200 bg-slate-50 text-slate-600'}">
            <div class="flex items-center justify-between">
              <span class="font-medium text-[11px] uppercase tracking-wider text-slate-500">Live Website URL</span>
              <div>
                {#if isCheckingSubdomain}
                  <span class="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                    <span class="size-2 rounded-full bg-amber-500 animate-ping"></span>
                    Memeriksa...
                  </span>
                {:else if subdomainStatus === 'valid'}
                  <span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                    <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Tersedia
                  </span>
                {:else if subdomainStatus === 'invalid'}
                  <span class="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                    <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Tidak Valid
                  </span>
                {/if}
              </div>
            </div>

            <p class="mt-1 font-mono font-bold text-xs sm:text-sm truncate {subdomainStatus === 'valid' ? 'text-emerald-800' : 'text-slate-700'}">
              https://<span class="text-brand-600">{subdomain || 'nama-toko'}</span>.restolink.site
            </p>

            {#if subdomainErrorMessage}
              <p class="mt-1.5 text-[11px] font-medium text-red-600">
                {subdomainErrorMessage}
              </p>
            {/if}
          </div>
        </div>

        <!-- 4. Email & Password -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-700">
              Email Pemilik <span class="text-red-500">*</span>
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

          <div>
            <label for="password" class="block text-xs font-semibold text-slate-700">
              Kata Sandi <span class="text-red-500">*</span>
            </label>
            <div class="mt-1.5 relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autocomplete="new-password"
                placeholder="Minimal 8 karakter"
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
            <p class="mt-1 text-[11px] text-slate-500">Gunakan kombinasi minimal 8 karakter.</p>
          </div>
        </div>

        <!-- 5. Submit Button -->
        <div class="pt-2">
          <Button
            type="submit"
            size="lg"
            full
            loading={isSubmitting}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Mendaftarkan Toko...' : 'Daftar & Buat Toko Sekarang'}
          </Button>

          <p class="mt-2.5 text-center text-[11px] text-slate-500">
            Dengan mendaftar, Anda menyetujui Ketentuan Layanan &amp; Kebijakan Privasi RestoLink.
          </p>
        </div>
      </form>

      <!-- Already Have Account Link -->
      <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">
        Sudah memiliki akun toko?
        <a href="/masuk" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
          Masuk ke Dashboard &rarr;
        </a>
      </div>
    </div>
    {/if}

    <!-- Security & Trust Badges -->
    <div class="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
      <div class="flex items-center gap-1.5">
        <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Trial 30 Hari Bebas Biaya</span>
      </div>
      <div class="flex items-center gap-1.5">
        <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Tanpa Kartu Kredit</span>
      </div>
      <div class="flex items-center gap-1.5">
        <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>0% Potongan Komisi</span>
      </div>
    </div>
  </div>
</div>
