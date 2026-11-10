<script lang="ts">
  // Svelte 5 Runes: $state, $derived, $effect reactive primitives
  // Source: https://svelte.dev/docs/svelte/$state
  // Source: https://svelte.dev/docs/svelte/$derived
  // Source: https://svelte.dev/docs/svelte/$effect
  import { onMount } from 'svelte';
  import { router } from '@/lib/router';
  import { uiStore } from '@/stores/ui.svelte';
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import SplitText from '@/components/ui/SplitText.svelte';
  import Button from '@/components/ui/Button.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  type TierKey = 'mikro' | 'kecil' | 'menengah';

  interface HardwareItem {
    id: string;
    number: number;
    name: string;
    units: string;
    role: string;
    description: string;
    connectivity: string;
    icon: 'smartphone' | 'tablet' | 'printer' | 'kds' | 'wifi' | 'pos' | 'scanner' | 'pc';
    optional?: boolean;
  }

  interface TierSpec {
    id: TierKey;
    label: string;
    badge: string;
    tagline: string;
    summary: string;
    targetScale: string;
    budgetEstimate: string;
    hardwareList: HardwareItem[];
    keyAdvantage: string;
  }

  const tiers: TierSpec[] = [
    {
      id: 'mikro',
      label: 'Usaha Mikro',
      badge: 'Modal Minimalis',
      tagline: 'Mulai instan tanpa beli alat baru, cukup gunakan HP yang sudah ada.',
      summary: 'Konsep paling ringkas untuk warung tenda, gerobak modern, stand minuman/boba, atau cafe rumahan. Pelanggan scan QR meja lewat ponsel mereka, pesanan masuk ke ponsel pemilik/staf.',
      targetScale: 'Kapasitas 1–5 meja atau takeaway gerobak',
      budgetEstimate: 'Rp0 (Manfaatkan smartphone harian)',
      keyAdvantage: 'Tanpa investasi hardware awal. Setup dalam 5 menit langsung jualan.',
      hardwareList: [
        {
          id: 'm-1',
          number: 1,
          name: 'Smartphone',
          units: '1 unit',
          role: 'Pusat Operasional Toko',
          description: 'Menerima notifikasi pesanan masuk seketika, mengubah status menu (Ready/Habis), dan melihat rekap penjualan harian. Mendukung Android & iOS.',
          connectivity: 'Internet 4G / WiFi',
          icon: 'smartphone'
        }
      ]
    },
    {
      id: 'kecil',
      label: 'Usaha Kecil',
      badge: 'Standar F&B Modern',
      tagline: 'Kombinasi kasir mandiri, cetak nota fisik, dan koordinasi staf yang rapi.',
      summary: 'Ideal untuk coffee shop, kedai makan, fast-casual resto, atau bakery dengan area kasir tetap. Memisahkan layar transaksi kasir dari ponsel operasional staf dan pemilik.',
      targetScale: 'Kapasitas 6–18 meja dengan staf 3–6 orang',
      budgetEstimate: 'Mulai dari Rp1,5 jt – Rp3 jt (opsional jika sudah ada tablet/printer)',
      keyAdvantage: 'Struk transaksi fisik langsung tercetak, pemilik memantau omset dari mana saja.',
      hardwareList: [
        {
          id: 'k-1',
          number: 1,
          name: 'Tablet / Laptop Kasir',
          units: '1 unit',
          role: 'Pusat POS & Kasir Meja Depan',
          description: 'Layar tetap di kasir untuk memproses pembayaran tunai/non-tunai, mengonfirmasi pesanan QR meja, dan mengatur antrean pesanan masuk.',
          connectivity: 'WiFi + Bluetooth / USB',
          icon: 'tablet'
        },
        {
          id: 'k-2',
          number: 2,
          name: 'Thermal Receipt Printer',
          units: '1 unit',
          role: 'Cetak Bukti Pembayaran Tamu',
          description: 'Printer kasir ukuran 58mm atau 80mm untuk mencetak struk transaksi pelanggan dan nomor antrean pesanan secara otomatis.',
          connectivity: 'Bluetooth / USB / WiFi',
          icon: 'printer'
        },
        {
          id: 'k-3',
          number: 3,
          name: 'Smartphone Staf',
          units: '1–2 unit',
          role: 'Penerima Pesanan & Dapur / Barista',
          description: 'Ponsel yang dipegang juru masak atau barista untuk melihat antrean tiket pesanan yang harus disiapkan tanpa perlu saling berteriak.',
          connectivity: 'WiFi Lokal Toko',
          icon: 'smartphone'
        },
        {
          id: 'k-4',
          number: 4,
          name: 'Smartphone Pemilik',
          units: '1 unit',
          role: 'Monitoring Pemilik dari Jauh',
          description: 'Akses khusus pemilik untuk memantau performa penjualan, omset harian, stok habis, dan histori order secara real-time dari luar gerai.',
          connectivity: 'Internet Seluler / WiFi',
          icon: 'smartphone'
        },
        {
          id: 'k-5',
          number: 5,
          name: 'Router WiFi',
          units: '1 unit',
          role: 'Jaringan Lokal Stabil',
          description: 'Memastikan seluruh perangkat kasir, printer, dan staf terhubung ke jaringan internet yang stabil tanpa gangguan sinyal.',
          connectivity: 'Koneksi Provider Internet (Indihome/Biznet/dsb)',
          icon: 'wifi'
        }
      ]
    },
    {
      id: 'menengah',
      label: 'Usaha Menengah',
      badge: 'Operasional Enterprise F&B',
      tagline: 'Sinkronisasi menyeluruh multi-posisi: kasir, waiter, dapur panas, bar, dan gudang.',
      summary: 'Dirancang untuk restoran casual dining, cafe 2 lantai, resto keluarga besar, atau outlet F&B dengan volume transaksi tinggi. Setiap divisi memiliki terminal kerja mandiri yang terintegrasi real-time.',
      targetScale: 'Kapasitas 20–60+ meja dengan belasan staf operasional',
      budgetEstimate: 'Disesuaikan dengan jumlah station kerja fisik',
      keyAdvantage: 'Kecepatan saji maksimal. Zero miskomunikasi antara waiter, dapur, dan kasir.',
      hardwareList: [
        {
          id: 'mn-1',
          number: 1,
          name: 'POS Station Kasir',
          units: '1–2 unit',
          role: 'Terminal Kasir Utama',
          description: 'Perangkat all-in-one POS touch screen atau PC kasir berkecepatan tinggi untuk antrean checkout ramai dan split bill pembayaran.',
          connectivity: 'LAN Ethernet / Dual-band WiFi',
          icon: 'pos'
        },
        {
          id: 'mn-2',
          number: 2,
          name: 'Thermal Receipt Printer 80mm',
          units: '1 unit',
          role: 'Printer Struk Kasir Auto-Cutter',
          description: 'Printer kasir 80mm tugas berat dengan pemotong kertas otomatis untuk kecepatan layanan di loket pembayaran.',
          connectivity: 'USB / LAN / RJ11 Cash Drawer',
          icon: 'printer'
        },
        {
          id: 'mn-3',
          number: 3,
          name: 'Kitchen Display System (KDS) / Printer Dapur',
          units: '1–2 unit',
          role: 'Layar / Printer Dapur Masakan',
          description: 'Layar monitor tahan panas/minyak atau printer dot matrix/thermal dapur berbunyi keras untuk antrean koki makanan berat.',
          connectivity: 'LAN Ethernet / WiFi 5GHz',
          icon: 'kds'
        },
        {
          id: 'mn-4',
          number: 4,
          name: 'Bar Display / Bar Printer',
          units: '1 unit',
          role: 'Terminal Khusus Bar & Minuman',
          description: 'Terminal khusus bartender agar pesanan minuman langsung diproses seketika tanpa tercampur dengan antrean dapur makanan.',
          connectivity: 'LAN / WiFi',
          icon: 'kds',
          optional: true
        },
        {
          id: 'mn-5',
          number: 5,
          name: 'Tablet Waiter',
          units: '2–4 unit',
          role: 'Order Taking Portabel Pramusaji',
          description: 'Tablet ringan yang dibawa waiter keliling meja untuk mencatat order tamu, input preferensi menu/alergi, dan cek ketersediaan stok.',
          connectivity: 'WiFi Dual-Band Ringan',
          icon: 'tablet'
        },
        {
          id: 'mn-6',
          number: 6,
          name: 'Smartphone / Tablet Gudang + Barcode Scanner',
          units: '1 unit',
          role: 'Inventori Bahan & Stok Opname',
          description: 'Perangkat staf gudang/logistik untuk scan barcode bahan baku masuk, penyesuaian stok berkala, dan verifikasi bahan kadaluarsa.',
          connectivity: 'WiFi + Bluetooth Scanner',
          icon: 'scanner'
        },
        {
          id: 'mn-7',
          number: 7,
          name: 'PC / Laptop Manajer',
          units: '1 unit',
          role: 'Back Office & Analisis Bisnis',
          description: 'Komputer manajemen untuk analisis laba-rugi, ekspor laporan penjualan, penentuan skema diskon/promosi, dan pengaturan hak akses staf.',
          connectivity: 'LAN / WiFi Keamanan Tingkat Tinggi',
          icon: 'pc'
        },
        {
          id: 'mn-8',
          number: 8,
          name: 'Router Dual-Band + Access Point',
          units: '1 set',
          role: 'Infrastruktur Jaringan Terisolasi',
          description: 'Sistem router bisnis dengan pemisahan VLAN: SSID privat khusus perangkat kasir & POS agar tidak terganggu bandwidth WiFi publik pelanggan.',
          connectivity: 'Multi-SSID + Gigabit Ethernet LAN',
          icon: 'wifi'
        }
      ]
    }
  ];

  // Svelte 5 Runes: State declaration
  let activeTierKey = $state<TierKey>('mikro');

  function syncTierFromUrl() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tierParam = urlParams.get('tier') as TierKey | null;
      const hash = window.location.hash.replace('#', '') as TierKey;
      const target = tierParam || hash;
      if (target === 'mikro' || target === 'kecil' || target === 'menengah') {
        activeTierKey = target;
      }
    }
  }

  function handleTierEvent(event: Event) {
    const customEvent = event as CustomEvent<{ tier?: TierKey }>;
    const tier = customEvent.detail?.tier;
    if (tier === 'mikro' || tier === 'kecil' || tier === 'menengah') {
      activeTierKey = tier;
    }
  }

  // Svelte 5 $effect: reactive sync with router search params
  // Source: https://svelte.dev/docs/svelte/$effect
  $effect(() => {
    const queryTier = router.route.search?.tier as string | undefined;
    if (queryTier === 'mikro' || queryTier === 'kecil' || queryTier === 'menengah') {
      activeTierKey = queryTier as TierKey;
    }
  });

  onMount(() => {
    syncTierFromUrl();
    window.addEventListener('popstate', syncTierFromUrl);
    window.addEventListener('restolink:tier-change', handleTierEvent);
    return () => {
      window.removeEventListener('popstate', syncTierFromUrl);
      window.removeEventListener('restolink:tier-change', handleTierEvent);
    };
  });

  // Svelte 5 Runes: Derived calculation
  const currentTier = $derived(
    tiers.find((t) => t.id === activeTierKey) ?? tiers[0]
  );
</script>

<svelte:head>
  <title>Kebutuhan Perangkat Keras (Hardware) — RestoLink</title>
  <meta
    name="description"
    content="Panduan kebutuhan perangkat keras RestoLink untuk Usaha Mikro, Kecil, dan Menengah. Cukup mulai dengan smartphone atau gunakan POS modern."
  />
</svelte:head>

<div class="relative flex min-h-screen flex-col overflow-x-hidden bg-white font-sans text-slate-900">
  <Navbar currentPath="/hardware" />

  <main class="relative flex-1 pb-16 pt-24 sm:pb-24 sm:pt-32">
    <!-- Ambient Radial Glow Identik Halaman Fitur & Tentang Kami -->
    <div
      class="pointer-events-none absolute inset-x-0 top-12 -z-10 flex items-start justify-center overflow-hidden"
    >
      <div
        class="h-[420px] w-[820px] rounded-full bg-gradient-to-tr from-brand-100/50 via-amber-100/30 to-orange-100/40 opacity-75 blur-3xl"
      ></div>
    </div>

    <!-- ========================================================================= -->
    <!-- SECTION 1: HEADER HALAMAN (Hero Serupa Fitur & Tentang Kami)               -->
    <!-- ========================================================================= -->
    <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8" aria-labelledby="hardware-headline">
      <div class="mx-auto max-w-4xl text-center">
        <!-- Eyebrow Badge -->
        <AnimatedContent distance={20} duration={0.5}>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950 uppercase"
          >
            <svg class="size-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            PANDUAN PERANGKAT KERAS
          </div>
        </AnimatedContent>

        <!-- Main Title dengan Staggered SplitText Reveal -->
        <h1
          id="hardware-headline"
          class="mt-6 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
        >
          <SplitText
            text="Kebutuhan Perangkat Sesuai"
            splitType="chars"
            delay={25}
            duration={0.7}
            ready={uiStore.isAppReady}
          /><br />
          <span class="text-brand-600 block sm:inline">
            <SplitText
              text="Skala Usaha F&B Anda."
              splitType="chars"
              delay={25}
              baseDelay={25 * 26}
              duration={0.7}
              ready={uiStore.isAppReady}
            />
          </span>
        </h1>

        <!-- Subtitle Paragraph -->
        <AnimatedContent distance={24} duration={0.6} delay={0.35}>
          <p class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Gunakan perangkat yang sudah Anda miliki saat ini. Tidak ada paksaan membeli hardware khusus dari kami.
          </p>
        </AnimatedContent>

        <!-- 3 SEGMENTED FILTER BUTTONS (Mikro, Kecil, Menengah) -->
        <AnimatedContent distance={28} duration={0.6} delay={0.45}>
          <div class="mt-10 flex justify-center">
            <div
              role="tablist"
              aria-label="Pilihan Skala Usaha"
              class="inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-900/[0.04]"
            >
              {#each tiers as tier}
                <button
                  type="button"
                  role="tab"
                  id="tab-{tier.id}"
                  aria-controls="tabpanel-{tier.id}"
                  aria-selected={activeTierKey === tier.id}
                  tabindex={activeTierKey === tier.id ? 0 : -1}
                  onclick={() => {
                    activeTierKey = tier.id;
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tier', tier.id);
                      window.history.replaceState({}, '', url.toString());
                    }
                  }}
                  class="relative flex items-center gap-2 rounded-xl px-4 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 {activeTierKey === tier.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}"
                >
                  <span>{tier.label}</span>
                  <span
                    class="hidden sm:inline-block text-[11px] font-normal px-2.5 py-0.5 rounded-full {activeTierKey === tier.id
                      ? 'bg-brand-700/60 text-brand-100'
                      : 'bg-slate-100 text-slate-500'}"
                  >
                    {tier.hardwareList.length} Alat
                  </span>
                </button>
              {/each}
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 2: CONTENT PANEL UNTUK TIER AKTIF                                  -->
    <!-- ========================================================================= -->
    <div
      id="tabpanel-{currentTier.id}"
      role="tabpanel"
      aria-labelledby="tab-{currentTier.id}"
      class="mx-auto mt-12 sm:mt-16 max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <AnimatedContent distance={36} duration={0.6}>
        <!-- Card Container Utama -->
        <div class="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/[0.03] sm:p-10 lg:p-12">
          <!-- Tier Header Banner -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div>
              <div class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-700 mb-3">
                <span>{currentTier.badge}</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{currentTier.label}</h2>
              <p class="mt-2 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">{currentTier.tagline}</p>
            </div>

            <!-- Meta Badges -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4 md:w-auto">
              <div class="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 text-left">
                <span class="block text-xs font-medium text-slate-400">Target Skala Usaha</span>
                <span class="mt-1 block text-xs sm:text-sm font-bold text-slate-900">{currentTier.targetScale}</span>
              </div>
              <div class="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 text-left">
                <span class="block text-xs font-medium text-slate-400">Estimasi Investasi</span>
                <span class="mt-1 block text-xs sm:text-sm font-bold text-brand-700">{currentTier.budgetEstimate}</span>
              </div>
            </div>
          </div>

          <!-- Key Advantage Alert Box -->
          <div class="pt-6 flex items-start gap-3.5 text-xs sm:text-sm text-slate-700 bg-amber-50/70 rounded-2xl p-4 sm:p-5 mt-6 border border-amber-200/60">
            <svg class="size-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span class="font-bold text-slate-950">Kunci Keunggulan: </span>
              <span class="leading-relaxed">{currentTier.keyAdvantage}</span>
            </div>
          </div>

          <!-- Hardware Cards Grid -->
          <div class="mt-10">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-xl font-extrabold tracking-tight text-slate-950">
                Daftar Perangkat Yang Dibutuhkan ({currentTier.hardwareList.length} Item)
              </h3>
              <span class="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Spesifikasi Fleksibel</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {#each currentTier.hardwareList as item (item.id)}
                <div class="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 sm:p-6 hover:border-brand-300 hover:bg-white hover:shadow-lg transition-all duration-200">
                  <div>
                    <div class="flex items-start justify-between gap-3 mb-4">
                      <div class="flex items-center gap-3.5">
                        <!-- Icon Avatar -->
                        <div class="size-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 shadow-xs">
                          {#if item.icon === 'smartphone'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          {:else if item.icon === 'tablet'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          {:else if item.icon === 'printer'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          {:else if item.icon === 'wifi'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            </svg>
                          {:else if item.icon === 'kds'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          {:else if item.icon === 'pos'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          {:else if item.icon === 'scanner'}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          {:else}
                            <svg class="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          {/if}
                        </div>

                        <div>
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-400">#{item.number}</span>
                            <h4 class="text-base font-bold text-slate-950">{item.name}</h4>
                          </div>
                          <span class="text-xs font-semibold text-brand-600">{item.role}</span>
                        </div>
                      </div>

                      <!-- Unit Badge -->
                      <span class="inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-bold {item.optional ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/70 text-slate-800'}">
                        {item.units}
                      </span>
                    </div>

                    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                      {item.description}
                    </p>
                  </div>

                  <!-- Footer Connectivity -->
                  <div class="flex items-center gap-2 border-t border-slate-200/70 pt-3.5 text-[11px] text-slate-500 font-medium">
                    <svg class="size-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Konektivitas: {item.connectivity}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </AnimatedContent>

      <!-- ========================================================================= -->
      <!-- SECTION 3: 3 PILAR KEUNGGULAN HARDWARE                                     -->
      <!-- ========================================================================= -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 class="text-base font-bold text-slate-950">Kompatibel Semua Brand</h4>
          <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Printer Epson, Iware, Panda, Xprinter, maupun gadget merk Xiaomi, Samsung, Apple bisa langsung dipakai.
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 class="text-base font-bold text-slate-950">Berbasis Web (Cloud)</h4>
          <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tidak perlu install software rumit. Cukup buka browser Google Chrome atau Safari di perangkat apa pun.
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h4 class="text-base font-bold text-slate-950">Upgrade Fleksibel Kapan Saja</h4>
          <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Mulai dari Paket Mikro dengan 1 HP, lalu tambah printer atau tablet seiring berkembangnya jumlah pelanggan.
          </p>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 4: CALL TO ACTION BOTTOM CARD                                      -->
      <!-- ========================================================================= -->
      <div class="mt-12 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
        <div class="relative z-10 max-w-2xl mx-auto">
          <h3 class="text-2xl font-bold sm:text-3xl lg:text-4xl">Punya Perangkat di Atas? Anda Siap Buka Resto Digital.</h3>
          <p class="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Coba gratis 30 hari tanpa kartu kredit dan rasakan kemudahan operasional pesanan tanpa potongan komisi 20% ojek online.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/daftar" class="w-full sm:w-auto">
              <Button size="lg" full>
                Mulai Trial 30 Hari Gratis
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </a>
            <a href="/hubungi-kami" class="w-full sm:w-auto">
              <Button size="lg" variant="secondary" full>
                Konsultasi Kebutuhan Hardware
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>

  <Footer />
</div>
