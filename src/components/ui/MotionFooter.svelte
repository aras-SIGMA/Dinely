<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  type Props = {
    giantText?: string;
    heading?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    copyrightText?: string;
    authorName?: string;
  };

  let {
    giantText = 'DINELY',
    heading = 'Siap Modernisasi UMKM Anda?',
    subtitle = 'Platform penyedia layanan pemesanan QR, manajemen dapur, dan kasir terpadu #1 di Indonesia.',
    primaryCtaText = 'Mulai Sekarang',
    primaryCtaHref = '/daftar',
    secondaryCtaText = 'Hubungi Tim Kami',
    secondaryCtaHref = '/hubungi-kami',
    copyrightText = '© 2026 Dinely. Hak Cipta Dilindungi.',
    authorName = 'Kepiting Purba — SMK Taruna Bhakti'
  }: Props = $props();

  let wrapperRef: HTMLDivElement | null = $state(null);
  let giantTextRef: HTMLDivElement | null = $state(null);
  let headingRef: HTMLHeadingElement | null = $state(null);
  let linksRef: HTMLDivElement | null = $state(null);

  export function magnetic(node: HTMLElement) {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const h = rect.width / 2;
      const w = rect.height / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - w;

      gsap.to(node, {
        x: x * 0.35,
        y: y * 0.35,
        rotationX: -y * 0.12,
        rotationY: x * 0.12,
        scale: 1.05,
        ease: 'power2.out',
        duration: 0.35
      });
    };

    const handleMouseLeave = () => {
      gsap.to(node, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        ease: 'elastic.out(1, 0.3)',
        duration: 1.2
      });
    };

    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);

    return {
      destroy() {
        node.removeEventListener('mousemove', handleMouseMove);
        node.removeEventListener('mouseleave', handleMouseLeave);
        gsap.killTweensOf(node);
      }
    };
  }

  onMount(() => {
    if (!wrapperRef) return;

    const ctx = gsap.context(() => {
      // Parallax text background
      if (giantTextRef) {
        gsap.fromTo(
          giantTextRef,
          { y: '10vh', scale: 0.85, opacity: 0 },
          {
            y: '0vh',
            scale: 1,
            opacity: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: wrapperRef,
              start: 'top 85%',
              end: 'bottom bottom',
              scrub: 1
            }
          }
        );
      }

      // Staggered Content Reveal
      const targets = [headingRef, linksRef].filter(Boolean);
      if (targets.length > 0) {
        gsap.fromTo(
          targets,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: wrapperRef,
              start: 'top 45%',
              end: 'bottom bottom',
              scrub: 1
            }
          }
        );
      }
    }, wrapperRef);

    return () => ctx.revert();
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
</script>

<!-- The "Curtain Reveal" Wrapper: relative auto-height on mobile, fixed reveal on desktop -->
<div
  bind:this={wrapperRef}
  class="relative min-h-screen w-full md:h-screen"
  style="clip-path: polygon(0% 0, 100% 0%, 100% 100%, 0 100%); -webkit-clip-path: polygon(0% 0, 100% 0%, 100% 100%, 0 100%);"
>
  <!-- The actual footer stays fixed to viewport on desktop, relative scroll on mobile -->
  <footer
    class="cinematic-footer-wrapper relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden border-t border-slate-200/80 bg-white text-slate-900 select-none shadow-inner md:fixed md:bottom-0 md:left-0 md:h-screen md:overflow-hidden"
  >
    <!-- Ambient Light Warm Aurora & Grid Background -->
    <div
      class="footer-aurora pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[90px] animate-footer-breathe"
      aria-hidden="true"
    ></div>
    <div class="footer-bg-grid pointer-events-none absolute inset-0 -z-0" aria-hidden="true"></div>

    <!-- Giant background text with Parallax (Original subtle watermark) -->
    <div
      bind:this={giantTextRef}
      class="footer-giant-bg-text pointer-events-none absolute -bottom-[3vh] left-1/2 -z-0 -translate-x-1/2 whitespace-nowrap select-none"
      aria-hidden="true"
    >
      {giantText}
    </div>

    <!-- 1. Diagonal Sleek Marquee (Top of footer) -->
    <div
      class="absolute top-16 sm:top-20 md:top-24 left-0 z-10 w-full -rotate-2 scale-105 sm:scale-110 overflow-hidden border-y border-slate-200/90 bg-white/85 py-3.5 backdrop-blur-md shadow-sm"
    >
      <div
        class="flex w-max animate-footer-scroll-marquee text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.25em] text-slate-600 uppercase"
      >
        <div class="flex items-center space-x-10 px-6">
          <span>0% Potongan Komisi</span> <span class="text-brand-600">✦</span>
          <span>Website Menu Digital</span> <span class="text-amber-500">✦</span>
          <span>Pemesanan QR Meja</span> <span class="text-brand-600">✦</span>
          <span>Kitchen Display Real-time</span> <span class="text-amber-500">✦</span>
          <span>Manajemen Stok &amp; Menu</span> <span class="text-brand-600">✦</span>
          <span>Kasir POS &amp; Split Bill</span> <span class="text-amber-500">✦</span>
        </div>
        <div class="flex items-center space-x-10 px-6">
          <span>0% Potongan Komisi</span> <span class="text-brand-600">✦</span>
          <span>Website Menu Digital</span> <span class="text-amber-500">✦</span>
          <span>Pemesanan QR Meja</span> <span class="text-brand-600">✦</span>
          <span>Kitchen Display Real-time</span> <span class="text-amber-500">✦</span>
          <span>Manajemen Stok &amp; Menu</span> <span class="text-brand-600">✦</span>
          <span>Kasir POS &amp; Split Bill</span> <span class="text-amber-500">✦</span>
        </div>
      </div>
    </div>

    <!-- 2. Main Center Content -->
    <div
      class="relative z-10 mx-auto mt-20 sm:mt-28 md:mt-32 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center"
    >
      <h2
        bind:this={headingRef}
        class="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-950"
      >
        {heading}
      </h2>

      {#if subtitle}
        <p class="mx-auto mt-4 max-w-2xl text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      {/if}

      <!-- Interactive Magnetic Pills Layout -->
      <div bind:this={linksRef} class="mt-8 sm:mt-10 flex w-full flex-col items-center gap-5">
        <!-- Primary Action Buttons (Original Dark Pill & Border Pill) -->
        <div class="flex flex-wrap justify-center gap-3 sm:gap-4">
          <a
            use:magnetic
            href={primaryCtaHref}
            class="group inline-flex items-center gap-2.5 rounded-full bg-slate-950 px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <span>{primaryCtaText}</span>
            <svg
              class="size-4.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>

          {#if secondaryCtaHref}
            <a
              use:magnetic
              href={secondaryCtaHref}
              class="footer-glass-pill inline-flex items-center gap-2.5 rounded-full px-7 sm:px-9 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-slate-800 transition-colors hover:text-slate-950"
            >
              <span>{secondaryCtaText}</span>
            </a>
          {/if}
        </div>

        <!-- Secondary Text Links (Quick Navigation) -->
        <div class="mt-1 flex flex-wrap justify-center gap-2 sm:gap-3 text-slate-600">
          <a
            use:magnetic
            href="/"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Beranda
          </a>
          <a
            use:magnetic
            href="/fitur"
            class="footer-glass-pill rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Fitur Unggulan
          </a>
          <a
            use:magnetic
            href="/hardware"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Hardware
          </a>
          <a
            use:magnetic
            href="/tentang-kami"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Tentang Kami
          </a>
          <a
            use:magnetic
            href="/hubungi-kami"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Bantuan &amp; Kontak
          </a>
          <a
            use:magnetic
            href="/#alur-kerja"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            Alur Kerja
          </a>
          <a
            use:magnetic
            href="/#faq"
            class="footer-glass-pill rounded-full px-4 py-2 text-xs sm:text-sm font-medium hover:text-brand-600"
          >
            FAQ
          </a>
        </div>

        <!-- Social Channels -->
        <div class="mt-1 flex items-center justify-center gap-2.5">
          <!-- Instagram -->
          <span
            class="footer-glass-pill flex size-11 items-center justify-center rounded-full text-slate-600 cursor-default"
            aria-label="Instagram Dinely"
            role="img"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
            </svg>
          </span>

          <!-- TikTok -->
          <span
            class="footer-glass-pill flex size-11 items-center justify-center rounded-full text-slate-600 cursor-default"
            aria-label="TikTok Dinely"
            role="img"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
            </svg>
          </span>

          <!-- YouTube -->
          <a
            use:magnetic
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-glass-pill flex size-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-slate-900"
            aria-label="YouTube Dinely"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- 3. Bottom Bar / Credits (Original Light Colors) -->
    <div
      class="relative z-20 flex w-full flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-12 pb-6 sm:pb-8"
    >
      <!-- Copyright -->
      <div
        class="order-2 md:order-1 text-center md:text-left text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase"
      >
        {copyrightText}
      </div>

      <!-- Credit Badge (Minimalist, No Emoji) -->
      <div
        class="order-1 md:order-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-4 py-1.5 text-[11px] sm:text-xs text-slate-500 shadow-xs backdrop-blur-sm"
      >
        <span>Karya</span>
        <span class="font-bold text-slate-900">{authorName}</span>
      </div>

      <!-- Back to top button -->
      <button
        use:magnetic
        type="button"
        onclick={scrollToTop}
        aria-label="Kembali ke atas halaman"
        class="footer-glass-pill order-3 flex size-11 sm:size-12 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-950 group shadow-sm"
      >
        <svg
          class="size-5 transform transition-transform duration-300 group-hover:-translate-y-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"
          ></path>
        </svg>
      </button>
    </div>
  </footer>
</div>

<style>
  .cinematic-footer-wrapper {
    -webkit-font-smoothing: antialiased;

    /* Theme Dynamic Variables - Dinely Light Theme */
    --pill-bg-1: #ffffff;
    --pill-bg-2: #f8fafc;
    --pill-shadow: rgba(15, 23, 42, 0.04);
    --pill-highlight: #ffffff;
    --pill-inset-shadow: rgba(0, 0, 0, 0.02);
    --pill-border: rgba(226, 232, 240, 0.9);

    --pill-bg-1-hover: #ffffff;
    --pill-bg-2-hover: #f1f5f9;
    --pill-border-hover: rgba(234, 88, 12, 0.5);
    --pill-shadow-hover: rgba(234, 88, 12, 0.1);
    --pill-highlight-hover: #ffffff;
  }

  @keyframes footer-breathe {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.1);
      opacity: 0.95;
    }
  }

  @keyframes footer-scroll-marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  .animate-footer-breathe {
    animation: footer-breathe 8s ease-in-out infinite alternate;
  }

  .animate-footer-scroll-marquee {
    animation: footer-scroll-marquee 35s linear infinite;
  }

  /* Theme-adaptive Grid Background (Light) */
  .footer-bg-grid {
    background-size: 54px 54px;
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse 90% 70% at 50% 50%, black 40%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 50%, black 40%, transparent 80%);
  }

  /* Theme-adaptive Aurora Glow (Warm Brand Orange / Amber Light) */
  .footer-aurora {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(234, 88, 12, 0.1) 0%,
      rgba(245, 158, 11, 0.06) 40%,
      transparent 70%
    );
  }

  /* Glass Pill Theming (Light Theme) */
  .footer-glass-pill {
    background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
    box-shadow:
      0 4px 14px -3px var(--pill-shadow),
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 1px var(--pill-inset-shadow);
    border: 1px solid var(--pill-border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .footer-glass-pill:hover {
    background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
    border-color: var(--pill-border-hover);
    box-shadow:
      0 10px 24px -6px var(--pill-shadow-hover),
      inset 0 1px 1px var(--pill-highlight-hover);
  }

  /* Giant Background Text Masking (Original Watermark on White) */
  .footer-giant-bg-text {
    font-size: 24vw;
    line-height: 0.75;
    font-weight: 900;
    letter-spacing: -0.05em;
    color: transparent;
    -webkit-text-stroke: 1px rgba(15, 23, 42, 0.05);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, transparent 60%);
    -webkit-background-clip: text;
    background-clip: text;
  }
</style>
