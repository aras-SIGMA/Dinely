<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import {
    slugify,
    checkSubdomainAvailability,
    validateSubdomainFormat
  } from '@/lib/subdomain-validator';
  import { router } from '@/lib/router';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import OtpInput from '@/components/ui/OtpInput.svelte';

  // Form Fields
  let fullName = $state('');
  let phone = $state('');
  let businessName = $state('');
  let subdomain = $state('');
  let email = $state('');
  let password = $state('');

  // UI & Flow States
  let step = $state<'form' | 'otp'>('form');
  let isSubdomainManuallyEdited = $state(false);
  let showPassword = $state(false);
  let isCheckingSubdomain = $state(false);
  let subdomainStatus = $state<'idle' | 'valid' | 'invalid'>('idle');
  let subdomainErrorMessage = $state('');
  let isSubmitting = $state(false);
  let formError = $state('');
  let successNotice = $state('');

  // OTP States
  let otpCode = $state('');
  let isVerifyingOtp = $state(false);
  let otpErrorMessage = $state('');
  let otpSuccessNotice = $state('');
  let resendCountdown = $state(0);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // Debounce Timer Reference
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  function startCountdown(seconds = 60) {
    if (countdownTimer) clearInterval(countdownTimer);
    resendCountdown = seconds;
    countdownTimer = setInterval(() => {
      resendCountdown -= 1;
      if (resendCountdown <= 0) {
        if (countdownTimer) clearInterval(countdownTimer);
      }
    }, 1000);
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
      } catch {
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
          // Masuk ke tahap verifikasi OTP email
          step = 'otp';
          startCountdown(60);
          otpSuccessNotice = 'Pendaftaran berhasil! Masukkan 6 digit kode OTP yang kami kirimkan ke email Anda.';
        }
      } else {
        if (result.error?.toLowerCase().includes('failed to fetch')) {
          formError = 'Gagal terhubung ke database (Failed to fetch). Pastikan koneksi internet aktif dan variabel database Supabase terisi.';
        } else {
          formError = result.error || 'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.';
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi bermasalah. Silakan periksa internet Anda.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        formError = 'Gagal terhubung ke database (Failed to fetch). Pastikan koneksi internet aktif.';
      } else {
        formError = msg;
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Handle Verify OTP
  async function handleVerifyOtp(codeToVerify?: string) {
    const token = codeToVerify || otpCode;
    if (token.length < 6 || isVerifyingOtp) return;

    isVerifyingOtp = true;
    otpErrorMessage = '';

    try {
      const result = await authStore.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup'
      });

      if (result.success) {
        router.navigate('/dashboard');
      } else {
        otpErrorMessage = result.error || 'Kode OTP tidak valid atau telah kedaluwarsa.';
      }
    } catch (err: unknown) {
      otpErrorMessage = err instanceof Error ? err.message : 'Gagal memverifikasi OTP. Silakan coba lagi.';
    } finally {
      isVerifyingOtp = false;
    }
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (resendCountdown > 0 || !email) return;

    otpErrorMessage = '';
    otpSuccessNotice = '';

    const res = await authStore.resendOtp({ email: email.trim(), type: 'signup' });
    if (res.success) {
      otpSuccessNotice = 'Kode OTP baru telah dikirimkan ke kotak masuk email Anda.';
      startCountdown(60);
    } else {
      otpErrorMessage = res.error || 'Gagal mengirim ulang kode OTP.';
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
  });

  onDestroy(() => {
    if (countdownTimer) clearInterval(countdownTimer);
    if (debounceTimeout) clearTimeout(debounceTimeout);
  });
</script>

<svelte:head>
  <title>Daftar Akun RestoLink - Website Menu Digital Mandiri</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 lg:grid lg:grid-cols-12 font-sans selection:bg-brand-500 selection:text-white">
  <!-- SISI KIRI: BRANDING & PREVIEW MOCKUP (Visible on Desktop lg+) -->
  <aside class="relative hidden lg:col-span-5 xl:col-span-5 lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 text-white overflow-hidden">
    <!-- Ambient Glow Efek Cahaya Halus -->
    <div class="absolute -top-32 -left-32 size-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" aria-hidden="true"></div>
    <div class="absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

    <!-- Top: Brand Logo -->
    <div class="relative z-10">
      <a href="/" class="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl p-1">
        <Logo size="md" />
      </a>
    </div>

    <!-- Center: Content Headline & Live Subdomain Browser Bar -->
    <div class="relative z-10 my-auto py-8 space-y-6">
      <div class="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-300">
        <span class="size-2 rounded-full bg-brand-400"></span>
        <span>Uji Coba 30 Hari Tanpa Biaya</span>
      </div>

      <div class="space-y-3">
        <h1 class="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Buka website menu resto Anda dalam hitungan menit.
        </h1>
        <p class="text-sm xl:text-base text-slate-300 leading-relaxed max-w-md">
          Nikmati website mandiri berkecepatan tinggi dengan subdomain unik. Pelanggan cukup scan QR meja untuk pesan tanpa perlu instal aplikasi.
        </p>
      </div>

      <!-- Live Reactive Subdomain Address Bar Mockup -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-sm space-y-3.5 max-w-md">
        <div class="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full bg-rose-500/80"></span>
            <span class="size-2.5 rounded-full bg-amber-500/80"></span>
            <span class="size-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span class="font-mono text-[11px] text-slate-500">Live Web Subdomain</span>
        </div>

        <!-- Simulated Browser Address Bar -->
        <div class="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs font-mono">
          <svg class="size-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="text-slate-400">https://</span>
          <span class="text-brand-400 font-bold truncate">{subdomain || 'nama-resto-anda'}</span>
          <span class="text-slate-400">.restolink.site</span>
        </div>

        <!-- Mini Feature Bullets -->
        <div class="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>QR Meja Siap Cetak</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>0% Potongan Komisi</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>Manajemen Dapur</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>Integrasi Midtrans</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom: Footer Meta -->
    <div class="relative z-10 border-t border-slate-800/80 pt-6 text-xs text-slate-400">
      <p>Daftar sekarang &bull; Aktif seketika tanpa perlu kartu kredit.</p>
    </div>
  </aside>

  <!-- SISI KANAN: FORMULIR PENDAFTARAN (Clean & Structured) -->
  <main class="lg:col-span-7 xl:col-span-7 flex flex-col justify-between bg-white text-slate-900 min-h-screen px-6 py-8 sm:px-12 sm:py-10 lg:px-16">
    <!-- Top Navigation Header -->
    <div class="flex items-center justify-between w-full max-w-lg mx-auto">
      <a
        href="/"
        class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md py-1 px-1.5"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Kembali ke Beranda</span>
      </a>

      <!-- Mobile Brand Logo (Hanya tampil di mobile/tablet < lg) -->
      <div class="lg:hidden">
        <a href="/" aria-label="RestoLink Beranda">
          <Logo size="sm" />
        </a>
      </div>

      <div class="text-xs font-medium text-slate-500 hidden sm:block">
        Sudah memiliki akun?
        <a href="/masuk" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
          Masuk
        </a>
      </div>
    </div>

    <!-- Center Content Form Container -->
    <div class="w-full max-w-lg mx-auto my-auto py-6">
      {#if step === 'form'}
        <!-- ==================== VIEW 1: FORM REGISTER ==================== -->
        <div>
          <!-- Title & Subtitle -->
          <div class="space-y-1.5">
            <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200/80">
              Registrasi Restoran Baru
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Daftarkan Usaha Kuliner Anda
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mulai uji coba gratis 30 hari. Akses penuh ke pembuatan menu digital dan pemesanan meja.
            </p>
          </div>

          <!-- Alert Banners -->
          {#if formError}
            <div
              role="alert"
              class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-in fade-in duration-200"
            >
              <svg class="size-5 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="flex-1">
                <p class="font-bold">Gagal Mendaftar</p>
                <p class="mt-0.5 text-xs text-rose-700 leading-relaxed">{formError}</p>
              </div>
            </div>
          {/if}

          <!-- Form Inputs -->
          <form onsubmit={handleSubmit} class="mt-6 space-y-6" novalidate>
            <!-- GRUP 1: PROFIL USAHA & SUBDOMAIN -->
            <div class="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 space-y-4">
              <div class="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <span class="flex size-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">1</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Data Usaha &amp; Subdomain Website
                </h3>
              </div>

              <!-- Nama Usaha -->
              <div>
                <label for="businessName" class="block text-xs font-semibold text-slate-700">
                  Nama Usaha / Kedai / Resto <span class="text-rose-500">*</span>
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

              <!-- Pilihan Subdomain & Live Status -->
              <div>
                <div class="flex items-center justify-between">
                  <label for="subdomain" class="block text-xs font-semibold text-slate-700">
                    Pilihan Subdomain Toko <span class="text-rose-500">*</span>
                  </label>
                  <span class="text-[11px] text-slate-500 font-mono">.restolink.site</span>
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
                      ? 'border-rose-400 bg-rose-50/20'
                      : subdomainStatus === 'valid'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-300'}"
                  />
                  <span class="absolute right-3 text-xs font-mono font-medium text-slate-400 pointer-events-none select-none">
                    .restolink.site
                  </span>
                </div>

                <!-- Live Subdomain Status Feedback -->
                <div class="mt-2 rounded-xl border p-2.5 text-xs transition-colors {subdomainStatus === 'valid'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : subdomainStatus === 'invalid'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-white text-slate-600'}">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs truncate">
                      https://<strong class="text-brand-600">{subdomain || 'nama-resto'}</strong>.restolink.site
                    </span>
                    <div>
                      {#if isCheckingSubdomain}
                        <span class="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                          <span class="size-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Mengecek...
                        </span>
                      {:else if subdomainStatus === 'valid'}
                        <span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Tersedia
                        </span>
                      {:else if subdomainStatus === 'invalid'}
                        <span class="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Tidak Tersedia
                        </span>
                      {/if}
                    </div>
                  </div>

                  {#if subdomainErrorMessage}
                    <p class="mt-1 text-[11px] font-medium text-rose-600">
                      {subdomainErrorMessage}
                    </p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- GRUP 2: AKUN PEMILIK & KEAMANAN -->
            <div class="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 space-y-4">
              <div class="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <span class="flex size-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">2</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Akun Pemilik &amp; Keamanan
                </h3>
              </div>

              <!-- Nama Lengkap & No WhatsApp -->
              <div class="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label for="fullName" class="block text-xs font-semibold text-slate-700">
                    Nama Pemilik <span class="text-rose-500">*</span>
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
                    No. WhatsApp <span class="text-rose-500">*</span>
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

              <!-- Email & Password -->
              <div class="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label for="email" class="block text-xs font-semibold text-slate-700">
                    Email Aktif <span class="text-rose-500">*</span>
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
                    Kata Sandi <span class="text-rose-500">*</span>
                  </label>
                  <div class="mt-1.5 relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autocomplete="new-password"
                      placeholder="Min. 8 karakter"
                      bind:value={password}
                      class="h-11 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                      onclick={() => (showPassword = !showPassword)}
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
              </div>
            </div>

            <!-- Submit Button -->
            <div class="space-y-2.5">
              <Button
                type="submit"
                size="lg"
                full
                loading={isSubmitting}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Mendaftarkan Toko...' : 'Daftar & Buat Toko Sekarang'}
              </Button>

              <p class="text-center text-[11px] text-slate-500">
                Dengan mendaftar, Anda menyetujui Ketentuan Layanan &amp; Kebijakan Privasi RestoLink.
              </p>
            </div>
          </form>

          <!-- Mobile Only Switch to Login -->
          <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600 sm:hidden">
            Sudah memiliki akun toko?
            <a href="/masuk" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
              Masuk ke Dashboard &rarr;
            </a>
          </div>
        </div>
      {:else}
        <!-- ==================== VIEW 2: FORM VERIFIKASI OTP REGISTRASI ==================== -->
        <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
          <!-- Back button to form -->
          <button
            type="button"
            onclick={() => {
              step = 'form';
              otpErrorMessage = '';
            }}
            class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors rounded p-1"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Ubah Data Pendaftaran</span>
          </button>

          <!-- OTP Header -->
          <div class="text-center sm:text-left space-y-2">
            <div class="size-12 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 mb-2">
              <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Verifikasi Pendaftaran Resto
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Satu langkah lagi untuk mengaktifkan subdomain <strong class="text-brand-600 font-mono">{subdomain}.restolink.site</strong>. Masukkan 6 digit kode OTP yang kami kirimkan ke email:
              <strong class="text-slate-900 block mt-0.5">{email}</strong>
            </p>
          </div>

          <!-- Alert Notices -->
          {#if otpSuccessNotice}
            <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
              <svg class="size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{otpSuccessNotice}</span>
            </div>
          {/if}

          {#if otpErrorMessage}
            <div class="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2.5">
              <svg class="size-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{otpErrorMessage}</span>
            </div>
          {/if}

          <!-- 6 Digit OTP Component -->
          <div class="py-2">
            <OtpInput
              bind:value={otpCode}
              disabled={isVerifyingOtp}
              hasError={!!otpErrorMessage}
              oncomplete={(code) => handleVerifyOtp(code)}
            />
          </div>

          <!-- Action Button -->
          <div class="space-y-3">
            <Button
              type="button"
              size="lg"
              full
              loading={isVerifyingOtp}
              disabled={isVerifyingOtp || otpCode.length < 6}
              onclick={() => handleVerifyOtp()}
            >
              {isVerifyingOtp ? 'Mengaktifkan Toko...' : 'Verifikasi & Aktifkan Toko'}
            </Button>

            <!-- Resend Countdown -->
            <div class="text-center text-xs text-slate-600">
              {#if resendCountdown > 0}
                <span>Kirim ulang kode dalam <strong class="font-mono text-brand-600">{resendCountdown}s</strong></span>
              {:else}
                <span>Belum menerima kode OTP?</span>
                <button
                  type="button"
                  onclick={handleResendOtp}
                  class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1"
                >
                  Kirim Ulang Kode OTP
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Bottom Copyright -->
    <div class="w-full max-w-lg mx-auto pt-6 text-center text-xs text-slate-400 border-t border-slate-100">
      &copy; 2026 RestoLink Platform. Hak Cipta Dilindungi.
    </div>
  </main>
</div>
