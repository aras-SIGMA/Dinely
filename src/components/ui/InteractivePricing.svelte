<script lang="ts">
  import { onMount } from 'svelte';
  import confetti from 'canvas-confetti';
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';

  export type Feature = {
    name: string;
    included: boolean;
  };

  export type PricingPlan = {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: Feature[];
    popular?: boolean;
    badge?: string;
    buttonText: string;
    buttonHref?: string;
    disabled?: boolean;
  };

  type ComparisonRow = {
    label: string;
    mikro: boolean | string;
    kecil: boolean | string;
    menengah: boolean | string;
  };

  type ComparisonGroup = {
    title: string;
    rows: ComparisonRow[];
  };

  type Props = {
    plans?: PricingPlan[];
    defaultBillingCycle?: 'monthly' | 'annual';
    annualDiscount?: number;
    showComparison?: boolean;
    class?: string;
  };

  const defaultPlans: PricingPlan[] = [
    {
      id: 'mikro',
      name: 'Paket Mikro',
      description: 'Paling pas untuk booth, gerobak, kedai kopi, dan warung makan mandiri.',
      monthlyPrice: 49000,
      annualPrice: 499000,
      popular: true,
      badge: 'Paling Diminati UMKM',
      buttonText: 'Mulai Trial 30 Hari Gratis',
      buttonHref: '/daftar',
      disabled: false,
      features: [
        { name: 'Website menu digital subdomain mandiri', included: true },
        { name: 'Katalog menu & kategori tanpa batas', included: true },
        { name: 'Optimasi kompresi foto WebP otomatis (-93%)', included: true },
        { name: 'Pemesanan QR Code meja (Guest Checkout)', included: true },
        { name: 'Layar antrean dapur sinkron real-time', included: true },
        { name: 'Kendali stok instan (Tersedia / Habis)', included: true },
        { name: 'Cetak QR Code meja siap pakai', included: true },
        { name: '0% potongan komisi penjualan', included: true },
        { name: 'Multi-akun kasir / staf terpisah', included: false },
        { name: 'Kitchen Display System (KDS) koki', included: false }
      ]
    },
    {
      id: 'kecil',
      name: 'Paket Kecil',
      description: 'Untuk kedai & kafe yang mulai berkembang dengan staf kasir tambahan.',
      monthlyPrice: 99000,
      annualPrice: 999000,
      popular: false,
      badge: 'Segera Hadir',
      buttonText: 'Segera Hadir',
      buttonHref: '#harga',
      disabled: true,
      features: [
        { name: 'Semua fitur Paket Mikro', included: true },
        { name: 'Hingga 3 akun staf & kasir terpisah', included: true },
        { name: 'Manajemen voucher promo & diskon toko', included: true },
        { name: 'Laporan penjualan terekap per shift kasir', included: true },
        { name: 'Prioritas bantuan teknis WhatsApp', included: true },
        { name: 'Dukungan multi-perangkat kasir', included: true },
        { name: 'Kitchen Display System (KDS) koki', included: false },
        { name: 'Denah meja visual interaktif', included: false }
      ]
    },
    {
      id: 'menengah',
      name: 'Paket Menengah',
      description: 'Untuk restoran berkapasitas besar dengan banyak meja dan multi-kategori.',
      monthlyPrice: 199000,
      annualPrice: 1999000,
      popular: false,
      badge: 'Segera Hadir',
      buttonText: 'Segera Hadir',
      buttonHref: '#harga',
      disabled: true,
      features: [
        { name: 'Semua fitur Paket Kecil', included: true },
        { name: 'Akun staf & kasir tanpa batas', included: true },
        { name: 'Denah & pengelolaan meja visual interaktif', included: true },
        { name: 'Kitchen Display System (KDS) khusus koki', included: true },
        { name: 'Manajemen inventaris bahan baku dasar', included: true },
        { name: 'Dedicated account manager & audit sistem', included: true },
        { name: 'Prioritas update fitur & SLA 99.9%', included: true }
      ]
    }
  ];

  const comparisonGroups: ComparisonGroup[] = [
    {
      title: 'Etalase & Menu Digital',
      rows: [
        { label: 'Website Subdomain Mandiri (*.restolink.site)', mikro: true, kecil: true, menengah: true },
        { label: 'Jumlah Menu & Kategori', mikro: 'Tanpa Batas', kecil: 'Tanpa Batas', menengah: 'Tanpa Batas' },
        { label: 'Optimasi Foto WebP Otomatis', mikro: true, kecil: true, menengah: true },
        { label: 'Kendali Stok Menu Instan (Tersedia / Habis)', mikro: true, kecil: true, menengah: true },
        { label: 'Tombol Kontak CS WhatsApp Otomatis', mikro: true, kecil: true, menengah: true }
      ]
    },
    {
      title: 'Pemesanan & Alur Dapur',
      rows: [
        { label: 'Guest Checkout (Pesan Tanpa Perlu Daftar)', mikro: true, kecil: true, menengah: true },
        { label: 'Cetak QR Code Standee Meja', mikro: true, kecil: true, menengah: true },
        { label: 'Dashboard Antrean Dapur Terpusat', mikro: true, kecil: true, menengah: true },
        { label: 'Alur Status: Baru → Diproses → Selesai', mikro: true, kecil: true, menengah: true },
        { label: 'Kitchen Display System (Layar Koki Terpisah)', mikro: false, kecil: false, menengah: true }
      ]
    },
    {
      title: 'Operasional & Bisnis',
      rows: [
        { label: 'Potongan Komisi Pesanan', mikro: '0%', kecil: '0%', menengah: '0%' },
        { label: 'Akun Akses Staf / Kasir', mikro: '1 Pemilik', kecil: '3 Akun Staf', menengah: 'Tanpa Batas' },
        { label: 'Pengelolaan Diskon & Voucher Promo', mikro: false, kecil: true, menengah: true },
        { label: 'Denah Meja Interaktif', mikro: 'Input Nomor Meja', kecil: 'Input Nomor Meja', menengah: 'Denah Visual' },
        { label: 'Metode Pembayaran Tagihan', mikro: 'Midtrans VA / QRIS', kecil: 'Midtrans VA / QRIS', menengah: 'Midtrans VA / QRIS' }
      ]
    }
  ];

  let {
    plans = defaultPlans,
    defaultBillingCycle = 'monthly',
    annualDiscount = 15,
    showComparison = true,
    class: className = ''
  }: Props = $props();

  let billingCycle = $state<'monthly' | 'annual'>('monthly');
  let activeTab = $state<'pricing' | 'comparison'>('pricing');
  let hasClickedAnnual = $state(false);
  let isRolling = $state(false);
  let rollDirection = $state<'up' | 'down'>('up');

  // Mobile comparison: short plan labels for the sticky scroll hint
  const mobilePlanLabels: Record<string, string> = {
    mikro: 'Mikro',
    kecil: 'Kecil',
    menengah: 'Menengah'
  };

  // Aggregate coverage per plan for the mobile inline badge
  const planCoverage = $derived.by(() => {
    const totals: Record<string, { covered: number; total: number }> = {};
    plans.forEach((p) => {
      totals[p.id] = { covered: 0, total: 0 };
    });
    comparisonGroups.forEach((group) => {
      group.rows.forEach((row) => {
        plans.forEach((p) => {
          const value = row[p.id as 'mikro' | 'kecil' | 'menengah'];
          if (value === undefined) return;
          totals[p.id].total += 1;
          if (value === true || typeof value === 'string') totals[p.id].covered += 1;
        });
      });
    });
    return totals;
  });

  let monthlyBtnEl = $state<HTMLButtonElement | null>(null);
  let annualBtnEl = $state<HTMLButtonElement | null>(null);
  let pillStyle = $state({ left: 4, width: 120 });

  function updatePill() {
    const target = billingCycle === 'monthly' ? monthlyBtnEl : annualBtnEl;
    if (target) {
      pillStyle = {
        left: target.offsetLeft,
        width: target.offsetWidth
      };
    }
  }

  $effect(() => {
    if (defaultBillingCycle) {
      billingCycle = defaultBillingCycle;
    }
  });

  $effect(() => {
    // Recompute pill position when cycle changes
    billingCycle;
    updatePill();
  });

  onMount(() => {
    updatePill();
    window.addEventListener('resize', updatePill);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(updatePill);
    }
    return () => {
      window.removeEventListener('resize', updatePill);
    };
  });

  function formatRp(val: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  }

  function handleCycleChange(next: 'monthly' | 'annual') {
    if (next === 'annual') {
      hasClickedAnnual = true;
    }
    if (billingCycle === next) return;
    rollDirection = next === 'annual' ? 'up' : 'down';
    isRolling = true;
    billingCycle = next;
    setTimeout(() => {
      isRolling = false;
    }, 320);

    setTimeout(() => {
      updatePill();
    }, 10);

    if (next === 'annual' && typeof window !== 'undefined') {
      const rect = annualBtnEl?.getBoundingClientRect();
      if (rect) {
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: 75,
          spread: 75,
          origin: { x: originX, y: originY },
          colors: ['#ea580c', '#f97316', '#fb923c', '#0f172a', '#10b981'],
          ticks: 240,
          gravity: 1.15,
          decay: 0.94,
          startVelocity: 28,
          disableForReducedMotion: true
        });
      }
    }
  }
</script>

<section
  id="harga"
  class="relative overflow-hidden border-t border-slate-200/80 bg-white py-20 sm:py-28 {className}"
  aria-labelledby="pricing-headline"
>
  <!-- Ambient Soft Radial Glow -->
  <div
    class="pointer-events-none absolute inset-x-0 top-12 -z-10 flex items-start justify-center overflow-hidden"
    aria-hidden="true"
  >
    <div
      class="h-[460px] w-[860px] rounded-full bg-gradient-to-tr from-brand-100/40 via-amber-100/25 to-orange-100/30 opacity-70 blur-3xl"
    ></div>
  </div>

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mx-auto max-w-3xl text-center">
      <AnimatedContent distance={20} duration={0.5}>
        <div
          class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950"
        >
          PAKET &amp; BIAYA
        </div>
      </AnimatedContent>

      <AnimatedContent distance={30} duration={0.6} delay={0.1}>
        <h2
          id="pricing-headline"
          class="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
        >
          Bayar Fitur Menu &amp; Dapur, <span class="text-brand-600">Bukan Komisi Penjualan.</span>
        </h2>
      </AnimatedContent>

      <AnimatedContent distance={24} duration={0.6} delay={0.2}>
        <p class="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
          Semua paket 100% bebas biaya komisi per pesanan. Mulai uji coba gratis 30 hari tanpa kartu
          kredit, upgrade kapan saja saat usaha Anda berkembang.
        </p>
      </AnimatedContent>

      <!-- Billing Cycle Toggle (Sliding Pill + Confetti on Annual) -->
      <div class="mt-8 flex justify-center">
        <div
          class="relative inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner"
        >
          <!-- Sliding Indicator Pill -->
          <span
            class="pointer-events-none absolute top-1 bottom-1 rounded-full bg-slate-950 shadow-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style="left: {pillStyle.left}px; width: {pillStyle.width}px;"
            aria-hidden="true"
          ></span>

          <button
            bind:this={monthlyBtnEl}
            type="button"
            onclick={() => handleCycleChange('monthly')}
            class="relative z-10 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 {billingCycle ===
            'monthly'
              ? 'text-white'
              : 'text-slate-600 hover:text-slate-950'}"
          >
            Tagihan Bulanan
          </button>

          <button
            bind:this={annualBtnEl}
            type="button"
            onclick={() => handleCycleChange('annual')}
            class="relative z-10 flex items-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 {billingCycle ===
            'annual'
              ? 'text-white'
              : 'text-slate-600 hover:text-slate-950'}"
          >
            <span>Tagihan Tahunan</span>
            {#if hasClickedAnnual}
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide transition-all duration-300 {billingCycle ===
                'annual'
                  ? 'bg-brand-500 text-white'
                  : 'bg-brand-50 text-brand-700 border border-brand-200/80'}"
              >
                Hemat {annualDiscount}%
              </span>
            {/if}
          </button>
        </div>
      </div>

      <!-- Tab Navigation (Pricing vs Comparison) -->
      {#if showComparison}
        <div class="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Pilihan tampilan harga atau perbandingan fitur"
            class="inline-flex items-center rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-inner"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pricing'}
              onclick={() => (activeTab = 'pricing')}
              class="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all {activeTab ===
              'pricing'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'}"
            >
              Pilihan Paket
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'comparison'}
              onclick={() => (activeTab = 'comparison')}
              class="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all {activeTab ===
              'comparison'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'}"
            >
              Bandingkan Semua Fitur
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Main Content: Pricing Cards View -->
    {#if !showComparison || activeTab === 'pricing'}
      <div
        class="mt-14 grid max-w-7xl mx-auto grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 animate-tab-appear"
      >
        {#each plans as plan, index (plan.id)}
          {@const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}
          {@const monthlyEquiv = Math.round(plan.annualPrice / 12)}

          <AnimatedContent distance={50} duration={0.6} delay={index * 0.15} class="flex w-full">
            <div
              class="relative flex w-full flex-col justify-between rounded-3xl border bg-white p-7 sm:p-8 transition-all duration-300 hover:shadow-xl {plan.popular
                ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-xl shadow-brand-500/10 lg:-translate-y-2 lg:scale-[1.02] z-10'
                : 'border-slate-200/90 shadow-sm hover:border-slate-300'}"
            >
              <!-- Popular Badge Floating on Top -->
              {#if plan.popular && plan.badge}
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-brand-600/30 tracking-wide uppercase"
                  >
                    <svg class="size-3.5 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{plan.badge}</span>
                  </span>
                </div>
              {/if}

              <div>
                <!-- Card Header -->
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-display text-xl sm:text-2xl font-bold text-slate-950">
                    {plan.name}
                  </h3>
                  {#if !plan.popular && plan.badge}
                    <span
                      class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500"
                    >
                      {plan.badge}
                    </span>
                  {/if}
                </div>

                <p class="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed min-h-[42px]">
                  {plan.description}
                </p>

                <!-- Price Section (Animated Roll on Cycle Change) -->
                <div class="mt-6 border-b border-slate-100 pb-6">
                  <div class="flex items-baseline gap-1.5 overflow-hidden">
                    <span class="text-sm font-bold text-slate-500">IDR</span>
                    <div class="relative overflow-hidden font-display text-4xl sm:text-5xl font-black tracking-tight text-slate-950 tabular-nums">
                      {#key price}
                        <span
                          class="inline-block transition-transform duration-250 {isRolling
                            ? rollDirection === 'up'
                              ? 'animate-price-roll-up'
                              : 'animate-price-roll-down'
                            : ''}"
                        >
                          {formatRp(price).replace('Rp', '').trim()}
                        </span>
                      {/key}
                    </div>
                    <span class="text-xs sm:text-sm text-slate-500 font-medium">
                      /{billingCycle === 'annual' ? 'tahun' : 'bulan'}
                    </span>
                  </div>

                  <div class="mt-2 min-h-[22px] overflow-hidden">
                    {#key billingCycle}
                      {#if billingCycle === 'annual'}
                        <div class="text-xs text-brand-700 font-medium animate-slide-in-up">
                          Tagihan tahunan &middot; Setara <strong>{formatRp(monthlyEquiv)}/bln</strong> (Hemat ~{annualDiscount}%)
                        </div>
                      {:else}
                        <div class="text-xs text-slate-400 animate-slide-in-up">
                          Ditagih bulanan, batalkan kapan saja tanpa denda
                        </div>
                      {/if}
                    {/key}
                  </div>
                </div>

                <!-- Features List -->
                <div class="mt-6">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Fitur yang didapatkan:
                  </p>
                  <ul class="space-y-3" role="list">
                    {#each plan.features as feature}
                      <li class="flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
                        {#if feature.included}
                          <div
                            class="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
                          >
                            <svg
                              class="size-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="3"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <span class="text-slate-800 font-medium">{feature.name}</span>
                        {:else}
                          <div
                            class="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300"
                          >
                            <svg
                              class="size-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </div>
                          <span class="text-slate-400">{feature.name}</span>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>

              <!-- Card Action Button -->
              <div class="mt-8 pt-4">
                {#if plan.disabled}
                  <button
                    type="button"
                    disabled
                    class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
                  >
                    {plan.buttonText}
                  </button>
                {:else}
                  <a
                    href={plan.buttonHref || '/daftar'}
                    class="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    <span>{plan.buttonText}</span>
                    <svg
                      class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                {/if}
              </div>
            </div>
          </AnimatedContent>
        {/each}
      </div>
    {:else}
      <!-- Comparison Table View -->
      <div
        class="mt-8 sm:mt-12 max-w-5xl mx-auto animate-tab-appear rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-sm"
      >
        <!-- Mobile Horizontal Scroll Hint (sticky under navbar) -->
        <div
          class="sticky top-[68px] z-30 flex sm:hidden items-center gap-3 px-3 py-2 bg-white/95 backdrop-blur border-b border-slate-200 rounded-t-2xl"
        >
          <span class="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7l-4 5 4 5M16 7l4 5-4 5M12 4v16" />
            </svg>
            Geser
          </span>
          {#each plans as plan}
            <span
              class="min-w-0 flex-1 truncate text-center text-[10px] font-bold rounded-full px-1.5 py-1 {plan.popular
                ? 'bg-brand-100 text-brand-700'
                : 'bg-slate-100 text-slate-600'}"
            >
              {mobilePlanLabels[plan.id] ?? plan.name}
            </span>
          {/each}
        </div>

        <div class="overflow-x-auto overscroll-x-contain rounded-b-2xl">
          <table class="w-full min-w-[520px] sm:min-w-[620px] border-collapse text-left text-xs sm:text-sm">
            <caption class="sr-only">Tabel Perbandingan Fitur Paket RestoLink</caption>
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/70">
                <th
                  scope="col"
                  class="sticky left-0 z-20 w-[42%] sm:w-auto bg-slate-50 px-3 sm:px-6 py-3.5 sm:py-5 font-bold text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.10)]"
                >
                  Fitur
                </th>
                {#each plans as plan}
                  {@const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                  <th
                    scope="col"
                    class="px-2 sm:px-5 py-3 sm:py-5 text-center min-w-[92px] sm:min-w-[150px] {plan.popular
                      ? 'bg-brand-50/40 text-brand-700 font-bold'
                      : 'text-slate-800 font-semibold'}"
                  >
                    <div class="space-y-0.5 sm:space-y-1">
                      <div class="text-[11px] sm:text-sm font-bold leading-tight">{plan.name}</div>
                      <div class="font-display text-[13px] sm:text-lg font-black text-slate-950 overflow-hidden">
                        {#key price}
                          <span
                            class="inline-block transition-transform duration-250 {isRolling
                              ? rollDirection === 'up'
                                ? 'animate-price-roll-up'
                                : 'animate-price-roll-down'
                              : ''}"
                          >
                            {formatRp(price)}
                          </span>
                        {/key}
                      </div>
                      <div class="text-[9px] sm:text-[11px] text-slate-400 font-normal">
                        /{billingCycle === 'annual' ? 'tahun' : 'bulan'}
                      </div>
                      <!-- Mobile coverage summary -->
                      {#if planCoverage[plan.id]}
                        <div class="sm:hidden mt-0.5 text-[9px] font-semibold text-slate-500">
                          {planCoverage[plan.id].covered}/{planCoverage[plan.id].total} fitur
                        </div>
                      {/if}
                    </div>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each comparisonGroups as group}
                <tr class="bg-slate-100/50">
                  <th
                    colspan="4"
                    scope="colgroup"
                    class="sticky left-0 px-3 sm:px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-700 border-t border-slate-200"
                  >
                    {group.title}
                  </th>
                </tr>
                {#each group.rows as row}
                  <tr class="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <th
                      scope="row"
                      class="sticky left-0 z-20 bg-white px-3 sm:px-6 py-2.5 sm:py-3.5 text-[11px] sm:text-xs font-medium text-slate-800 w-[42%] sm:w-auto shadow-[2px_0_6px_-2px_rgba(0,0,0,0.10)]"
                    >
                      {row.label}
                    </th>

                    <!-- Paket Mikro -->
                    <td class="px-2 sm:px-5 py-2.5 sm:py-3.5 text-center bg-brand-50/20 font-medium text-brand-900 text-xs sm:text-sm">
                      {#if row.mikro === true}
                        <svg
                          class="size-4 sm:size-4.5 mx-auto text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2.5"
                          aria-label="Tercakup"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      {:else if row.mikro === false}
                        <span class="text-slate-300 font-bold" aria-label="Tidak tercakup">—</span>
                      {:else}
                        <span>{row.mikro}</span>
                      {/if}
                    </td>

                    <!-- Paket Kecil -->
                    <td class="px-2 sm:px-5 py-2.5 sm:py-3.5 text-center text-slate-600 text-xs sm:text-sm">
                      {#if row.kecil === true}
                        <svg
                          class="size-4 sm:size-4.5 mx-auto text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2.5"
                          aria-label="Tercakup"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      {:else if row.kecil === false}
                        <span class="text-slate-300 font-bold" aria-label="Tidak tercakup">—</span>
                      {:else}
                        <span>{row.kecil}</span>
                      {/if}
                    </td>

                    <!-- Paket Menengah -->
                    <td class="px-2 sm:px-5 py-2.5 sm:py-3.5 text-center text-slate-600 text-xs sm:text-sm">
                      {#if row.menengah === true}
                        <svg
                          class="size-4 sm:size-4.5 mx-auto text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2.5"
                          aria-label="Tercakup"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      {:else if row.menengah === false}
                        <span class="text-slate-300 font-bold" aria-label="Tidak tercakup">—</span>
                      {:else}
                        <span>{row.menengah}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Footer Note -->
    <div class="mx-auto mt-14 max-w-2xl text-center">
      <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
        Semua paket mencakup <strong>uji coba 30 hari gratis</strong>. Tanpa kartu kredit. Bebas
        berhenti atau mengubah paket kapan saja tanpa biaya tersembunyi.
      </p>
    </div>
  </div>
</section>

<style>
  @keyframes tabAppear {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-tab-appear {
    animation: tabAppear 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Slim, unobtrusive horizontal scrollbar for the mobile comparison table */
  .overflow-x-auto {
    scrollbar-width: thin;
  }
  .overflow-x-auto::-webkit-scrollbar {
    height: 5px;
  }
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 9999px;
  }

  /* Fade cue on the right edge to signal more columns on mobile */
  @media (max-width: 639px) {
    .overflow-x-auto {
      mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent 100%);
    }
  }
</style>
