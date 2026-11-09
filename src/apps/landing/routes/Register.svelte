<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import {
    slugify,
    checkSubdomainAvailability,
    validateSubdomainFormat
  } from '@/lib/subdomain-validator';
  import { router } from '@/lib/router';
  import Logo from '@/components/ui/Logo.svelte';
  import OtpInput from '@/components/ui/OtpInput.svelte';

  // Form Fields
  let businessName = $state('');
  let subdomain = $state('');
  let phone = $state('');
  let address = $state('');
  let fullName = $state('');
  let email = $state('');
  let password = $state('');

  // Step Management (1: Restoran, 2: Pemilik, 3: Konfirmasi, 4: OTP)
  let step = $state<1 | 2 | 3 | 4>(1);
  let maxReachedStep = $state<1 | 2 | 3>(1);

  // UI States
  let isSubdomainManuallyEdited = $state(false);
  let showPassword = $state(false);
  let isCheckingSubdomain = $state(false);
  let subdomainStatus = $state<'idle' | 'valid' | 'invalid'>('idle');
  let subdomainErrorMessage = $state('');
  let isSubmitting = $state(false);
  let formError = $state('');

  // OTP States
  let otpCode = $state('');
  let isVerifyingOtp = $state(false);
  let otpErrorMessage = $state('');
  let otpSuccessNotice = $state('');
  let resendCountdown = $state(0);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // Debounce Timer Reference
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  // Visual Colors per step (Matching CationGate's dynamic wave feel)
  const stepVisuals = {
    1: { title: 'Restoran', color: '#f97316', desc: 'Mulai buat website dan portal menu digital resto Anda.' },
    2: { title: 'Pemilik', color: '#ea580c', desc: 'Amankan hak akses administrator dan autentikasi toko Anda.' },
    3: { title: 'Konfirmasi', color: '#c2410c', desc: 'Verifikasi kelengkapan data sebelum aktivasi akun resto.' },
    4: { title: 'Verifikasi OTP', color: '#f97316', desc: 'Satu langkah lagi untuk mengaktifkan subdomain resto Anda.' }
  };

  // Password strength calculation (0 to 4)
  let passwordStrength = $derived.by(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
    return score;
  });

  // Step 1 Validation
  let isStep1Valid = $derived(
    businessName.trim().length >= 2 &&
    subdomain.trim().length >= 3 &&
    subdomainStatus === 'valid' &&
    phone.trim().length >= 8
  );

  // Step 2 Validation
  let isStep2Valid = $derived(
    fullName.trim().length >= 2 &&
    email.trim().includes('@') &&
    password.length >= 8
  );

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

  // Auto-slugify Subdomain when Business Name changes
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

  // Trigger Debounced Subdomain Check
  function triggerSubdomainCheck(slug: string) {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (!slug) {
      subdomainStatus = 'idle';
      subdomainErrorMessage = '';
      isCheckingSubdomain = false;
      return;
    }

    const clientCheck = validateSubdomainFormat(slug);
    if (!clientCheck.valid) {
      subdomainStatus = 'invalid';
      subdomainErrorMessage = clientCheck.error || 'Format subdomain tidak valid.';
      isCheckingSubdomain = false;
      return;
    }

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

  function goToStep(target: 1 | 2 | 3) {
    formError = '';
    step = target;
  }

  function handleNextStep1(e: SubmitEvent) {
    e.preventDefault();
    formError = '';
    if (!isStep1Valid) {
      if (subdomainStatus !== 'valid') {
        formError = 'Pastikan format subdomain valid dan tersedia.';
      } else {
        formError = 'Lengkapi seluruh data restoran sebelum melanjutkan.';
      }
      return;
    }
    step = 2;
    if (maxReachedStep < 2) maxReachedStep = 2;
  }

  function handleNextStep2(e: SubmitEvent) {
    e.preventDefault();
    formError = '';
    if (!isStep2Valid) {
      formError = 'Lengkapi nama pemilik, email aktif, dan kata sandi minimal 8 karakter.';
      return;
    }
    step = 3;
    if (maxReachedStep < 3) maxReachedStep = 3;
  }

  // Trigger Registration & Send OTP
  async function handleSendRegistrationOtp() {
    formError = '';
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
          router.navigate('/dashboard');
        } else {
          step = 4;
          startCountdown(60);
          otpSuccessNotice = 'Pendaftaran tersimpan! Masukkan 6 digit kode OTP yang kami kirimkan ke email Anda.';
        }
      } else {
        formError = result.error || 'Gagal mendaftarkan toko. Silakan periksa kembali formulir Anda.';
      }
    } catch (err: unknown) {
      formError = err instanceof Error ? err.message : 'Terjadi kendala jaringan. Silakan coba lagi.';
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
  <title>Daftar Resto - RestoLink Platform</title>
</svelte:head>

<main class="min-h-screen w-full bg-white text-slate-950 overflow-x-hidden relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-brand-500 selection:text-white">
  <!-- CATIONGATE-STYLE ORGANIC VECTOR WAVE (Dynamic Fill Color) -->
  <!-- Desktop Wave -->
  <div class="hidden lg:block absolute top-0 left-0 w-[48vw] h-[95vh] pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 600 700" class="w-full h-full" preserveAspectRatio="none">
      <path
        d="M 0 0 L 540 0 C 620 300, 460 500, 280 670 C 130 740, 0 670, 0 670 Z"
        fill={stepVisuals[step].color}
        class="transition-colors duration-700 ease-out"
      />
    </svg>
  </div>

  <!-- Mobile Wave -->
  <div class="lg:hidden absolute top-0 left-0 w-full h-44 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 414 200" class="w-full h-full" preserveAspectRatio="none">
      <path
        d="M 0 0 L 414 0 L 414 125 C 290 165, 150 155, 0 185 Z"
        fill={stepVisuals[step].color}
        class="transition-colors duration-700 ease-out"
      />
    </svg>
  </div>

  <!-- TOP NAVIGATION HEADER (Matching CationGate) -->
  <nav class="relative lg:absolute top-2 lg:top-6 left-2 lg:left-8 right-2 lg:right-8 flex items-center justify-between z-20 mb-4 lg:mb-0">
    <!-- Left: Back to Home -->
    <div class="flex items-center gap-2">
      <a
        href="/"
        class="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/85 transition-all group drop-shadow-sm cursor-pointer"
        title="Kembali ke Beranda RestoLink"
      >
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Beranda</span>
      </a>
    </div>

    <!-- Center: Brand Logo & Title -->
    <a
      href="/"
      class="flex items-center gap-2 group lg:absolute lg:left-[45vw] lg:-translate-x-1/2 transition-transform hover:scale-102 cursor-pointer"
    >
      <Logo iconOnly size="sm" class="drop-shadow-sm transition-transform group-hover:rotate-6" />
      <div class="text-xl sm:text-2xl font-black tracking-tight font-sans select-none flex items-center">
        <span class="text-slate-950">Resto</span>
        <span style="color: {stepVisuals[step].color};" class="transition-colors duration-500">Link</span>
      </div>
    </a>

    <!-- Right: Masuk Pill Button -->
    <div class="flex items-center gap-2.5 text-xs">
      <span class="hidden text-slate-500 font-medium sm:block">Sudah memiliki akun?</span>
      <a
        href="/masuk"
        class="rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-md px-4 py-1.5 font-bold text-slate-700 transition-all hover:bg-white hover:text-brand-600 hover:border-brand-500/40 hover:shadow-sm active:scale-95 shadow-xs"
      >
        Masuk
      </a>
    </div>
  </nav>

  <!-- CENTER CONTENT GRID (CationGate Layout: Col-7 Visual + Col-5 Form) -->
  <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto z-10 relative pt-4 lg:pt-8">
    <!-- SISI KIRI (Col-7): Dynamic Step Typography & Highlighted Glassmorphic Preview -->
    <div class="hidden lg:flex lg:col-span-7 xl:col-span-7 items-center justify-between relative pl-4 pr-2">
      <!-- Headline & Subtitle -->
      <div class="z-10 w-[50%] xl:w-[48%] text-left space-y-4">
        {#if step === 1}
          <h2 class="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.02] drop-shadow-md">
            Data <br />
            <span class="text-amber-200 drop-shadow-sm">Restoran</span>
          </h2>
          <p class="text-xs lg:text-sm text-white/95 font-medium leading-relaxed max-w-xs">
            {stepVisuals[1].desc}
          </p>
        {:else if step === 2}
          <h2 class="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.02] drop-shadow-md">
            Akun <br />
            <span class="text-amber-200 drop-shadow-sm">Pemilik</span>
          </h2>
          <p class="text-xs lg:text-sm text-white/95 font-medium leading-relaxed max-w-xs">
            {stepVisuals[2].desc}
          </p>
        {:else if step === 3}
          <h2 class="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.02] drop-shadow-md">
            Konfirmasi <br />
            <span class="text-amber-200 drop-shadow-sm">Akhir</span>
          </h2>
          <p class="text-xs lg:text-sm text-white/95 font-medium leading-relaxed max-w-xs">
            {stepVisuals[3].desc}
          </p>
        {:else}
          <h2 class="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.02] drop-shadow-md">
            Verifikasi <br />
            <span class="text-amber-200 drop-shadow-sm">Email OTP</span>
          </h2>
          <p class="text-xs lg:text-sm text-white/95 font-medium leading-relaxed max-w-xs">
            {stepVisuals[4].desc}
          </p>
        {/if}
      </div>

      <!-- Right Visual Component: Live Highlighted Glassmorphic Preview (Shifted to the right) -->
      <div class="z-10 w-[50%] xl:w-[52%] flex items-center justify-end relative pl-4 lg:pl-6 translate-x-2 lg:translate-x-6 xl:translate-x-10">
        <div class="relative group w-full max-w-72">
          <!-- Ambient Glow behind Glass Card for Separation from Orange Wave -->
          <div class="absolute -inset-1.5 rounded-3xl bg-white/25 blur-xl opacity-75 pointer-events-none" aria-hidden="true"></div>

          <!-- Glassmorphic Card Container -->
          <div class="relative w-full rounded-2xl border border-white/60 bg-gradient-to-b from-white/30 via-white/20 to-white/10 backdrop-blur-2xl p-4.5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.28),inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(0,0,0,0.12)] space-y-3.5 transition-all duration-300">
            <!-- Top Specular Highlight Edge -->
            <div class="absolute inset-x-4 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none"></div>

            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-white/25 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-rose-400"></span>
                <span class="size-2 rounded-full bg-amber-400"></span>
                <span class="size-2 rounded-full bg-emerald-400"></span>
              </div>
              <span class="font-mono text-[10px] text-white/90 font-bold tracking-wider uppercase drop-shadow-sm">Live Preview</span>
            </div>

            <!-- Browser Address Simulator with High-Contrast Dark-Glass Interior -->
            <div class="rounded-xl bg-slate-950/40 border border-white/30 px-3 py-2 text-xs font-mono flex items-center gap-1.5 shadow-inner">
              <svg class="size-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="text-emerald-300">https://</span>
              <span class="font-bold text-amber-200 truncate">{subdomain || 'nama-resto'}</span>
              <span class="text-white/80">.restolink.site</span>
            </div>

            <!-- Live Feature Checklist with Defined Badges -->
            <div class="space-y-2 pt-0.5 text-xs text-white">
              <div class="flex items-center gap-2">
                <span class="flex size-4 items-center justify-center rounded-full bg-emerald-400/30 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">✓</span>
                <span class="font-medium drop-shadow-sm">Website Menu Instan</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="flex size-4 items-center justify-center rounded-full bg-emerald-400/30 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">✓</span>
                <span class="font-medium drop-shadow-sm">Pemesanan QR Meja Mandiri</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="flex size-4 items-center justify-center rounded-full bg-emerald-400/30 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">✓</span>
                <span class="font-medium drop-shadow-sm">Rekap Keuangan 0% Komisi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SISI KANAN (Col-5): Multi-step Form Card (Clean & Focused) -->
    <div class="lg:col-span-5 xl:col-span-5 flex flex-col justify-center px-1 sm:px-6 lg:px-4 z-10">
      <div class="w-full max-w-115 mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 lg:shadow-none lg:border-none lg:p-0">
        <!-- Card Header -->
        <div class="mb-5 sm:mb-6 text-left">
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Mulai Digitalisasi Resto Anda
          </h1>
          <p class="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            Daftarkan restoran kamu dan mulai kelola menu mandiri dengan RestoLink.
          </p>
        </div>

        <!-- Global Error Banner -->
        {#if formError}
          <div
            role="alert"
            class="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 animate-in fade-in duration-200 text-left"
          >
            <svg class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <p class="font-bold">Periksa Kembali</p>
              <p class="mt-0.5 text-xs text-rose-700 font-normal leading-relaxed">{formError}</p>
            </div>
          </div>
        {/if}

        <!-- ==================== STEP 1: DATA RESTORAN ==================== -->
        {#if step === 1}
          <form onsubmit={handleNextStep1} class="space-y-4 text-left animate-in fade-in duration-200" novalidate>
            <!-- Nama Resto -->
            <div class="space-y-1">
              <label for="businessName" class="text-[11px] font-bold text-slate-700">
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
                class="h-10 sm:h-11 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
              />
            </div>

            <!-- Subdomain & Status -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label for="subdomain" class="text-[11px] font-bold text-slate-700">
                  Pilihan Subdomain Toko <span class="text-rose-500">*</span>
                </label>
                <span class="text-[11px] text-slate-400 font-mono">.restolink.site</span>
              </div>

              <div class="relative flex items-center">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  placeholder="dapur-bu-nia"
                  value={subdomain}
                  oninput={handleSubdomainInput}
                  class="h-10 sm:h-11 w-full pl-3.5 pr-28 rounded-xl border bg-white text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all {subdomainStatus === 'invalid'
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : subdomainStatus === 'valid'
                    ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'}"
                />
                <span class="absolute right-3 text-xs font-mono font-semibold text-slate-400 pointer-events-none select-none">
                  .restolink.site
                </span>
              </div>

              <!-- Live Status Pill -->
              <div class="flex items-center justify-between pt-0.5 text-[11px]">
                <span class="font-mono text-slate-500 truncate text-[11px]">
                  https://<strong class="text-brand-600">{subdomain || 'nama-resto'}</strong>.restolink.site
                </span>
                <div>
                  {#if isCheckingSubdomain}
                    <span class="text-amber-600 font-semibold inline-flex items-center gap-1">
                      <span class="size-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Mengecek...
                    </span>
                  {:else if subdomainStatus === 'valid'}
                    <span class="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                      ✓ Tersedia
                    </span>
                  {:else if subdomainStatus === 'invalid'}
                    <span class="text-rose-600 font-bold">
                      ✕ {subdomainErrorMessage || 'Tidak tersedia'}
                    </span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- WhatsApp Resto -->
            <div class="space-y-1">
              <label for="phone" class="text-[11px] font-bold text-slate-700">
                No. WhatsApp Resto <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autocomplete="tel"
                  placeholder="081234567890"
                  bind:value={phone}
                  class="h-10 sm:h-11 w-full pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all font-medium"
                />
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>

            <!-- Alamat Singkat -->
            <div class="space-y-1">
              <label for="address" class="text-[11px] font-bold text-slate-700">
                Kota / Alamat Singkat Resto
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Contoh: Jl. Diponegoro No. 12, Bandung"
                bind:value={address}
                class="h-10 sm:h-11 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
              />
            </div>

            <!-- Bottom Button -->
            <div class="mt-5 sm:mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={!isStep1Valid}
                class="h-10 sm:h-11 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 text-xs font-bold text-white shadow-md shadow-brand-500/20 cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                <span>Lanjutkan</span>
                <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>

        <!-- ==================== STEP 2: AKUN PEMILIK ==================== -->
        {:else if step === 2}
          <form onsubmit={handleNextStep2} class="space-y-4 text-left animate-in fade-in duration-200" novalidate>
            <!-- Nama Pemilik -->
            <div class="space-y-1">
              <label for="fullName" class="text-[11px] font-bold text-slate-700">
                Nama Lengkap Pemilik <span class="text-rose-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autocomplete="name"
                placeholder="Contoh: Budi Setiawan"
                bind:value={fullName}
                class="h-10 sm:h-11 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
              />
            </div>

            <!-- Email Pemilik -->
            <div class="space-y-1">
              <label for="email" class="text-[11px] font-bold text-slate-700">
                Alamat Email Aktif <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="admin@resto.com"
                  bind:value={email}
                  class="h-10 sm:h-11 w-full pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                />
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <!-- Kata Sandi -->
            <div class="space-y-1">
              <label for="password" class="text-[11px] font-bold text-slate-700">
                Kata Sandi Utama <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autocomplete="new-password"
                  placeholder="Minimal 8 karakter"
                  bind:value={password}
                  class="h-10 sm:h-11 w-full pl-9 pr-10 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                />
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onclick={() => (showPassword = !showPassword)}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5 rounded"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {#if showPassword}
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  {:else}
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  {/if}
                </button>
              </div>

              <!-- Password Strength Meter -->
              {#if password}
                <div class="pt-1.5 space-y-1">
                  <div class="flex gap-1 h-1.5 w-full">
                    <div class="flex-1 rounded-full {passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-rose-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}"></div>
                    <div class="flex-1 rounded-full {passwordStrength >= 2 ? (passwordStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}"></div>
                    <div class="flex-1 rounded-full {passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}"></div>
                    <div class="flex-1 rounded-full {passwordStrength >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}"></div>
                  </div>
                  <p class="text-[10px] text-slate-500 font-medium">
                    Kekuatan Sandi:
                    <span class="font-bold {passwordStrength <= 1 ? 'text-rose-600' : passwordStrength === 2 ? 'text-amber-600' : 'text-emerald-600'}">
                      {passwordStrength <= 1 ? 'Lemah' : passwordStrength === 2 ? 'Cukup' : passwordStrength === 3 ? 'Kuat' : 'Sangat Kuat'}
                    </span>
                  </p>
                </div>
              {/if}
            </div>

            <!-- Bottom Actions -->
            <div class="mt-5 sm:mt-6 flex justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onclick={() => goToStep(1)}
                class="h-10 sm:h-11 px-4 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer hover:bg-slate-100 rounded-xl transition-all inline-flex items-center justify-center"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={!isStep2Valid}
                class="h-10 sm:h-11 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 text-xs font-bold text-white shadow-md shadow-brand-500/20 cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                <span>Lanjutkan</span>
                <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>

        <!-- ==================== STEP 3: KONFIRMASI DATA (CationGate Table) ==================== -->
        {:else if step === 3}
          <div class="text-left animate-in fade-in duration-200">
            <div class="divide-y divide-slate-100 border-y border-slate-100 text-xs mb-4">
              <!-- Restoran -->
              <div class="grid grid-cols-[100px_1fr] gap-4 py-3">
                <span class="font-bold text-slate-400">Restoran</span>
                <div>
                  <p class="font-bold text-slate-900">{businessName || '-'}</p>
                  <p class="text-slate-400 text-[10px] mt-0.5">{address || 'Lokasi belum diisi'}</p>
                </div>
              </div>

              <!-- Subdomain -->
              <div class="grid grid-cols-[100px_1fr] gap-4 py-3">
                <span class="font-bold text-slate-400">Subdomain</span>
                <p class="font-medium text-slate-700">
                  <span class="font-bold text-brand-600 font-mono">{subdomain}</span>
                  <span class="font-mono text-slate-500">.restolink.site</span>
                </p>
              </div>

              <!-- Email -->
              <div class="grid grid-cols-[100px_1fr] gap-4 py-3">
                <span class="font-bold text-slate-400">Email</span>
                <p class="font-medium text-slate-700 break-all">{email}</p>
              </div>

              <!-- Pemilik -->
              <div class="grid grid-cols-[100px_1fr] gap-4 py-3">
                <span class="font-bold text-slate-400">Pemilik</span>
                <div>
                  <p class="font-medium text-slate-800">{fullName}</p>
                  <p class="text-slate-400 text-[10px] mt-0.5">{phone}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-5 sm:mt-6 flex justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onclick={() => goToStep(2)}
                disabled={isSubmitting}
                class="h-10 sm:h-11 px-4 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer hover:bg-slate-100 rounded-xl transition-all inline-flex items-center justify-center"
              >
                Ubah Data
              </button>

              <button
                type="button"
                onclick={handleSendRegistrationOtp}
                disabled={isSubmitting}
                class="h-10 sm:h-11 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 text-xs font-bold text-white shadow-md shadow-brand-500/20 cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {#if isSubmitting}
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Mendaftarkan...</span>
                {:else}
                  <span>Kirim Kode OTP</span>
                  <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>

        <!-- ==================== STEP 4: VERIFIKASI OTP ==================== -->
        {:else if step === 4}
          <div class="space-y-5 text-left animate-in fade-in duration-200">
            <!-- Back to Step 3 -->
            <button
              type="button"
              onclick={() => goToStep(3)}
              class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Ubah Data Pendaftaran</span>
            </button>

            <!-- OTP Header -->
            <div class="space-y-1.5">
              <div class="size-11 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 mb-2">
                <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Verifikasi Pendaftaran Resto
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Satu langkah lagi untuk mengaktifkan subdomain <strong class="text-brand-600 font-mono">{subdomain}.restolink.site</strong>. Masukkan 6 digit kode OTP yang kami kirimkan ke email:
                <strong class="text-slate-800 block mt-0.5">{email}</strong>
              </p>
            </div>

            <!-- Notice Banners -->
            {#if otpSuccessNotice}
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
                <svg class="size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{otpSuccessNotice}</span>
              </div>
            {/if}

            {#if otpErrorMessage}
              <div class="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 flex items-center gap-2.5">
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
              <button
                type="button"
                disabled={isVerifyingOtp || otpCode.length < 6}
                onclick={() => handleVerifyOtp()}
                class="w-full h-11 sm:h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isVerifyingOtp}
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Mengaktifkan Toko...</span>
                {:else}
                  <span>Verifikasi & Aktifkan Toko</span>
                  <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                {/if}
              </button>

              <!-- Resend Countdown -->
              <div class="text-center text-xs text-slate-500 font-medium">
                {#if resendCountdown > 0}
                  <span>Kirim ulang kode dalam <strong class="font-mono text-brand-600 font-bold">{resendCountdown}s</strong></span>
                {:else}
                  <span>Belum menerima kode OTP?</span>
                  <button
                    type="button"
                    onclick={handleResendOtp}
                    class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1 cursor-pointer"
                  >
                    Kirim Ulang Kode OTP
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- CATIONGATE-STYLE BOTTOM FLOATING STEPPER PILL BAR (Desktop lg+) -->
  {#if step <= 3}
    <div class="hidden lg:flex justify-center z-20 relative pb-2 w-full max-w-7xl mx-auto">
      <div class="inline-flex items-center gap-2 bg-[#F1F3F6] p-1.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200/80">
        <!-- 01 Restoran -->
        <button
          type="button"
          onclick={() => goToStep(1)}
          class="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer {step === 1
            ? 'bg-brand-500 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'}"
        >
          <span class="font-black text-xs">01</span>
          <span class="text-[12px]">Restoran</span>
        </button>

        <!-- 02 Pemilik -->
        <button
          type="button"
          disabled={maxReachedStep < 2}
          onclick={() => maxReachedStep >= 2 && goToStep(2)}
          class="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 {step === 2
            ? 'bg-brand-500 text-white shadow-xs cursor-pointer'
            : maxReachedStep >= 2
            ? 'text-slate-600 hover:text-slate-950 hover:bg-white/70 cursor-pointer'
            : 'text-slate-400 opacity-50 cursor-not-allowed'}"
        >
          <span class="font-black text-xs">02</span>
          <span class="text-[12px]">Pemilik</span>
        </button>

        <!-- 03 Konfirmasi -->
        <button
          type="button"
          disabled={maxReachedStep < 3}
          onclick={() => maxReachedStep >= 3 && goToStep(3)}
          class="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 {step === 3
            ? 'bg-brand-500 text-white shadow-xs cursor-pointer'
            : maxReachedStep >= 3
            ? 'text-slate-600 hover:text-slate-950 hover:bg-white/70 cursor-pointer'
            : 'text-slate-400 opacity-50 cursor-not-allowed'}"
        >
          <span class="font-black text-xs">03</span>
          <span class="text-[12px]">Konfirmasi</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- BOTTOM FOOTER -->
  <footer class="w-full text-center text-xs text-slate-400 py-2 relative z-10">
    <p>&copy; {new Date().getFullYear()} RestoLink Platform. Hak Cipta Dilindungi.</p>
  </footer>
</main>
