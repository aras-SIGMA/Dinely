<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import SplitText from '@/components/ui/SplitText.svelte';
  import StoryScroll from '@/components/ui/StoryScroll.svelte';
  import FlowSection from '@/components/ui/FlowSection.svelte';
  import TestimonialsSection from '@/components/ui/TestimonialsSection.svelte';
  import InteractivePricing from '@/components/ui/InteractivePricing.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';
  import { uiStore } from '@/stores/ui.svelte';

  // ===========================================================================
  // HERO PINNED SCROLLYTELLING STATE
  // ===========================================================================
  let scrollY = $state(0);
  let windowHeight = $state(800);
  let prefersReducedMotion = $state(false);

  function updateScrollMetrics() {
    if (typeof window !== 'undefined') {
      scrollY = window.scrollY;
      windowHeight = window.innerHeight;
    }
  }

  onMount(() => {
    prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    updateScrollMetrics();
    window.addEventListener('scroll', updateScrollMetrics, { passive: true });
    window.addEventListener('resize', updateScrollMetrics, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollMetrics);
      window.removeEventListener('resize', updateScrollMetrics);
    };
  });

  // Calculate scroll progress from 0.0 (top) to 1.0 (mockup animation completed & held)
  const heroProgress = $derived.by(() => {
    if (prefersReducedMotion) return 1;
    const scrollMax = windowHeight * 1.4;
    if (scrollMax <= 0) return 0;
    return Math.max(0, Math.min(1, scrollY / scrollMax));
  });

  // Derived animation phases
  const headlineOpacity = $derived(
    prefersReducedMotion ? 1 : Math.max(0, 1 - (heroProgress / 0.22))
  );
  const headlineTranslateY = $derived(
    prefersReducedMotion ? 0 : -(heroProgress / 0.22) * 44
  );

  const stageRise = $derived(
    prefersReducedMotion ? 1 : Math.min(1, Math.max(0, heroProgress / 0.28))
  );
  const stageTranslateY = $derived(
    prefersReducedMotion ? 0 : (1 - stageRise) * 110
  );

  // Spread and untwist progress: 0.28 -> 0.78 (leaves 0.78 -> 1.00 completely static & held)
  const spreadProgress = $derived(
    prefersReducedMotion ? 1 : Math.min(1, Math.max(0, (heroProgress - 0.28) / 0.50))
  );

  // Mobile Stack Swipe state
  let activeMobileCard = $state<number>(1); // default to center QR
  let touchStartX = $state(0);

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) {
      activeMobileCard = activeMobileCard === 0 ? 2 : activeMobileCard - 1;
    } else if (deltaX < -40) {
      activeMobileCard = (activeMobileCard + 1) % 3;
    }
  }

  const mobileMockupMeta = [
    { id: 'menu' as const, title: 'Menu Tamu & Katalog', tag: 'Sisi Pelanggan' },
    { id: 'qr' as const, title: 'Standee QR Code Meja', tag: 'Dine-In' },
    { id: 'kitchen' as const, title: 'Antrean Dapur Real-Time', tag: 'Koki Resto' }
  ];

  // ===========================================================================
  // FAQ MODULE STATE
  // ===========================================================================
  let openFaqIndex = $state<number | null>(0);

  function toggleFaq(index: number) {
    openFaqIndex = openFaqIndex === index ? null : index;
  }

  const faqs = [
    {
      q: 'Apakah butuh kartu kredit untuk mencoba masa trial 30 hari?',
      a: 'Sama sekali tidak. Anda bisa mendaftar dan langsung menggunakan seluruh fitur Paket Mikro gratis selama 30 hari tanpa perlu memasukkan informasi kartu kredit atau pembayaran apa pun.'
    },
    {
      q: 'Apakah RestoLink mengambil potongan komisi dari setiap pesanan pelanggan?',
      a: 'Tidak ada potongan komisi (0%). Semua uang pembayaran dari pelanggan adalah 100% milik usaha Anda, berbeda dari aplikasi ojek online yang memotong 20% atau lebih.'
    },
    {
      q: 'Bagaimana cara pembayaran setelah masa uji coba 30 hari selesai?',
      a: 'Anda dapat melanjutkan langganan melalui dashboard dengan metode pembayaran resmi via Midtrans (QRIS, GoPay, ShopeePay, serta Virtual Account BCA, Mandiri, BNI, dan BRI).'
    },
    {
      q: 'Apakah saya bisa mengganti nama subdomain usaha setelah terdaftar?',
      a: 'Nama subdomain dipilih saat pertama kali mendaftar. Jika ada kebutuhan perubahan khusus, Anda dapat menghubungi tim bantuan RestoLink untuk asistensi.'
    },
    {
      q: 'Apakah ada kontrak jangka panjang atau denda jika berhenti berlangganan?',
      a: 'Tidak ada ikatan kontrak. Anda bebas memilih perpanjangan bulanan atau tahunan, dan dapat menghentikan langganan kapan saja tanpa penalti.'
    }
  ];

  // State for hiding navbar during fullscreen StoryScroll
  let isStoryScrollActive = $state(false);

  function handleHeroDropdownClick(tier: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('restolink:tier-change', { detail: { tier } }));
    }
  }
</script>

<svelte:window bind:scrollY={scrollY} bind:innerHeight={windowHeight} />

<div class="flex min-h-screen flex-col bg-white text-slate-900">
  <Navbar hidden={isStoryScrollActive} />

  <main class="flex-1">
    <!-- ======================================================================= -->
    <!-- 1. HERO PINNED SCROLLYTELLING + CURTAIN OVERLAY CONTAINER               -->
    <!-- ======================================================================= -->
    <div class="relative w-full">
      <!-- Sticky Full-Height Viewport Window -->
      <section
        class="{prefersReducedMotion
          ? 'relative py-8'
          : 'sticky top-0 h-[100svh] overflow-hidden'} w-full relative flex flex-col items-center justify-center pt-8 sm:pt-10 pb-0 z-10"
      >
        <!-- Ambient Warm Subtle Grid & Radial Glow -->
        <div class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div class="h-[520px] w-[860px] rounded-full bg-gradient-to-tr from-brand-100/50 via-amber-100/30 to-orange-100/40 blur-3xl opacity-75"></div>
        </div>

        <!-- A. CENTERED EDITORIAL HERO HEADLINE (Fades & slides up on scroll) -->
        <div
          class="relative z-20 mx-auto max-w-4xl text-center px-4 sm:px-6 lg:px-8 my-auto transition-transform duration-75 ease-out"
          style="opacity: {headlineOpacity}; transform: translateY({headlineTranslateY}px); pointer-events: {heroProgress > 0.22 ? 'none' : 'auto'};"
        >
          <!-- Main Title with Staggered SplitText Reveal -->
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
            <SplitText
              text="Website Menu Digital Mandiri,"
              splitType="chars"
              delay={25}
              duration={0.7}
              ready={uiStore.isAppReady}
            />
            <span class="text-brand-600 block sm:inline">
              <SplitText
                text="Terkelola dari Satu Dashboard."
                splitType="chars"
                delay={25}
                baseDelay={25 * 30}
                duration={0.7}
                ready={uiStore.isAppReady}
              />
            </span>
          </h1>

          <!-- Description -->
          <p class="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
            Beri pelanggan kemudahan melihat menu dan memesan langsung via browser di subdomain unik usaha Anda.
            Tanpa unduh aplikasi, tanpa potongan komisi 20% ojek online.
          </p>

          <!-- Call to Action Buttons -->
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="/daftar" class="w-full sm:w-auto">
              <Button size="lg" full>
                Mulai Trial 30 Hari Gratis
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </a>
            <!-- Interactive Hardware Button with Hover Preview Dropdown -->
            <div class="relative w-full sm:w-auto group">
              <a href="/hardware" class="w-full sm:w-auto inline-block">
                <Button size="lg" variant="secondary" full>
                  <svg class="size-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Kebutuhan Hardware</span>
                  <svg class="size-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
                  </svg>
                </Button>
              </a>

              <!-- Dropdown Hover Preview Card -->
              <div
                class="absolute left-1/2 -translate-x-1/2 top-full pt-2.5 z-40 w-80 max-w-[92vw] transition-all duration-200 pointer-events-none group-hover:pointer-events-auto opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
              >
                <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15 text-left ring-1 ring-slate-900/5">
                  <div class="px-2.5 pb-2 pt-1 border-b border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Skala Usaha</span>
                    <span class="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Preview Alat</span>
                  </div>

                  <div class="mt-2 space-y-1">
                    <!-- 1. Mikro -->
                    <a
                      href="/hardware?tier=mikro"
                      onclick={() => handleHeroDropdownClick('mikro')}
                      class="flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-brand-50/70 group/tier"
                    >
                      <div class="size-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover/tier:bg-brand-600 group-hover/tier:text-white transition-colors duration-150">
                        <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-bold text-slate-900 group-hover/tier:text-brand-700">Usaha Mikro</span>
                          <span class="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">1 HP</span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5 truncate">1 unit Smartphone (Modal Rp0)</p>
                      </div>
                    </a>

                    <!-- 2. Kecil -->
                    <a
                      href="/hardware?tier=kecil"
                      onclick={() => handleHeroDropdownClick('kecil')}
                      class="flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-brand-50/70 group/tier"
                    >
                      <div class="size-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover/tier:bg-brand-600 group-hover/tier:text-white transition-colors duration-150">
                        <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-bold text-slate-900 group-hover/tier:text-brand-700">Usaha Kecil</span>
                          <span class="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">5 Item</span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5 truncate">Tablet, Printer Struk & HP Staf</p>
                      </div>
                    </a>

                    <!-- 3. Menengah -->
                    <a
                      href="/hardware?tier=menengah"
                      onclick={() => handleHeroDropdownClick('menengah')}
                      class="flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-brand-50/70 group/tier"
                    >
                      <div class="size-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover/tier:bg-brand-600 group-hover/tier:text-white transition-colors duration-150">
                        <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-bold text-slate-900 group-hover/tier:text-brand-700">Usaha Menengah</span>
                          <span class="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">8 Item</span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5 truncate">POS Station, KDS Dapur & Waiter</p>
                      </div>
                    </a>
                  </div>

                  <a
                    href="/hardware"
                    class="mt-2 block rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    Buka Halaman Panduan Lengkap &rarr;
                  </a>
                </div>
              </div>
            </div>
            <a href="#harga" class="w-full sm:w-auto">
              <Button size="lg" variant="ghost" full>
                Skema Harga
              </Button>
            </a>
          </div>

          <!-- Trust Badges -->
          <div class="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
            <div class="flex items-center gap-1.5">
              <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Subdomain Toko Aktif Seketika</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>0% Potongan Komisi Pesanan</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Setup Cepat &lt; 5 Menit</span>
            </div>
          </div>
        </div>

        <!-- B. THE CENTERPIECE SHOWCASE STAGE (Rises & untwists directly on marquee baseline) -->
        <div
          class="absolute bottom-[44px] sm:bottom-[48px] inset-x-0 z-10 w-full flex flex-col items-center justify-end overflow-visible pt-6 pb-0 pointer-events-auto transition-transform duration-75 ease-out"
          style="transform: translateY({stageTranslateY}%); will-change: transform;"
        >
          <!-- Prominent Solid Brand Orange Semicircle Arch Backdrop (Enlarged & Bold) -->
          <div
            class="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full bg-gradient-to-b from-brand-500 via-brand-500 to-brand-600 shadow-[0_25px_65px_rgba(234,88,12,0.42)] border-t-2 border-x-2 border-brand-400/40 z-0 transition-all duration-200"
            style="width: min(98vw, {560 + spreadProgress * 480}px); height: {340 + spreadProgress * 260}px;"
            aria-hidden="true"
          ></div>

          <!-- DESKTOP TRIO VIEW (Hidden on mobile < 1024px, Spread & Untwist on >= 1024px) -->
          <div class="relative z-10 hidden lg:flex items-end justify-center w-full max-w-5xl mb-8 gap-8 xl:gap-12">
            <!-- 1. IPHONE 14 PRO KIRI (Menu Digital) -->
            <div
              class="relative shrink-0 w-[240px] xl:w-[265px] h-[520px] xl:h-[575px] z-10 transition-all duration-200"
              style="transform: translateX({spreadProgress * -40}px) rotate(-7deg); transform-origin: bottom center; will-change: transform;"
            >
              <div class="h-full w-full rounded-[44px] border-[7px] border-slate-900 bg-white shadow-[0_22px_45px_-10px_rgba(0,0,0,0.32),0_10px_20px_-6px_rgba(0,0,0,0.18)] hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.42),0_14px_25px_-6px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col ring-1 ring-slate-800 transition-shadow">
                <!-- Dynamic Island -->
                <div class="h-4.5 w-22 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                  <div class="size-2 rounded-full bg-slate-800 mr-2"></div>
                  <div class="size-1.5 rounded-full bg-slate-700"></div>
                </div>
                <!-- Status Bar -->
                <div class="flex items-center justify-between px-5 pt-1 text-[10px] font-bold text-slate-800">
                  <span>9:41</span>
                  <div class="flex items-center gap-1 text-slate-700">
                    <span class="text-[8px]">5G</span>
                    <svg class="size-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                    <div class="h-2 w-3.5 border border-slate-700 rounded-2xs p-0.5"><div class="h-full w-full bg-slate-800"></div></div>
                  </div>
                </div>
                <!-- Screen Content Placeholder: Menu Tamu -->
                <div class="p-3.5 flex-1 flex flex-col justify-between">
                  <div class="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-mono text-slate-600 flex items-center gap-1 border border-slate-200">
                    <span class="text-emerald-600">●</span>
                    <span class="truncate">dapur-nia.restolink.site</span>
                  </div>
                  <div class="my-auto rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-3 text-center flex flex-col items-center justify-center">
                    <div class="size-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 mb-1.5">
                      <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span class="text-[11px] font-bold text-slate-900">[AREA KATALOG MENU TAMU]</span>
                    <p class="mt-1 text-[9px] text-slate-500 leading-snug">
                      Daftar menu makanan, foto WebP ringan, harga promo, dan tombol + Pesan
                    </p>
                    <span class="mt-2.5 rounded-full bg-brand-600 text-white px-2.5 py-0.5 text-[8.5px] font-bold">
                      Tampilan Pelanggan
                    </span>
                  </div>
                  <div class="w-24 h-1 rounded-full bg-slate-300 mx-auto mt-auto"></div>
                </div>
              </div>
            </div>

            <!-- 2. IPHONE 14 PRO TENGAH (Standee QR Code) -->
            <div
              class="relative shrink-0 w-[260px] xl:w-[285px] h-[560px] xl:h-[615px] z-20 transition-all duration-200"
              style="transform: translateX(0px) rotate(0deg); will-change: transform;"
            >
              <div class="h-full w-full rounded-[48px] border-[8px] border-slate-900 bg-white shadow-[0_26px_55px_-10px_rgba(0,0,0,0.38),0_12px_24px_-6px_rgba(0,0,0,0.22)] hover:shadow-[0_36px_70px_-10px_rgba(0,0,0,0.48),0_16px_28px_-6px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col ring-1 ring-slate-800 transition-shadow">
                <!-- Dynamic Island -->
                <div class="h-5 w-24 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                  <div class="size-2 rounded-full bg-slate-800 mr-2"></div>
                  <div class="size-1.5 rounded-full bg-slate-700"></div>
                </div>
                <!-- Status Bar -->
                <div class="flex items-center justify-between px-6 pt-1 text-[10px] font-bold text-slate-800">
                  <span>9:41</span>
                  <div class="flex items-center gap-1.5 text-slate-700">
                    <span class="text-[9px]">5G</span>
                    <svg class="size-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                    <div class="h-2 w-4 border border-slate-700 rounded-2xs p-0.5"><div class="h-full w-full bg-slate-800"></div></div>
                  </div>
                </div>
                <!-- Screen Content Placeholder: Standee QR Meja -->
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <div class="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                    <span>Meja 04 • Resto Demo</span>
                    <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div class="my-auto rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-4 text-center flex flex-col items-center justify-center">
                    <div class="size-12 rounded-2xl border-2 border-dashed border-amber-500 bg-white flex items-center justify-center text-amber-700 mb-2 shadow-2xs">
                      <svg class="size-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <span class="text-xs sm:text-sm font-extrabold text-slate-900">[AREA STANDEE QR CODE MEJA]</span>
                    <p class="mt-1 text-[10px] text-slate-600 leading-relaxed max-w-[180px]">
                      Tempat penempatan QR Code meja yang dapat di-scan langsung oleh pengunjung tanpa instal aplikasi
                    </p>
                    <span class="mt-3 rounded-full bg-slate-900 text-white px-3 py-0.5 text-[9px] font-bold shadow-xs">
                      Scan Langsung via Kamera
                    </span>
                  </div>
                  <div class="w-28 h-1 rounded-full bg-slate-400 mx-auto mt-auto"></div>
                </div>
              </div>
            </div>

            <!-- 3. IPHONE 14 PRO KANAN (Antrean Dapur) -->
            <div
              class="relative shrink-0 w-[240px] xl:w-[265px] h-[520px] xl:h-[575px] z-10 transition-all duration-200"
              style="transform: translateX({spreadProgress * 40}px) rotate(7deg); transform-origin: bottom center; will-change: transform;"
            >
              <div class="h-full w-full rounded-[44px] border-[7px] border-slate-900 bg-white shadow-[0_22px_45px_-10px_rgba(0,0,0,0.32),0_10px_20px_-6px_rgba(0,0,0,0.18)] hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.42),0_14px_25px_-6px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col ring-1 ring-slate-800 transition-shadow">
                <!-- Dynamic Island -->
                <div class="h-4.5 w-22 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                  <div class="size-2 rounded-full bg-slate-800 mr-2"></div>
                  <div class="size-1.5 rounded-full bg-slate-700"></div>
                </div>
                <!-- Status Bar -->
                <div class="flex items-center justify-between px-5 pt-1 text-[10px] font-bold text-slate-800">
                  <span>9:41</span>
                  <div class="flex items-center gap-1 text-slate-700">
                    <span class="text-[8px]">5G</span>
                    <svg class="size-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                    <div class="h-2 w-3.5 border border-slate-700 rounded-2xs p-0.5"><div class="h-full w-full bg-slate-800"></div></div>
                  </div>
                </div>
                <!-- Screen Content Placeholder: Antrean Dapur -->
                <div class="p-3.5 flex-1 flex flex-col justify-between">
                  <div class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-800 flex items-center justify-between border border-slate-200">
                    <span>Layar Dapur</span>
                    <span class="text-[9px] text-brand-600 font-semibold">Live Sync</span>
                  </div>
                  <div class="my-auto rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/40 p-3 text-center flex flex-col items-center justify-center">
                    <div class="size-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-1.5">
                      <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <span class="text-[11px] font-bold text-slate-900">[AREA ANTREAN DAPUR PEMILIK]</span>
                    <p class="mt-1 text-[9px] text-slate-500 leading-snug">
                      Daftar tiket order masuk realtime, rincian item pesanan, dan tombol proses status dapur
                    </p>
                    <span class="mt-2.5 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[8.5px] font-bold">
                      Tampilan Pemilik Resto
                    </span>
                  </div>
                  <div class="w-24 h-1 rounded-full bg-slate-300 mx-auto mt-auto"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- MOBILE SWIPEABLE STACK VIEW (Visible only on < 1024px) -->
          <div class="relative z-10 flex lg:hidden flex-col items-center justify-center w-full pb-8 mb-0">
            <!-- Swipe Deck Container -->
            <div
              class="relative w-[250px] sm:w-[270px] h-[440px] sm:h-[470px] flex items-center justify-center touch-pan-y"
              role="group"
              aria-label="Galeri mockup aplikasi (geser untuk melihat)"
              ontouchstart={handleTouchStart}
              ontouchend={handleTouchEnd}
            >
              <!-- Card 0: Menu Tamu -->
              <div
                class="absolute inset-0 transition-all duration-300 {activeMobileCard === 0
                  ? 'z-30 scale-100 rotate-0 opacity-100'
                  : 'z-10 scale-90 -rotate-12 -translate-x-10 opacity-50 pointer-events-none'}"
              >
                <div class="h-full w-full rounded-[42px] border-[7px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-800">
                  <div class="h-4.5 w-20 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                    <div class="size-1.5 rounded-full bg-slate-800 mr-1.5"></div>
                    <div class="size-1 rounded-full bg-slate-700"></div>
                  </div>
                  <div class="p-4 flex-1 flex flex-col justify-between">
                    <div class="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-mono text-slate-600 flex items-center gap-1">
                      <span class="text-emerald-600">●</span>
                      <span class="truncate">dapur-nia.restolink.site</span>
                    </div>
                    <div class="my-auto rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-4 text-center flex flex-col items-center justify-center">
                      <span class="text-xs font-bold text-slate-900">[AREA KATALOG MENU TAMU]</span>
                      <p class="mt-1 text-[10px] text-slate-500">
                        Foto menu WebP, harga promo, dan tombol pesan
                      </p>
                    </div>
                    <div class="w-24 h-1 rounded-full bg-slate-300 mx-auto mt-auto"></div>
                  </div>
                </div>
              </div>

              <!-- Card 1: Standee QR Meja -->
              <div
                class="absolute inset-0 transition-all duration-300 {activeMobileCard === 1
                  ? 'z-30 scale-100 rotate-0 opacity-100'
                  : activeMobileCard === 0
                    ? 'z-10 scale-90 rotate-12 translate-x-10 opacity-50 pointer-events-none'
                    : 'z-10 scale-90 -rotate-12 -translate-x-10 opacity-50 pointer-events-none'}"
              >
                <div class="h-full w-full rounded-[42px] border-[7px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-800">
                  <div class="h-4.5 w-20 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                    <div class="size-1.5 rounded-full bg-slate-800 mr-1.5"></div>
                    <div class="size-1 rounded-full bg-slate-700"></div>
                  </div>
                  <div class="p-4 flex-1 flex flex-col justify-between">
                    <div class="rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[10px] font-bold flex items-center justify-between">
                      <span>Meja 04</span>
                      <span class="size-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div class="my-auto rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-4 text-center flex flex-col items-center justify-center">
                      <span class="text-xs font-bold text-slate-900">[AREA STANDEE QR MEJA]</span>
                      <p class="mt-1 text-[10px] text-slate-600">
                        Scan kamera langsung tanpa instal aplikasi
                      </p>
                    </div>
                    <div class="w-24 h-1 rounded-full bg-slate-400 mx-auto mt-auto"></div>
                  </div>
                </div>
              </div>

              <!-- Card 2: Antrean Dapur -->
              <div
                class="absolute inset-0 transition-all duration-300 {activeMobileCard === 2
                  ? 'z-30 scale-100 rotate-0 opacity-100'
                  : 'z-10 scale-90 rotate-12 translate-x-10 opacity-50 pointer-events-none'}"
              >
                <div class="h-full w-full rounded-[42px] border-[7px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-800">
                  <div class="h-4.5 w-20 bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center">
                    <div class="size-1.5 rounded-full bg-slate-800 mr-1.5"></div>
                    <div class="size-1 rounded-full bg-slate-700"></div>
                  </div>
                  <div class="p-4 flex-1 flex flex-col justify-between">
                    <div class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-800 flex items-center justify-between">
                      <span>Layar Dapur</span>
                      <span class="text-[9px] text-brand-600">Live</span>
                    </div>
                    <div class="my-auto rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/40 p-4 text-center flex flex-col items-center justify-center">
                      <span class="text-xs font-bold text-slate-900">[AREA ANTREAN DAPUR]</span>
                      <p class="mt-1 text-[10px] text-slate-500">
                        Tiket order masuk realtime dan alur status
                      </p>
                    </div>
                    <div class="w-24 h-1 rounded-full bg-slate-300 mx-auto mt-auto"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile Swipe Navigation Tabs -->
            <div class="mt-4 flex items-center justify-center gap-2">
              {#each mobileMockupMeta as meta, idx}
                <button
                  type="button"
                  onclick={() => (activeMobileCard = idx)}
                  class="rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer {activeMobileCard === idx
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}"
                >
                  {meta.tag}
                </button>
              {/each}
            </div>
            <span class="mt-1.5 text-[10px] text-slate-400">Geser (swipe) layar untuk berganti mockup</span>
          </div>
        </div>

        <!-- C. BOTTOM MARQUEE TICKER BAR (Pinned on the baseline of sticky viewport) -->
        <div
          class="absolute bottom-0 inset-x-0 z-20 w-full bg-slate-900 text-white py-3 sm:py-3.5 overflow-hidden border-t border-slate-800 transition-opacity duration-700 {uiStore.isAppReady ? 'opacity-100' : 'opacity-0'}"
          aria-hidden="true"
        >
          <div class="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">
            <span>SUBDOMAIN TOKO OTOMATIS</span>
            <span class="text-brand-500">✦</span>
            <span>0% POTONGAN KOMISI PESANAN</span>
            <span class="text-brand-500">✦</span>
            <span>GUEST CHECKOUT TANPA DOWNLOAD</span>
            <span class="text-brand-500">✦</span>
            <span>QR CODE STAND-EE MEJA SIAP CETAK</span>
            <span class="text-brand-500">✦</span>
            <span>PANTAU ANTREAN DAPUR LIVE</span>
            <span class="text-brand-500">✦</span>
            <span>OPTIMASI FOTO WEBP OTOMATIS</span>
            <span class="text-brand-500">✦</span>
            <span>KENDALI STOK SEKALI KLIK</span>
            <span class="text-brand-500">✦</span>
            <span>INTEGRASI RESMI MIDTRANS</span>
            <span class="text-brand-500">✦</span>
            <!-- Duplikat untuk seamless loop -->
            <span>SUBDOMAIN TOKO OTOMATIS</span>
            <span class="text-brand-500">✦</span>
            <span>0% POTONGAN KOMISI PESANAN</span>
            <span class="text-brand-500">✦</span>
            <span>GUEST CHECKOUT TANPA DOWNLOAD</span>
            <span class="text-brand-500">✦</span>
            <span>QR CODE STAND-EE MEJA SIAP CETAK</span>
            <span class="text-brand-500">✦</span>
            <span>PANTAU ANTREAN DAPUR LIVE</span>
            <span class="text-brand-500">✦</span>
            <span>OPTIMASI FOTO WEBP OTOMATIS</span>
            <span class="text-brand-500">✦</span>
            <span>KENDALI STOK SEKALI KLIK</span>
            <span class="text-brand-500">✦</span>
            <span>INTEGRASI RESMI MIDTRANS</span>
            <span class="text-brand-500">✦</span>
          </div>
        </div>
      </section>

      <!-- SCROLL RUNWAY SPACER (140vh to play headline fade & phone spread, then holds) -->
      {#if !prefersReducedMotion}
        <div class="h-[140vh] w-full pointer-events-none" aria-hidden="true"></div>
      {/if}

      <!-- ======================================================================= -->
      <!-- 2. SOCIAL PROOF & MASALAH UMKM (Rises and covers the pinned hero)       -->
      <!-- ======================================================================= -->
      <section
        id="masalah-umkm"
        class="relative z-20 w-full border-t border-slate-200/90 bg-slate-50 shadow-[0_-30px_70px_rgba(0,0,0,0.25)] py-16 sm:py-24 overflow-hidden"
      >
        <!-- 54px Architectural Grid with Radial Mask (from smooth-scroll component) -->
        <div class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#cbd5e135_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e135_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={40} duration={0.6}>
          <div class="text-center max-w-3xl mx-auto">
            <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              <span class="text-brand-600">Tiga hambatan utama</span> UMKM
            </h2>
            <p class="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Data riil operasional membuktikan website mandiri bukan sekadar gaya, melainkan penyelamat margin dan efisiensi waktu kerja staf.
            </p>
          </div>
        </AnimatedContent>

        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          <!-- CARD 1: 45% Chat Masuk Tanya Menu -->
          <AnimatedContent distance={50} duration={0.6} delay={0} class="flex">
            <div class="w-full rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="rounded-full bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Waktu Terbuang
                  </span>
                  <div class="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>

                <!-- Big Stat & Metric -->
                <div class="mt-5">
                  <p class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                    45<span class="text-brand-600">%</span>
                  </p>
                  <p class="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chat Masuk Tanya Menu
                  </p>
                </div>

                <!-- Visual Meter Gauge -->
                <div class="mt-4">
                  <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-500 to-brand-500 h-2 rounded-full" style="width: 45%;"></div>
                  </div>
                  <div class="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500 font-medium">
                    <span>Beban Balas Pesan</span>
                    <span class="font-bold text-brand-600">45% Total Chat</span>
                  </div>
                </div>

                <p class="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Staf terus mengulang kirim foto menu &amp; daftar harga yang sama ke tiap pelanggan via chat WhatsApp.
                </p>
              </div>

              <!-- Solution Tag -->
              <div class="mt-6 border-t border-slate-100 pt-3.5 flex items-start gap-2 text-xs font-semibold text-slate-800">
                <svg class="size-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pelanggan cek mandiri di subdomain usaha</span>
              </div>
            </div>
          </AnimatedContent>

          <!-- CARD 2: 10% Resiko Salah Catat & Salah Stok -->
          <AnimatedContent distance={50} duration={0.6} delay={0.12} class="flex">
            <div class="w-full rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="rounded-full bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Human Error
                  </span>
                  <div class="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>

                <!-- Big Stat & Metric -->
                <div class="mt-5">
                  <p class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                    10<span class="text-rose-600">%</span>
                  </p>
                  <p class="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Resiko Salah Catat Manual
                  </p>
                </div>

                <!-- Visual Meter Gauge -->
                <div class="mt-4">
                  <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full" style="width: 25%;"></div>
                  </div>
                  <div class="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500 font-medium">
                    <span>Nota Kertas Tulisan Tangan</span>
                    <span class="font-bold text-rose-600">1 dari 10 Order</span>
                  </div>
                </div>

                <p class="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pencatatan nota kertas saat jam sibuk rawan hilang, salah tulis varian rasa, atau pesanan dobel ke dapur.
                </p>
              </div>

              <!-- Solution Tag -->
              <div class="mt-6 border-t border-slate-100 pt-3.5 flex items-start gap-2 text-xs font-semibold text-slate-800">
                <svg class="size-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tiket order digital masuk realtime ke dapur</span>
              </div>
            </div>
          </AnimatedContent>

          <!-- CARD 3: 0% Potongan Komisi Pesanan -->
          <AnimatedContent distance={50} duration={0.6} delay={0.24} class="flex sm:col-span-2 lg:col-span-1">
            <div class="w-full rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    100% Milik Anda
                  </span>
                  <div class="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg class="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <!-- Big Stat & Metric -->
                <div class="mt-5">
                  <p class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                    0<span class="text-brand-600">%</span>
                  </p>
                  <p class="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Potongan Komisi Pesanan
                  </p>
                </div>

                <!-- Visual Comparison Gauge -->
                <div class="mt-4 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 flex items-center justify-between text-xs font-semibold">
                  <span class="text-slate-500 line-through">Ojol: 20% - 25%</span>
                  <span class="text-emerald-600 font-bold">RestoLink: Rp 0</span>
                </div>

                <p class="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Seluruh rupiah dari pesanan pelanggan adalah 100% hak pemilik usaha. Tanpa potongan persentase margin keuntungan.
                </p>
              </div>

              <!-- Solution Tag -->
              <div class="mt-6 border-t border-slate-100 pt-3.5 flex items-start gap-2 text-xs font-semibold text-slate-800">
                <svg class="size-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Bebas biaya bagi hasil sepeser pun</span>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  </div>

    <!-- ======================================================================= -->
    <!-- 3. 5 LANGKAH MUDAH MEMODERNISASIKAN BISNIS ANDA (FlowArt Story Scroll)  -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedContent distance={40} duration={0.6}>
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            <span class="text-brand-600">5 langkah mudah</span> memodernisasikan bisnis anda
          </h2>
          <p class="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Scroll ke bawah untuk mengikuti alur transisi dari pencatatan manual ke sistem digital mandiri.
          </p>
        </AnimatedContent>
      </div>
    </section>

    <!-- FULLSCREEN PINNED STORY SCROLL DECK -->
    <StoryScroll
      aria-label="5 Langkah Memodernisasi Bisnis"
      onActiveChange={(active) => (isStoryScrollActive = active)}
    >
      <!-- LANGKAH 1 -->
      <FlowSection aria-label="Langkah 1: Registrasi Kilat" style="background-color: #ea580c; color: #ffffff;">
        <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-90">01 / 05 — REGISTRASI KILAT</p>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <div>
          <h3 class="text-[clamp(2.5rem,7vw,7rem)] font-extrabold leading-[0.88] uppercase tracking-tight text-white">
            KLAIM<br />SUBDOMAIN<br />MANDIRI
          </h3>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <p class="max-w-[55ch] text-[clamp(1rem,2vw,1.75rem)] font-normal leading-relaxed text-white/95">
          Miliki alamat website toko sendiri seperti <strong class="underline decoration-white/60">usaha-anda.restolink.site</strong> yang langsung aktif seketika tanpa sewa hosting teknis atau instalasi rumit.
        </p>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <div class="flex flex-wrap gap-[3vw]">
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Subdomain Khusus</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Identitas resmi toko Anda, mudah diingat pembeli saat bertransaksi.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Aktivasi Instan</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Langsung bisa dibagikan ke bio Instagram, TikTok, dan chat WhatsApp.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Cloud Hosting Bebas Biaya</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Infrastruktur server cepat terkelola penuh tanpa biaya langganan hosting terpisah.
            </p>
          </div>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <p class="mt-auto ml-auto text-right text-xs sm:text-sm font-mono tracking-wider text-white/70">
          LANGKAH 01 — RESTOLINK PLATFORM
        </p>
      </FlowSection>

      <!-- LANGKAH 2 -->
      <FlowSection aria-label="Langkah 2: Upload Menu & Foto WebP" style="background-color: #0f172a; color: #ffffff;">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">02 / 05 — KATALOG CERDAS</p>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <div>
          <h3 class="text-[clamp(2.5rem,7vw,7rem)] font-extrabold leading-[0.88] uppercase tracking-tight text-white">
            UPLOAD<br />FOTO WEBP<br />RINGAN
          </h3>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <p class="max-w-[55ch] text-[clamp(1rem,2vw,1.75rem)] font-normal leading-relaxed text-slate-300">
          Unggah foto makanan dan rincian harga. Sistem otomatis mengompresi gambar ke WebP ringan hemat kuota (-93%), agar katalog terbuka secepat kilat di HP pembeli.
        </p>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <div class="flex flex-wrap gap-[3vw]">
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Kompresi Ringan</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Optimasi WebP: 2.8 MB dikompresi jadi 190 KB seketika saat upload.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Kendali Stok Instan</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Bahan baku habis? Geser toggle ke "Habis" dan website langsung terupdate.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Kategori Rapi</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Pisahkan menu makanan, minuman, dan paket promo dengan rapi.
            </p>
          </div>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <p class="mt-auto ml-auto text-right text-xs sm:text-sm font-mono tracking-wider text-slate-500">
          LANGKAH 02 — RESTOLINK PLATFORM
        </p>
      </FlowSection>

      <!-- LANGKAH 3 -->
      <FlowSection aria-label="Langkah 3: Pasang QR Meja & Link Medsos" style="background-color: #f7f3ea; color: #0f172a;">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">03 / 05 — AKSES TANPA INSTAL</p>
        <hr class="my-[2vw] border-none border-t border-slate-300" />
        <div>
          <h3 class="text-[clamp(2.5rem,7vw,7rem)] font-extrabold leading-[0.88] uppercase tracking-tight text-slate-900">
            PASANG<br />QR MEJA &amp;<br />LINK BIO
          </h3>
        </div>
        <hr class="my-[2vw] border-none border-t border-slate-300" />
        <p class="max-w-[55ch] text-[clamp(1rem,2vw,1.75rem)] font-normal leading-relaxed text-slate-700">
          Cetak template QR Code meja atau sematkan tautan di bio media sosial. Tamu cukup scan kamera langsung di tempat duduk tanpa perlu unduh aplikasi apa pun.
        </p>
        <hr class="my-[2vw] border-none border-t border-slate-300" />
        <div class="flex flex-wrap gap-[3vw]">
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">Standee QR Otomatis</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-600">
              Generator QR Meja 01 s/d Meja 20 siap cetak dalam resolusi tajam.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">Guest Checkout</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-600">
              Tamu tidak perlu mendaftar akun atau mengingat password.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">Browser Native</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-600">
              Mulus di semua browser iPhone maupun Android tanpa unduh aplikasi.
            </p>
          </div>
        </div>
        <hr class="my-[2vw] border-none border-t border-slate-300" />
        <p class="mt-auto ml-auto text-right text-xs sm:text-sm font-mono tracking-wider text-slate-500">
          LANGKAH 03 — RESTOLINK PLATFORM
        </p>
      </FlowSection>

      <!-- LANGKAH 4 -->
      <FlowSection aria-label="Langkah 4: Terima Pesanan di Layar Dapur" style="background-color: #c2410c; color: #ffffff;">
        <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-90">04 / 05 — REALTIME SYNC</p>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <div>
          <h3 class="text-[clamp(2.5rem,7vw,7rem)] font-extrabold leading-[0.88] uppercase tracking-tight text-white">
            TERIMA<br />ORDER DI<br />LAYAR DAPUR
          </h3>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <p class="max-w-[55ch] text-[clamp(1rem,2vw,1.75rem)] font-normal leading-relaxed text-white/95">
          Pesanan tamu seketika masuk ke antrean dapur secara realtime. Kelola alur status terstruktur dengan satu klik: Baru → Sedang Masak → Siap Antar tanpa resiko nota terselip.
        </p>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <div class="flex flex-wrap gap-[3vw]">
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Live Kitchen Queue</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Notifikasi order baru langsung tampil di layar tablet atau HP dapur.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Alur 3 Status Jelas</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Baru → Sedang Masak → Siap Antar, dapur tidak bingung mana yang prioritas.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Bebas Kertas Tercecer</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-white/80">
              Eliminasi total 10% potensi salah catat dan kehilangan nota kertas manual.
            </p>
          </div>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/20" />
        <p class="mt-auto ml-auto text-right text-xs sm:text-sm font-mono tracking-wider text-white/70">
          LANGKAH 04 — RESTOLINK PLATFORM
        </p>
      </FlowSection>

      <!-- LANGKAH 5 -->
      <FlowSection aria-label="Langkah 5: Rekap Omset & Untung 100%" style="background-color: #020617; color: #ffffff;">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">05 / 05 — 0% KOMISI</p>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <div>
          <h3 class="text-[clamp(2.5rem,7vw,7rem)] font-extrabold leading-[0.88] uppercase tracking-tight text-white">
            REKAP OMSET<br />UNTUNG 100%<br />MILIK ANDA
          </h3>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <p class="max-w-[55ch] text-[clamp(1rem,2vw,1.75rem)] font-normal leading-relaxed text-slate-300">
          Pantau seluruh riwayat transaksi harian secara transparan. Seluruh rupiah dari pesanan pelanggan adalah 100% hak pemilik usaha tanpa potongan komisi 20% seperti ojek online.
        </p>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <div class="flex flex-wrap gap-[3vw]">
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">0% Komisi Pesanan</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Bebas bagi hasil. Omset penjualan masuk utuh ke rekening usaha Anda.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Laporan Transparan</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Pantau item terlaris, jam sibuk, dan total pesanan selesai per hari.
            </p>
          </div>
          <div class="min-w-[180px] flex-1">
            <p class="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Kendali Finansial Penuh</p>
            <p class="text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed text-slate-400">
              Atur harga promo mandiri tanpa potongan margin sepihak.
            </p>
          </div>
        </div>
        <hr class="my-[2vw] border-none border-t border-white/15" />
        <p class="mt-auto ml-auto text-right text-xs sm:text-sm font-mono tracking-wider text-slate-500">
          LANGKAH 05 — RESTOLINK PLATFORM
        </p>
      </FlowSection>
    </StoryScroll>

    <!-- ======================================================================= -->
    <!-- 4. FEEDBACK & TESTIMONI MITRA UMKM                                       -->
    <!-- ======================================================================= -->
    <TestimonialsSection />

    <!-- ======================================================================= -->
    <!-- 5. PAKET & SKEMA HARGA (Interactive Pricing Component)                  -->
    <!-- ======================================================================= -->
    <InteractivePricing />

    <!-- FAQ SECTION -->
    <section class="border-t border-[var(--bjork-border)] bg-[var(--bjork-panel)]/40 py-16 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={40} duration={0.6}>
          <div class="text-center">
            <p class="text-xs font-bold tracking-wider uppercase text-[var(--bjork-accent)]">Bantuan &amp; Panduan</p>
            <h2 class="mt-2 text-2xl font-bold tracking-tight text-[var(--bjork-text)] sm:text-3xl">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>
        </AnimatedContent>

        <div class="mt-10 space-y-3">
          {#each faqs as faq, index}
            {@const isOpen = openFaqIndex === index}
            <AnimatedContent distance={30} duration={0.5} delay={Math.min(index * 0.08, 0.32)}>
            <div class="rounded-2xl border border-[var(--bjork-border)] bg-[var(--bjork-surface)] shadow-[var(--bjork-shadow-soft)] transition-all overflow-hidden {isOpen ? 'border-[var(--bjork-accent-muted)] ring-1 ring-[var(--bjork-accent-soft)]' : 'hover:border-[var(--bjork-border-strong)]'}">
              <button
                type="button"
                class="w-full flex items-center justify-between p-5 text-left font-bold text-xs sm:text-sm text-[var(--bjork-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
                onclick={() => toggleFaq(index)}
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <span class="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--bjork-panel)] text-[var(--bjork-text-muted)] font-mono text-sm transition-transform duration-200 {isOpen ? 'rotate-45 bg-[var(--bjork-accent-soft)] text-[var(--bjork-accent)] font-bold' : ''}">
                  +
                </span>
              </button>
              {#if isOpen}
                <div class="px-5 pb-5 pt-1 text-xs text-[var(--bjork-text-muted)] leading-relaxed border-t border-[var(--bjork-border-muted)] animate-slide-in-up">
                  {faq.a}
                </div>
              {/if}
            </div>
            </AnimatedContent>
          {/each}
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
