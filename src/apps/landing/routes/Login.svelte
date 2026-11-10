<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { homePathForRole } from '@/lib/guards';
  import { router } from '@/lib/router';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import OtpInput from '@/components/ui/OtpInput.svelte';
  import LoginMotionIllustration from '@/components/illustrations/LoginMotionIllustration.svelte';

  // Form Fields
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);

  // UI & Flow States
  let step = $state<'credentials' | 'otp'>('credentials');
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let errorMessage = $state('');
  let registeredNotice = $state('');
  let isForgotPasswordModalOpen = $state(false);

  // OTP States
  let otpCode = $state('');
  let isVerifyingOtp = $state(false);
  let otpErrorMessage = $state('');
  let otpSuccessNotice = $state('');
  let resendCountdown = $state(0);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // Form Validation
  let isFormValid = $derived(
    email.trim().includes('@') && password.length >= 6
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

  // Handle Submit Login
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = '';

    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isFromRegistration = registeredNotice !== '' || params?.get('registered') === 'true';

      // Pas abis mencet tombol "Masuk", jika akun baru registrasi langsung tampilkan verifikasi OTP
      if (isFromRegistration) {
        step = 'otp';
        startCountdown(60);
        otpErrorMessage = '';
        otpSuccessNotice = 'Silakan masukkan 6 digit kode OTP yang kami kirimkan ke email Anda.';
        return;
      }

      const result = await authStore.signIn({
        email: email.trim(),
        password
      });

      if (result.success) {
        if (rememberMe && typeof localStorage !== 'undefined') {
          localStorage.setItem('restolink_remember_me', 'true');
          localStorage.setItem('restolink_remembered_email', email.trim());
        } else if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('restolink_remember_me');
          localStorage.removeItem('restolink_remembered_email');
        }

        const targetPath = homePathForRole(authStore.role);
        router.navigate(targetPath as `/${string}`);
      } else {
        const errText = result.error?.toLowerCase() || '';

        // Deteksi jika akun membutuhkan verifikasi email / OTP
        if (
          errText.includes('email not confirmed') ||
          errText.includes('not confirmed') ||
          errText.includes('verify') ||
          errText.includes('otp') ||
          errText.includes('confirmation')
        ) {
          step = 'otp';
          startCountdown(60);
          otpErrorMessage = '';
          otpSuccessNotice = 'Silakan masukkan 6 digit kode verifikasi yang dikirimkan ke email Anda.';
        } else if (errText.includes('invalid login credentials')) {
          errorMessage = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        } else if (errText.includes('failed to fetch')) {
          errorMessage = 'Gagal terhubung ke database. Pastikan koneksi internet Anda aktif.';
        } else {
          errorMessage = result.error || 'Gagal masuk. Silakan periksa kredensial Anda.';
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan. Silakan coba lagi.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Gagal terhubung ke database. Pastikan koneksi internet Anda aktif.';
      } else {
        errorMessage = msg;
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Handle Submit OTP
  async function handleVerifyOtp(codeToVerify?: string) {
    const token = (codeToVerify || otpCode).replace(/\D/g, '');
    if (token.length < 6 || token.length > 8 || isVerifyingOtp) return;

    isVerifyingOtp = true;
    otpErrorMessage = '';

    try {
      const result = await authStore.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup'
      });

      if (result.success) {
        if (rememberMe && typeof localStorage !== 'undefined') {
          localStorage.setItem('restolink_remember_me', 'true');
          localStorage.setItem('restolink_remembered_email', email.trim());
        }
        const targetPath = homePathForRole(authStore.role);
        router.navigate(targetPath as `/${string}`);
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
    let params: URLSearchParams | null = null;
    if (typeof window !== 'undefined') {
      params = new URLSearchParams(window.location.search);
    }
    const isRegistered = params?.get('registered') === 'true';

    if (authStore.isAuthenticated && !isRegistered) {
      const targetPath = homePathForRole(authStore.role);
      router.navigate(targetPath as `/${string}`);
      return;
    }

    if (isRegistered && authStore.isAuthenticated) {
      authStore.signOut();
    }

    if (typeof localStorage !== 'undefined') {
      const isRemembered = localStorage.getItem('restolink_remember_me') === 'true';
      const rememberedEmail = localStorage.getItem('restolink_remembered_email');
      if (isRemembered && rememberedEmail) {
        email = rememberedEmail;
        rememberMe = true;
      }
    }

    if (params) {
      const prefillEmail = params.get('email');
      const needOtp = params.get('verify') === 'true';

      if (prefillEmail) {
        email = prefillEmail;
      }
      if (isRegistered) {
        registeredNotice = 'Pendaftaran resto berhasil! Masukkan kata sandi akun Anda lalu klik Masuk untuk verifikasi kode OTP.';
      } else if (needOtp && prefillEmail) {
        step = 'otp';
        startCountdown(60);
      }
    }
  });

  onDestroy(() => {
    if (countdownTimer) clearInterval(countdownTimer);
  });
</script>

<svelte:head>
  <title>Masuk - RestoLink Platform</title>
</svelte:head>

<main class="min-h-screen w-full bg-white text-slate-950 overflow-x-hidden relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-brand-500 selection:text-white">
  <!-- CATIONGATE-STYLE ORGANIC VECTOR WAVE (Top-Left Backdrop) -->
  <!-- Desktop Wave -->
  <div class="hidden lg:block absolute top-0 left-0 w-[48vw] h-[95vh] pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 600 700" class="w-full h-full" preserveAspectRatio="none">
      <path
        d="M 0 0 L 540 0 C 620 300, 460 500, 280 670 C 130 740, 0 670, 0 670 Z"
        fill="#f97316"
        class="transition-all duration-700"
      />
    </svg>
  </div>

  <!-- Mobile Wave -->
  <div class="lg:hidden absolute top-0 left-0 w-full h-44 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 414 200" class="w-full h-full" preserveAspectRatio="none">
      <path
        d="M 0 0 L 414 0 L 414 125 C 290 165, 150 155, 0 185 Z"
        fill="#f97316"
        class="transition-all duration-700"
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
        <span class="text-brand-500">Link</span>
      </div>
    </a>

    <!-- Right: Daftar Pill Button -->
    <div class="flex items-center gap-2.5 text-xs">
      <span class="hidden text-slate-500 font-medium lg:block">Belum mendaftarkan resto?</span>
      <a
        href="/daftar"
        class="rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-md px-4 py-1.5 font-bold text-slate-700 transition-all hover:bg-white hover:text-brand-600 hover:border-brand-500/40 hover:shadow-sm active:scale-95 shadow-xs"
      >
        Daftar Resto
      </a>
    </div>
  </nav>

  <!-- CENTER CONTENT GRID (CationGate Layout: Col-7 Visual + Col-5 Form) -->
  <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto z-10 relative pt-4 lg:pt-10">
    <!-- SISI KIRI (Col-7): Headline Hero & High-Contrast Glass Card -->
    <div class="hidden lg:flex lg:col-span-7 xl:col-span-7 items-center justify-between relative pl-4 pr-2">
      <!-- Headline & Subtitle (Crisp High-Contrast White) -->
      <div class="z-10 w-[50%] xl:w-[48%] text-left space-y-4">
        <h2 class="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.02] drop-shadow-md">
          Portal <br />
          <span class="text-white drop-shadow-md">Pemilik Resto</span>
        </h2>
        <p class="text-xs lg:text-sm text-white font-medium leading-relaxed max-w-xs drop-shadow-xs">
          Masuk untuk mengelola sistem <strong class="text-white font-bold underline decoration-white/30 underline-offset-4">pesanan meja</strong>, menu digital, dan operasional dapur restoran Anda.
        </p>
      </div>

      <!-- Right Visual Component inside wave: Animated Vector Motion Illustration -->
      <div class="z-10 w-[50%] xl:w-[52%] flex items-center justify-end relative pl-2 lg:pl-4">
        <LoginMotionIllustration />
      </div>
    </div>

    <!-- SISI KANAN (Col-5): Form Card Container (Clean & Focused) -->
    <div class="lg:col-span-5 xl:col-span-5 flex flex-col justify-center px-1 sm:px-6 lg:px-4 z-10">
      <div class="w-full max-w-115 mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 lg:shadow-none lg:border-none lg:p-0">
        {#if step === 'credentials'}
          <!-- ==================== VIEW 1: FORM LOGIN ==================== -->
          <div>
            <!-- Header Titles -->
            <div class="mb-6 text-left">
              <h1 class="text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                Hai, selamat datang <br class="hidden sm:inline" /> kembali
              </h1>
              <p class="mt-2 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Baru di RestoLink?
                <a href="/daftar" class="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors ml-1">
                  Daftar sekarang
                </a>
              </p>
            </div>

            <!-- Registered Success Notice Banner -->
            {#if registeredNotice}
              <div
                role="status"
                class="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200"
              >
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="font-bold">Pendaftaran Berhasil</p>
                  <p class="mt-0.5 text-xs text-emerald-700 font-normal leading-relaxed">{registeredNotice}</p>
                </div>
              </div>
            {/if}

            <!-- Error Banner -->
            {#if errorMessage}
              <div
                role="alert"
                class="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 animate-in fade-in duration-200"
              >
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="flex-1">
                  <p class="font-bold">Gagal Masuk</p>
                  <p class="mt-0.5 text-xs text-rose-700 font-normal leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            {/if}

            <!-- Form Inputs -->
            <form onsubmit={handleSubmit} class="space-y-4" novalidate>
              <!-- 1. Email Input with Left Icon -->
              <div class="space-y-1 text-left">
                <label for="email" class="text-[11px] font-bold text-slate-700">
                  Alamat Email <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="nama@email.com"
                    bind:value={email}
                    class="h-10 sm:h-11 w-full pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                  />
                  <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <!-- 2. Kata Sandi Input with Left Lock Icon & Right Eye Toggle -->
              <div class="space-y-1 text-left">
                <label for="password" class="text-[11px] font-bold text-slate-700">
                  Kata Sandi <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autocomplete="current-password"
                    placeholder="Masukkan kata sandi akun"
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
              </div>

              <!-- 3. Submit Button -->
              <div class="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  class="w-full h-11 sm:h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {#if isSubmitting}
                    <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Memverifikasi...</span>
                  {:else}
                    <span>Masuk</span>
                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  {/if}
                </button>
              </div>

              <!-- 4. Remember Me & Forgot Password Links -->
              <div class="pt-1 flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    bind:checked={rememberMe}
                    class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-slate-600">Ingatkan saya</span>
                </label>

                <button
                  type="button"
                  onclick={() => (isForgotPasswordModalOpen = true)}
                  class="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>
            </form>
          </div>
        {:else}
          <!-- ==================== VIEW 2: VERIFIKASI OTP ==================== -->
          <div class="space-y-6 text-left animate-in fade-in duration-200">
            <!-- Back to Credentials -->
            <button
              type="button"
              onclick={() => {
                step = 'credentials';
                otpErrorMessage = '';
              }}
              class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Ganti Akun / Kembali</span>
            </button>

            <!-- OTP Header -->
            <div class="space-y-1.5">
              <div class="size-11 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 mb-2">
                <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Verifikasi Kode OTP
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Kami telah mengirimkan 6 digit kode keamanan ke email:
                <strong class="text-slate-800 block mt-0.5">{email || 'email Anda'}</strong>
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

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                type="button"
                disabled={isVerifyingOtp || otpCode.length < 6 || otpCode.length > 8}
                onclick={() => handleVerifyOtp()}
                class="w-full h-11 sm:h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isVerifyingOtp}
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Memverifikasi Kode...</span>
                {:else}
                  <span>Verifikasi & Masuk</span>
                  <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                {/if}
              </button>

              <!-- Resend Timer -->
              <div class="text-center text-xs text-slate-500 font-medium">
                {#if resendCountdown > 0}
                  <span>Kirim ulang kode dalam <strong class="font-mono text-brand-600 font-bold">{resendCountdown}s</strong></span>
                {:else}
                  <span>Tidak menerima kode?</span>
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

  <!-- BOTTOM FOOTER -->
  <footer class="w-full text-center text-xs text-slate-400 py-2 relative z-10">
    <p>&copy; {new Date().getFullYear()} RestoLink Platform. Hak Cipta Dilindungi.</p>
  </footer>
</main>

<!-- Modal Pemulihan Kata Sandi -->
<Modal
  open={isForgotPasswordModalOpen}
  title="Pemulihan Kata Sandi"
  onclose={() => (isForgotPasswordModalOpen = false)}
>
  <div class="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
    <p>
      Untuk menjaga keamanan data transaksi dan akun usaha kuliner Anda, pemulihan kata sandi dilakukan melalui verifikasi tim operasional RestoLink.
    </p>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 font-mono text-xs text-slate-800">
      <p><strong>Email Layanan:</strong> support@restolink.site</p>
      <p><strong>WhatsApp Bantuan:</strong> +62 812-3456-7890</p>
      <p class="text-[11px] text-slate-500 font-sans mt-2">
        Sertakan nama usaha, alamat email terdaftar, dan nama subdomain resto Anda saat mengirim permintaan pemulihan.
      </p>
    </div>

    <div class="pt-3 flex justify-end">
      <Button size="sm" variant="secondary" onclick={() => (isForgotPasswordModalOpen = false)}>
        Tutup
      </Button>
    </div>
  </div>
</Modal>
