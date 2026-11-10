<script lang="ts">
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import SplitText from '@/components/ui/SplitText.svelte';
  import { uiStore } from '@/stores/ui.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  const featurePillars = [
    {
      id: 'menu-digital',
      badge: 'Etalase Online',
      icon: 'browser',
      title: 'Website Menu Digital & Subdomain Mandiri',
      desc: 'Setiap mitra mendapatkan alamat website eksklusif di subdomain Dinely yang langsung aktif seketika setelah pendaftaran. Pelanggan membuka menu tanpa mengunduh aplikasi apa pun.',
      points: [
        'Subdomain unik otomatis (misal: dapurnia.dinely.site)',
        'Kategori menu dinamis: Makanan, Minuman, Paket Hemat',
        'Kompresi gambar otomatis ke format WebP untuk loading instan'
      ],
      visualType: 'menu'
    },
    {
      id: 'qr-ordering',
      badge: 'Tanpa Antre',
      icon: 'qr',
      title: 'Pemesanan Langsung & QR Code Meja',
      desc: 'Hilangkan antrean panjang dan salah catat pesanan. Pelanggan memindai QR di meja atau klik link bio Instagram untuk mengirim pesanan langsung ke dapur.',
      points: [
        'Guest Checkout: pesan tanpa wajib daftar akun',
        'Pilihan Dine-in atau Takeaway',
        'Nomor meja terisi otomatis dari hasil scan QR'
      ],
      visualType: 'qr'
    },
    {
      id: 'kitchen-orders',
      badge: 'Sinkron Real-Time',
      icon: 'kitchen',
      title: 'Layar Dapur Tanpa Nota',
      desc: 'Setiap pesanan yang masuk muncul otomatis di Layar Dapur. Dapur bekerja tanpa kertas, pelanggan menunggu tanpa menebak-nebak.',
      points: [
        'Alur status bertahap: diterima, diproses, siap',
        'Badge warna untuk urgensi pesanan',
        'Catatan khusus & alergi tampil jelas'
      ],
      visualType: 'kitchen'
    },
    {
      id: 'stock-control',
      badge: 'Kontrol Penuh',
      icon: 'stock',
      title: 'Kontrol Stok & Status Menu',
      desc: 'Cukup satu toggle untuk menandai menu habis (Sold Out) dan menyesuaikan stok harian. Pelanggan selalu melihat ketersediaan terbaru.',
      points: [
        'Toggle Habis/Sedia sekali klik',
        'Ubah harga kapan pun tanpa cetak ulang',
        'Sembunyikan menu musiman tanpa menghapus data'
      ],
      visualType: 'stock'
    },
    {
      id: 'dashboard-analytics',
      badge: 'Laporan Real-Time',
      icon: 'chart',
      title: 'Dashboard Analitik & Rekap Omset',
      desc: 'Pantau omset harian, jumlah transaksi, dan menu terlaris secara langsung dari HP atau laptop tanpa menunggu tutup buku manual.',
      points: [
        'Rekap omset & total transaksi harian real-time',
        'Daftar menu terlaris untuk evaluasi stok bahan',
        'Laporan otomatis tanpa hitung nota kertas manual'
      ],
      visualType: 'analytics'
    }
  ];

  const extras = [
    {
      id: 'komisi',
      icon: 'percent',
      title: '0% Biaya Komisi',
      desc: 'Tanpa potongan per transaksi di masa trial.'
    },
    {
      id: 'setup',
      icon: 'bolt',
      title: 'Setup < 5 Menit',
      desc: 'Pesan tetap masuk bahkan saat menu belum lengkap.'
    },
    {
      id: 'aman',
      icon: 'shield',
      title: 'Cloud & RLS Aman',
      desc: 'Isolasi data per tenant via Supabase.'
    },
    {
      id: 'paperless',
      icon: 'leaf',
      title: '100% Paperless',
      desc: 'Nota, resi, dan laporan tersaji digital.'
    }
  ];
</script>

<div class="relative flex min-h-screen flex-col bg-white font-sans text-slate-900">
  <Navbar currentPath="/fitur" />

  <main class="relative flex-1 pb-16 pt-24 sm:pb-24 sm:pt-32">
    <!-- Ambient glow -->
    <div
      class="pointer-events-none absolute inset-x-0 top-12 -z-10 flex items-start justify-center overflow-hidden"
    >
      <div
        class="h-[420px] w-[820px] rounded-full bg-gradient-to-tr from-brand-100/50 via-amber-100/30 to-orange-100/40 opacity-75 blur-3xl"
      ></div>
    </div>

    <!-- Hero -->
    <section
      class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8"
      aria-labelledby="fitur-headline"
    >
      <div class="mx-auto max-w-4xl text-center">
        <AnimatedContent distance={20} duration={0.5}>
          <div
            class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950"
          >
            FITUR UNGGULAN
          </div>
        </AnimatedContent>

        <h1
          id="fitur-headline"
          class="text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
        >
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

        <AnimatedContent distance={24} duration={0.6} delay={0.35}>
          <p class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Etalase online, pemesanan QR, layar dapur, dan kendali stok bekerja sebagai satu ekosistem
            utuh — dibangun khusus untuk realitas warung, kedai, resto, dan gerobak.
          </p>
        </AnimatedContent>
      </div>
    </section>

    <!-- Asymmetric bento showcase -->
    <section
      class="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8"
      aria-label="Daftar fitur unggulan"
    >
      <div class="grid gap-5 sm:grid-cols-2">
        <!-- Featured pillar: full-width horizontal -->
        <AnimatedContent distance={40} duration={0.6} delay={0.45} class="sm:col-span-2">
          <article
            id={featurePillars[0].id}
            class="group relative h-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/[0.03] transition-shadow duration-300 hover:shadow-2xl hover:shadow-brand-900/[0.05] sm:p-8 scroll-mt-32"
          >
            <div
              class="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-brand-50/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            ></div>
            <div class="relative grid items-center gap-8 lg:grid-cols-12">
              <div class="lg:col-span-6">
                <span
                  class="inline-flex items-center rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold tracking-wider text-white"
                >
                  {featurePillars[0].badge}
                </span>
                <h2 class="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {featurePillars[0].title}
                </h2>
                <p class="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {featurePillars[0].desc}
                </p>
                <ul class="mt-5 space-y-2.5">
                  {#each featurePillars[0].points as point (point)}
                    <li class="flex items-start gap-2.5 text-sm text-slate-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mt-0.5 size-4 shrink-0 text-brand-600"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {point}
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- Mockup: menu website preview -->
              <div class="lg:col-span-6">
                <div class="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                  <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span class="size-2.5 rounded-full bg-brand-500"></span>
                      <span class="font-serif text-sm font-semibold text-slate-900">Dapur Nia</span>
                    </div>
                    <span
                      class="rounded-full bg-slate-950 px-2.5 py-1 font-mono text-[9px] font-semibold text-white"
                    >
                      dapurnia.dinely.site
                    </span>
                  </div>
                  <div class="flex gap-1.5 px-4 pt-3">
                    <span class="rounded-full bg-brand-600 px-2.5 py-1 text-[9px] font-semibold text-white">Semua</span>
                    <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-medium text-slate-500">Makanan</span>
                    <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-medium text-slate-500">Minuman</span>
                    <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-medium text-slate-500">Paket Hemat</span>
                  </div>
                  <div class="flex items-center gap-3 px-4 py-3">
                    <span class="size-11 shrink-0 rounded-lg bg-brand-500"></span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-slate-900">Nasi Bakar Geprek</p>
                      <p class="text-[10px] text-slate-500">28rb • Level pedas 1-5</p>
                    </div>
                    <span class="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[9px] font-semibold text-brand-700">
                      Pesan
                    </span>
                  </div>
                  <div class="flex items-center gap-3 px-4 pb-4">
                    <span class="size-11 shrink-0 rounded-lg bg-brand-300"></span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-slate-900">Es Kopi Susu Sisca</p>
                      <p class="text-[10px] text-slate-500">18rb • Gula aren asli</p>
                    </div>
                    <span class="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[9px] font-semibold text-brand-700">
                      Pesan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </AnimatedContent>

        <!-- Supporting pillars (4 items in a 2x2 grid on sm+) -->
        {#each featurePillars.slice(1) as pillar, idx (pillar.id)}
          <AnimatedContent distance={28} duration={0.6} delay={0.1 * (idx + 1)} class="sm:col-span-1">
            <article
              id={pillar.id}
              class="group flex h-full flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-slate-900/[0.06] scroll-mt-32"
            >
              <div>
                <span
                  class="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold tracking-wider text-brand-700"
                >
                  {pillar.badge}
                </span>
                <h3 class="mt-4 font-display text-lg font-semibold tracking-tight text-slate-950">
                  {pillar.title}
                </h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-600">
                  {pillar.desc}
                </p>
                <ul class="mt-4 space-y-2">
                  {#each pillar.points as point (point)}
                    <li class="flex items-start gap-2 text-xs text-slate-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mt-0.5 size-3.5 shrink-0 text-brand-600"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {point}
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- Mini mockup -->
              <div class="mt-6">
                {#if pillar.visualType === 'qr'}
                  <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div class="grid size-16 shrink-0 grid-cols-4 gap-0.5 p-1.5 rounded-lg border border-slate-200 bg-white">
                      {#each [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1] as bit, i (i)}
                        <span class="{bit ? 'bg-slate-900' : 'bg-transparent'} rounded-[1px]"></span>
                      {/each}
                    </div>
                    <div class="space-y-1.5">
                      <p class="text-xs font-semibold text-slate-900">Meja A-07</p>
                      <span class="inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                        Dine-in
                      </span>
                      <p class="text-[10px] text-slate-500">Scan langsung pesan, tanpa akun</p>
                    </div>
                  </div>
                {:else if pillar.visualType === 'kitchen'}
                  <div class="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span class="font-mono text-[10px] font-semibold text-slate-900">#RL-0124</span>
                      <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">Diproses</span>
                    </div>
                    <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span class="font-mono text-[10px] font-semibold text-slate-900">#RL-0125</span>
                      <span class="rounded-full bg-brand-100 px-2 py-0.5 text-[9px] font-semibold text-brand-700">Baru</span>
                    </div>
                    <p class="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span class="size-1.5 animate-pulse rounded-full bg-brand-500"></span>
                      Sinkron real-time dengan pesanan pelanggan
                    </p>
                  </div>
                {:else if pillar.visualType === 'stock'}
                  <div class="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-medium text-slate-800">Es Teh Manis Jumbo</span>
                      <span class="flex h-4 w-7 items-center rounded-full bg-brand-600 px-0.5">
                        <span class="ml-auto size-3 rounded-full bg-white"></span>
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] text-slate-500 line-through">Ayam Gepuk Sambal Ijo</span>
                      <span class="flex h-4 w-7 items-center rounded-full bg-slate-300 px-0.5">
                        <span class="mr-auto size-3 rounded-full bg-white"></span>
                      </span>
                    </div>
                    <p class="pt-1 text-[10px] text-slate-500">Habis = otomatis tersembunyi dari menu pelanggan</p>
                  </div>
                {:else if pillar.visualType === 'analytics'}
                  <div class="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div class="rounded-lg border border-slate-200 bg-white p-3">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Omset Hari Ini</span>
                        <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          +18.4%
                        </span>
                      </div>
                      <p class="mt-1 font-mono text-base font-extrabold text-slate-900">Rp 1.480.000</p>
                      <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                        <span>34 Transaksi</span>
                        <span class="font-medium text-brand-600">62 Porsi</span>
                      </div>
                    </div>
                    <p class="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span class="size-1.5 rounded-full bg-emerald-500"></span>
                      Menu terlaris: Nasi Bakar Geprek (22)
                    </p>
                  </div>
                {/if}
              </div>
            </article>
          </AnimatedContent>
        {/each}
      </div>
    </section>

    <!-- Why band -->
    <section class="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8" aria-label="Kenapa Dinely">
      <AnimatedContent distance={24} duration={0.6} class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each extras as extra (extra.id)}
          <div class="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50/40">
            <h3 class="text-sm font-bold text-slate-900">{extra.title}</h3>
            <p class="mt-1 text-xs leading-relaxed text-slate-500">{extra.desc}</p>
          </div>
        {/each}
      </AnimatedContent>
    </section>
  </main>

  <Footer />
</div>
