<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { homePathForRole } from '@/lib/guards';
  import { router } from '@/lib/router';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import OtpInput from '@/components/ui/OtpInput.svelte';

  // Form Fields
  let email = $state('');
  let password = $state('');

  // UI & Flow States
  let step = $state<'credentials' | 'otp'>('credentials');
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let errorMessage = $state('');
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
      const result = await authStore.signIn({
        email: email.trim(),
        password
      });

      if (result.success) {
        // Ambil target rute sesuai role
        const targetPath = homePathForRole(authStore.role);
        router.navigate(targetPath as `/${string}`);
      } else {
        const errText = result.error?.toLowerCase() || '';

        // Deteksi jika akun membutuhkan verifikasi email / OTP
        if (errText.includes('email not confirmed') || errText.includes('verify') || errText.includes('otp')) {
          step = 'otp';
          startCountdown(60);
          otpErrorMessage = '';
          otpSuccessNotice = 'Silakan masukkan 6 digit kode verifikasi yang dikirimkan ke email Anda.';
        } else if (errText.includes('invalid login credentials')) {
          errorMessage = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        } else if (errText.includes('failed to fetch')) {
          errorMessage = 'Gagal terhubung ke database (Failed to fetch). Pastikan koneksi internet aktif dan variabel database Supabase terisi.';
        } else {
          errorMessage = result.error || 'Gagal masuk. Silakan periksa kredensial Anda.';
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan. Silakan coba lagi.';
      if (msg.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Gagal terhubung ke database (Failed to fetch). Pastikan koneksi internet aktif.';
      } else {
        errorMessage = msg;
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Handle Submit OTP
  async function handleVerifyOtp(codeToVerify?: string) {
    const token = codeToVerify || otpCode;
    if (token.length < 6 || isVerifyingOtp) return;

    isVerifyingOtp = true;
    otpErrorMessage = '';

    try {
      const result = await authStore.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      });

      if (result.success) {
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
    // Jika sudah login sebelumnya, otomatis redirect ke rute role masing-masing
    if (authStore.isAuthenticated) {
      const targetPath = homePathForRole(authStore.role);
      router.navigate(targetPath as `/${string}`);
    }

    // Cek apakah query param membawa pesan butuh OTP
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get('email');
      const needOtp = params.get('verify') === 'true';

      if (prefillEmail) {
        email = prefillEmail;
      }
      if (needOtp && prefillEmail) {
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

<div class="min-h-screen bg-slate-950 lg:grid lg:grid-cols-12 font-sans selection:bg-brand-500 selection:text-white">
  <!-- SISI KIRI: BRANDING & VISUAL SHOWCASE (Visible on Desktop lg+) -->
  <aside class="relative hidden lg:col-span-5 xl:col-span-5 lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 text-white overflow-hidden">
    <!-- Ambient Glow Efek Cahaya Halus -->
    <div class="absolute -top-32 -left-32 size-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" aria-hidden="true"></div>
    <div class="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

    <!-- Top: Brand Logo -->
    <div class="relative z-10">
      <a href="/" class="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl p-1">
        <Logo size="md" />
      </a>
    </div>

    <!-- Center: Content Headline & Live Order Mockup -->
    <div class="relative z-10 my-auto py-8 space-y-6">
      <div class="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-300">
        <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Pusat Kendali Resto &amp; Menu Digital</span>
      </div>

      <div class="space-y-3">
        <h1 class="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Kelola pesanan dapur &amp; menu resto dalam satu sentuhan.
        </h1>
        <p class="text-sm xl:text-base text-slate-300 leading-relaxed max-w-md">
          RestoLink memodernisasi UMKM kuliner Indonesia: website menu instan via subdomain mandiri, pesanan QR meja, dan rekap omzet terpadu tanpa biaya komisi.
        </p>
      </div>

      <!-- Live Order Mockup Card -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-sm space-y-3 max-w-md">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="flex size-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-200">Pesanan Baru • Meja 04</span>
          </div>
          <span class="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            QRIS Terbayar
          </span>
        </div>

        <div class="space-y-2 text-xs text-slate-300">
          <div class="flex justify-between">
            <span>1x Ayam Bakar Madu Spesial</span>
            <span class="font-mono text-slate-400">Rp 32.000</span>
          </div>
          <div class="flex justify-between">
            <span>1x Es Teh Manis Jumbo</span>
            <span class="font-mono text-slate-400">Rp 7.000</span>
          </div>
        </div>

        <div class="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs">
          <span class="font-semibold text-slate-400">Total Pesanan</span>
          <span class="font-mono font-bold text-brand-400 text-sm">Rp 39.000</span>
        </div>
      </div>
    </div>

    <!-- Bottom: Footer Meta & Social Proof -->
    <div class="relative z-10 border-t border-slate-800/80 pt-6">
      <div class="flex items-center gap-2 text-xs text-slate-400">
        <span class="text-amber-400 font-bold">★★★★★</span>
        <span>Dipercaya wirausaha kuliner di berbagai kota di Indonesia.</span>
      </div>
    </div>
  </aside>

  <!-- SISI KANAN: FORMULIR AUTENTIKASI (Clean & Focused) -->
  <main class="lg:col-span-7 xl:col-span-7 flex flex-col justify-between bg-white text-slate-900 min-h-screen px-6 py-8 sm:px-12 sm:py-12 lg:px-16">
    <!-- Top Navigation Header -->
    <div class="flex items-center justify-between w-full max-w-md mx-auto">
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
        Belum punya akun?
        <a href="/daftar" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
          Daftar Gratis
        </a>
      </div>
    </div>

    <!-- Center Content Form Container -->
    <div class="w-full max-w-md mx-auto my-auto py-8">
      {#if step === 'credentials'}
        <!-- ==================== VIEW 1: FORM LOGIN ==================== -->
        <div>
          <!-- Title & Subtitle -->
          <div class="space-y-2">
            <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
              Portal Pemilik Usaha
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Masuk ke Akun Anda
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kelola menu digital, stok bahan, dan antrean pesanan dalam satu dashboard.
            </p>
          </div>

          <!-- Error Alert Banner -->
          {#if errorMessage}
            <div
              role="alert"
              class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-in fade-in duration-200"
            >
              <svg class="size-5 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="flex-1">
                <p class="font-bold">Gagal Masuk</p>
                <p class="mt-0.5 text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          {/if}

          <!-- Form Inputs -->
          <form onsubmit={handleSubmit} class="mt-6 space-y-4" novalidate>
            <!-- 1. Email -->
            <div>
              <label for="email" class="block text-xs font-semibold text-slate-700">
                Email Terdaftar <span class="text-rose-500">*</span>
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
                  Kata Sandi <span class="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  class="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                  onclick={() => (isForgotPasswordModalOpen = true)}
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

          <!-- Toggle Bantuan Verifikasi OTP Manual -->
          <div class="mt-4 text-center">
            <button
              type="button"
              onclick={() => {
                step = 'otp';
                startCountdown(60);
              }}
              class="text-xs text-slate-500 hover:text-brand-600 transition-colors"
            >
              Sudah menerima kode verifikasi OTP? <span class="font-semibold underline">Verifikasi di sini</span>
            </button>
          </div>

          <!-- Mobile Only Register Link -->
          <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600 sm:hidden">
            Belum memiliki website toko?
            <a href="/daftar" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">
              Daftar Gratis 30 Hari &rarr;
            </a>
          </div>
        </div>
      {:else}
        <!-- ==================== VIEW 2: FORM VERIFIKASI OTP ==================== -->
        <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
          <!-- Back button to credentials -->
          <button
            type="button"
            onclick={() => {
              step = 'credentials';
              otpErrorMessage = '';
            }}
            class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors rounded p-1"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Ganti Akun / Kembali</span>
          </button>

          <!-- OTP Header -->
          <div class="text-center sm:text-left space-y-2">
            <div class="size-12 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 mb-2">
              <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Verifikasi Kode OTP
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kami telah mengirimkan 6 digit kode keamanan ke email:
              <strong class="text-slate-900 block mt-0.5">{email || 'email Anda'}</strong>
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
              {isVerifyingOtp ? 'Memverifikasi Kode...' : 'Verifikasi & Masuk'}
            </Button>

            <!-- Resend Countdown -->
            <div class="text-center text-xs text-slate-600">
              {#if resendCountdown > 0}
                <span>Kirim ulang kode dalam <strong class="font-mono text-brand-600">{resendCountdown}s</strong></span>
              {:else}
                <span>Tidak menerima kode?</span>
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
    <div class="w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400 border-t border-slate-100">
      &copy; 2026 RestoLink Platform. Hak Cipta Dilindungi.
    </div>
  </main>
</div>

<!-- Modal Bantuan Lupa Kata Sandi -->
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
        Sertakan nama usaha, alamat email terdaftar, dan nama subdomain toko Anda saat mengirim permintaan pemulihan.
      </p>
    </div>

    <div class="pt-3 flex justify-end">
      <Button size="sm" variant="secondary" onclick={() => (isForgotPasswordModalOpen = false)}>
        Tutup
      </Button>
    </div>
  </div>
</Modal>
