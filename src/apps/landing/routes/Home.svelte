<script lang="ts">
  import Button from '@/components/ui/Button.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';
</script>

<div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
  <Navbar />

  <main class="flex-1">
    <!-- ======================================================================= -->
    <!-- 1. HERO SECTION (Split 2-Column with Pure Tailwind/CSS Visual Mockup)   -->
    <!-- ======================================================================= -->
    <section class="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <!-- Left Column: Copy & Actions (7 cols) -->
          <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-xs">
              <span class="size-2 rounded-full bg-brand-500 animate-pulse" aria-hidden="true"></span>
              Pusat Kendali Mandiri UMKM Kuliner
            </div>

            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-5xl xl:text-6xl xl:leading-tight">
              Website menu digital mandiri, <span class="text-brand-600">terkelola dari satu dashboard.</span>
            </h1>

            <p class="mx-auto lg:mx-0 max-w-2xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
              Beri pelanggan kemudahan melihat menu dan memesan langsung via subdomain unik usaha Anda.
              Ubah harga dan stok sekali klik, terima pesanan terstruktur, tanpa potongan komisi per transaksi.
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a href="/daftar" class="w-full sm:w-auto">
                <Button size="lg" full>
                  Mulai Trial 30 Hari Gratis
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </a>
              <a href="/fitur" class="w-full sm:w-auto">
                <Button size="lg" variant="secondary" full>
                  Lihat Fitur Lengkap
                </Button>
              </a>
            </div>

            <!-- Value Highlights -->
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-4 text-xs font-medium text-slate-500">
              <div class="flex items-center gap-1.5">
                <svg class="size-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Subdomain Toko Otomatis</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="size-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>0% Biaya Komisi Pesanan</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="size-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Setup Cepat &lt; 5 Menit</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Visual Mockup Dual View (5 cols) -->
          <div class="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            <!-- Background Glow -->
            <div class="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-100/60 to-amber-100/40 blur-2xl -z-10" aria-hidden="true"></div>

            <div class="relative w-full max-w-md">
              <!-- Mockup 1: Dashboard Pemilik (Base Card) -->
              <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl shadow-slate-200/50">
                <!-- Window Header Bar -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-2">
                    <span class="size-2.5 rounded-full bg-red-400"></span>
                    <span class="size-2.5 rounded-full bg-amber-400"></span>
                    <span class="size-2.5 rounded-full bg-emerald-400"></span>
                    <span class="ml-2 text-xs font-semibold text-slate-700">Dashboard Dapur Nia</span>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                    Online
                  </span>
                </div>

                <!-- Dashboard Order Snippets -->
                <div class="mt-3 space-y-2.5">
                  <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Pesanan Terbaru</span>
                    <span class="text-brand-600 font-semibold">Lihat Semua</span>
                  </div>

                  <!-- Order Card 1 -->
                  <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs text-slate-900">#RL-108</span>
                        <span class="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">Baru</span>
                      </div>
                      <p class="text-xs text-slate-600 mt-0.5 font-medium">1x Nasi Bakar Cakalang, 1x Es Jeruk</p>
                      <p class="text-[11px] text-slate-500 mt-0.5">Meja 04 • Budi Santoso</p>
                    </div>
                    <span class="text-xs font-bold text-slate-900">Rp 38.000</span>
                  </div>

                  <!-- Order Card 2 -->
                  <div class="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs text-slate-900">#RL-107</span>
                        <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Diproses</span>
                      </div>
                      <p class="text-xs text-slate-600 mt-0.5 font-medium">2x Ayam Bakar Madu</p>
                      <p class="text-[11px] text-slate-500 mt-0.5">Takeaway • Siti Aisyah</p>
                    </div>
                    <span class="text-xs font-bold text-slate-900">Rp 56.000</span>
                  </div>
                </div>
              </div>

              <!-- Mockup 2: Floating Smartphone Digital Menu (Overlapping Bottom Right) -->
              <div class="absolute -bottom-8 -right-2 sm:-right-6 w-52 sm:w-56 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xl shadow-brand-900/10">
                <!-- Subdomain Browser Bar -->
                <div class="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600 font-mono border border-slate-200/60">
                  <svg class="size-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span class="truncate">dapur-nia.restolink.site</span>
                </div>

                <!-- Mini Menu Item Card -->
                <div class="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                  <div class="flex gap-2">
                    <div class="size-11 rounded-lg bg-gradient-to-br from-amber-400 to-brand-500 shrink-0 flex items-center justify-center text-white text-base">
                      🍗
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-slate-900 truncate">Ayam Bakar Madu</p>
                      <p class="text-[11px] font-semibold text-brand-600 mt-0.5">Rp 28.000</p>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span class="text-[10px] text-emerald-700 font-semibold">Tersedia</span>
                    <button type="button" class="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      + Pesan
                    </button>
                  </div>
                </div>

                <!-- Floating Cart Indicator -->
                <div class="mt-2 flex items-center justify-between rounded-lg bg-slate-900 px-2.5 py-1.5 text-white">
                  <span class="text-[11px] font-medium">1 Item • Rp 28.000</span>
                  <span class="text-[10px] font-bold text-brand-400">Checkout &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 2. SOCIAL PROOF & MASALAH UMKM (Data dari PRD)                          -->
    <!-- ======================================================================= -->
    <section class="border-y border-slate-200/80 bg-white py-12">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">Fakta Operasional UMKM Kuliner</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Solusi untuk masalah yang dihadapi resto & kedai setiap hari
          </h2>
        </div>

        <div class="mt-10 grid gap-6 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
            <p class="text-3xl font-extrabold text-brand-600">45%</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">Pesan Masuk Hanya Tanya Menu</p>
            <p class="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Pelanggan menanyakan menu dan harga yang sama berulang kali. Cukup bagikan link website toko Anda.
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
            <p class="text-3xl font-extrabold text-brand-600">10%</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">Resiko Salah Catat &amp; Stok</p>
            <p class="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Pencatatan nota manual rawan tercecer saat jam sibuk. RestoLink menyatukan pesanan dalam satu daftar.
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
            <p class="text-3xl font-extrabold text-brand-600">0%</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">Potongan Komisi Pesanan</p>
            <p class="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Berbeda dari ojek online yang memotong 20%+, seluruh hasil penjualan pelanggan adalah 100% milik Anda.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 3. CORE FEATURES (Bento Grid Layout)                                   -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl text-center sm:text-left">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">Fitur Unggulan</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dirancang simpel untuk pedagang, nyaman untuk pembeli
          </h2>
          <p class="mt-3 text-base text-slate-600">
            Tanpa perlu instal aplikasi rumit di HP pembeli, semua berjalan mulus lewat browser.
          </p>
        </div>

        <!-- Bento Grid -->
        <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Bento 1: Large Span (Subdomain Unik) -->
          <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div>
              <div class="size-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 class="mt-5 text-xl font-bold text-slate-900">Website Mandiri via Subdomain Khusus</h3>
              <p class="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">
                Miliki alamat website sendiri seperti <strong class="text-slate-900">dapur-nia.restolink.site</strong> langsung aktif setelah aktivasi. Bagikan ke bio Instagram, WhatsApp, atau cetak jadi QR Code meja.
              </p>
            </div>

            <!-- Visual Bar -->
            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 flex items-center gap-2 sm:gap-3 overflow-hidden">
              <span class="size-2.5 sm:size-3 rounded-full bg-emerald-500 shrink-0"></span>
              <span class="text-xs font-mono font-medium text-slate-700 truncate min-w-0">https://<span class="text-brand-600 font-bold">usaha-anda</span>.restolink.site</span>
              <span class="ml-auto shrink-0 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">Aktif</span>
            </div>
          </div>

          <!-- Bento 2: Toggle Ketersediaan Real-time -->
          <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div class="size-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="mt-5 text-xl font-bold text-slate-900">Update Menu &amp; Stok Instan</h3>
              <p class="mt-2 text-sm text-slate-600 leading-relaxed">
                Bahan baku mendadak habis? Cukup geser toggle ke "Habis", website pembeli otomatis berubah saat itu juga.
              </p>
            </div>

            <div class="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span class="text-xs font-semibold text-slate-800">Status Menu Ayam Bakar</span>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <span class="size-1.5 rounded-full bg-emerald-600"></span> Tersedia
              </span>
            </div>
          </div>

          <!-- Bento 3: Guest Checkout -->
          <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div class="size-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 class="mt-5 text-xl font-bold text-slate-900">Pemesanan Tanpa Registrasi</h3>
              <p class="mt-2 text-sm text-slate-600 leading-relaxed">
                Pembeli tidak perlu mendaftar akun atau mengingat password. Cukup masukkan nama, pilih menu, dan kirim pesanan.
              </p>
            </div>

            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-medium">
              ✓ Konfirmasi instan via kode pesanan unik (contoh: <strong class="text-slate-900">#RL-108</strong>)
            </div>
          </div>

          <!-- Bento 4: Large Span (Dashboard Pelacakan Pesanan) -->
          <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div>
              <div class="size-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 class="mt-5 text-xl font-bold text-slate-900">Pelacakan Alur Dapur Terstruktur</h3>
              <p class="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">
                Pantau setiap pesanan masuk dengan alur status yang jelas: <strong class="text-slate-900">Baru &rarr; Diproses &rarr; Selesai</strong>. Dapur tidak lagi bingung mana pesanan yang belum disiapkan.
              </p>
            </div>

            <!-- Pipeline Status Visual -->
            <div class="mt-6 grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-semibold">
              <div class="rounded-lg bg-brand-50 p-2 sm:p-2.5 text-brand-800 border border-brand-200/60">
                1. Baru
              </div>
              <div class="rounded-lg bg-amber-50 p-2 sm:p-2.5 text-amber-800 border border-amber-200/60">
                2. Masak
              </div>
              <div class="rounded-lg bg-emerald-50 p-2 sm:p-2.5 text-emerald-800 border border-emerald-200/60">
                3. Selesai
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 4. CARA KERJA 3 LANGKAH (How It Works)                                 -->
    <!-- ======================================================================= -->
    <section class="border-t border-slate-200/80 bg-white py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">Mudah &amp; Praktis</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tiga langkah mulai jualan online
          </h2>
        </div>

        <div class="mt-12 grid gap-8 sm:grid-cols-3">
          <!-- Step 1 -->
          <div class="relative flex flex-col items-center text-center">
            <div class="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-xl shadow-md shadow-brand-600/20">
              1
            </div>
            <h3 class="mt-6 text-lg font-bold text-slate-900">Daftar &amp; Pilih Subdomain</h3>
            <p class="mt-2 text-sm text-slate-600 leading-relaxed">
              Buat akun pemilik dan tentukan nama toko Anda (misal: kedai-kopi.restolink.site).
            </p>
          </div>

          <!-- Step 2 -->
          <div class="relative flex flex-col items-center text-center">
            <div class="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-xl shadow-md shadow-brand-600/20">
              2
            </div>
            <h3 class="mt-6 text-lg font-bold text-slate-900">Upload Menu &amp; Foto</h3>
            <p class="mt-2 text-sm text-slate-600 leading-relaxed">
              Atur kategori, masukkan nama makanan, harga, dan foto yang otomatis dioptimalkan format WebP.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="relative flex flex-col items-center text-center">
            <div class="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-xl shadow-md shadow-brand-600/20">
              3
            </div>
            <h3 class="mt-6 text-lg font-bold text-slate-900">Sebar Link &amp; Terima Order</h3>
            <p class="mt-2 text-sm text-slate-600 leading-relaxed">
              Bagikan link ke pelanggan dan pantau pesanan yang masuk langsung dari dashboard dapur.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 5. BOTTOM CTA BANNER                                                   -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <!-- Subtle Glow Accent -->
          <div class="absolute -right-20 -top-20 size-60 rounded-full bg-brand-600/30 blur-3xl pointer-events-none" aria-hidden="true"></div>

          <span class="inline-flex items-center rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-300 border border-brand-500/30">
            Uji Coba 30 Hari Tanpa Resiko
          </span>

          <h2 class="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Siap jadikan menu usaha Anda lebih profesional?
          </h2>

          <p class="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Bergabunglah sekarang. Nikmati kemudahan pengelolaan menu dan pesanan terpusat dengan subdomain gratis untuk usaha kuliner Anda.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/daftar" class="w-full sm:w-auto">
              <Button size="lg" full>
                Mulai Trial 30 Hari Sekarang
              </Button>
            </a>
            <a href="/harga" class="w-full sm:w-auto">
              <Button size="lg" variant="secondary" full>
                Lihat Skema Harga
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
