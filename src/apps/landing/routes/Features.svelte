<script lang="ts">
  import Button from '@/components/ui/Button.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  const featurePillars = [
    {
      id: 'menu-digital',
      badge: 'Etalase Online',
      title: 'Website Menu Digital & Subdomain Mandiri',
      desc: 'Setiap mitra mendapatkan alamat website eksklusif di subdomain RestoLink yang langsung aktif seketika setelah pendaftaran. Pelanggan dapat membuka menu dengan cepat tanpa perlu mengunduh aplikasi apa pun.',
      points: [
        'Subdomain unik otomatis (misal: dapurnia.restolink.site)',
        'Kategori menu dinamis: Makanan, Minuman, Paket Hemat, Camilan',
        'Kompresi gambar otomatis ke format WebP untuk loading instan',
        'Desain mobile-friendly yang nyaman diakses dari semua tipe smartphone'
      ],
      visualType: 'menu'
    },
    {
      id: 'qr-ordering',
      badge: 'Tanpa Antre',
      title: 'Pemesanan Langsung & QR Code Meja',
      desc: 'Hilangkan antrean panjang dan salah catat pesanan. Pelanggan cukup memindai stiker QR Code di meja makan atau mengklik link di bio Instagram untuk memilih makanan dan mengirim pesanan langsung.',
      points: [
        'Guest Checkout: Pesan langsung tanpa wajib daftar akun atau login',
        'Pilihan tipe pesanan: Makan di Tempat (Dine-in) atau Bawa Pulang (Takeaway)',
        'Input nomor meja otomatis dari scan QR atau diisi manual oleh pelanggan',
        'Nomor referensi pesanan instan untuk memudahkan konfirmasi kasir'
      ],
      visualType: 'qr'
    },
    {
      id: 'kitchen-orders',
      badge: 'Alur Dapur',
      title: 'Dashboard Dapur & Manajemen Pesanan Real-time',
      desc: 'Satukan semua pesanan yang masuk ke dalam satu layar kendali terpusat. Staf dapur dan kasir dapat melihat rincian item, catatan khusus pembeli, dan memperbarui status pesanan secara terstruktur.',
      points: [
        'Alur status bertahap: Pesanan Baru → Sedang Diproses → Siap / Selesai',
        'Visual badge warna yang kontras untuk membedakan urgensi pesanan',
        'Rincian menu, jumlah porsi, dan catatan alergi/khusus pelanggan',
        'Riwayat transaksi harian yang rapi untuk rekapitulasi penjualan'
      ],
      visualType: 'kitchen'
    },
    {
      id: 'stock-control',
      badge: 'Fleksibilitas Penuh',
      title: 'Kendali Menu & Ketersediaan Stok Instan',
      desc: 'Bahan baku habis di tengah jam makan siang? Cukup buka dashboard dan geser toggle ketersediaan. Website menu pelanggan langsung diperbarui seketika tanpa perlu mencoret-coret buku menu fisik.',
      points: [
        'Toggle status ketersediaan (Tersedia / Habis) sekali klik',
        'Ubah harga jual sewaktu-waktu tanpa biaya cetak ulang buku menu',
        'Sembunyikan menu musiman yang sedang tidak diproduksi',
        'Dukungan deskripsi detail bahan dan tingkat kepedasan menu'
      ],
      visualType: 'stock'
    }
  ];

  const highlights = [
    {
      title: '0% Biaya Komisi',
      desc: 'Berbeda dari agregator pesan-antar ojek online yang memotong 20%+, seluruh pendapatan penjualan 100% milik usaha Anda.',
      icon: 'percent'
    },
    {
      title: 'Aktivasi Instan < 5 Menit',
      desc: 'Daftar, atur nama subdomain, masukkan menu andalan Anda, dan website restoran langsung siap menerima pesanan.',
      icon: 'bolt'
    },
    {
      title: 'Hosting & Server Aman',
      desc: 'Infrastruktur cloud berkecepatan tinggi dengan proteksi data Row Level Security (RLS) menjaga keamanan bisnis Anda.',
      icon: 'shield'
    },
    {
      title: 'Bebas Kertas & Ramah Lingkungan',
      desc: 'Kurangi biaya cetak kertas nota dan buku menu berkala yang cepat rusak dan memakan anggaran operasional.',
      icon: 'leaf'
    }
  ];
</script>

<div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
  <Navbar currentPath="/fitur" />

  <main class="flex-1">
    <!-- ======================================================================= -->
    <!-- 1. HEADER / HERO SECTION                                                -->
    <!-- ======================================================================= -->
    <section class="border-b border-slate-200/80 bg-white py-14 sm:py-20">
      <div class="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <span class="size-2 rounded-full bg-brand-500" aria-hidden="true"></span>
          Solusi Terpadu UMKM Kuliner
        </div>

        <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
          Semua Fitur yang Anda Butuhkan untuk <span class="text-brand-600">Digitalisasi Kedai &amp; Resto</span>
        </h1>

        <p class="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
          Dari menu digital interaktif, pemesanan tanpa aplikasi, hingga manajemen alur pesanan dapur. Dirancang praktis agar pemilik usaha kuliner mandiri bisa langsung menggunakannya tanpa kendala teknis.
        </p>

        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
          <a href="/daftar" class="w-full sm:w-auto">
            <Button size="lg" full>Coba Gratis 30 Hari</Button>
          </a>
          <a href="/harga" class="w-full sm:w-auto">
            <Button size="lg" variant="secondary" full>Lihat Skema Harga</Button>
          </a>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 2. DEEP-DIVE FEATURE PILLARS (Alternating 2-Column Sections)             -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-24 space-y-20 sm:space-y-28">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {#each featurePillars as feature, idx (feature.id)}
          <div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-14 {idx > 0 ? 'mt-20 sm:mt-28' : ''}">
            <!-- Text Column -->
            <div class="lg:col-span-6 {idx % 2 === 1 ? 'lg:order-2' : ''}">
              <span class="inline-flex items-center rounded-md bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
                {feature.badge}
              </span>
              <h2 class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {feature.title}
              </h2>
              <p class="mt-4 text-base text-slate-600 leading-relaxed">
                {feature.desc}
              </p>

              <ul class="mt-6 space-y-3" role="list">
                {#each feature.points as point}
                  <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                      <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{point}</span>
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Visual Preview Column -->
            <div class="lg:col-span-6 {idx % 2 === 1 ? 'lg:order-1' : ''}">
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
                {#if feature.visualType === 'menu'}
                  <!-- Mockup: Digital Menu View -->
                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <p class="text-xs font-bold text-slate-900">Kedai Kopi &amp; Toast Santai</p>
                        <p class="text-[11px] text-brand-600 font-mono">santai.restolink.site</p>
                      </div>
                      <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Buka</span>
                    </div>

                    <!-- Category Tabs Preview -->
                    <div class="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs font-medium">
                      <span class="rounded-lg bg-brand-600 px-2.5 py-1 text-white">Semua</span>
                      <span class="rounded-lg bg-white px-2.5 py-1 text-slate-700 border border-slate-200">Kopi</span>
                      <span class="rounded-lg bg-white px-2.5 py-1 text-slate-700 border border-slate-200">Toast</span>
                      <span class="rounded-lg bg-white px-2.5 py-1 text-slate-700 border border-slate-200">Camilan</span>
                    </div>

                    <!-- Menu Item Cards -->
                    <div class="mt-3 space-y-2">
                      <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
                        <div class="flex items-center gap-2.5">
                          <span class="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-lg">☕</span>
                          <div>
                            <p class="text-xs font-bold text-slate-900">Kopi Susu Gula Aren</p>
                            <p class="text-[11px] font-semibold text-brand-600">Rp 18.000</p>
                          </div>
                        </div>
                        <span class="rounded bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 border border-brand-200">+ Tambah</span>
                      </div>

                      <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
                        <div class="flex items-center gap-2.5">
                          <span class="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-lg">🍞</span>
                          <div>
                            <p class="text-xs font-bold text-slate-900">Roti Panggang Cokelat Keju</p>
                            <p class="text-[11px] font-semibold text-brand-600">Rp 22.000</p>
                          </div>
                        </div>
                        <span class="rounded bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 border border-brand-200">+ Tambah</span>
                      </div>
                    </div>
                  </div>

                {:else if feature.visualType === 'qr'}
                  <!-- Mockup: QR Code & Guest Checkout -->
                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div class="grid gap-4 sm:grid-cols-2 items-center">
                      <!-- QR Preview Card -->
                      <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <div class="mx-auto flex size-24 items-center justify-center rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50">
                          <svg class="size-16 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <p class="mt-2 text-xs font-bold text-slate-900">QR Meja 07</p>
                        <p class="text-[10px] text-slate-500">Scan &amp; Langsung Pesan</p>
                      </div>

                      <!-- Checkout Form Mockup -->
                      <div class="space-y-2 text-xs">
                        <div class="rounded-md border border-slate-200 bg-white p-2">
                          <span class="text-[10px] text-slate-400 font-semibold block uppercase">Nama Pemesan</span>
                          <span class="font-bold text-slate-800">Budi Santoso</span>
                        </div>
                        <div class="rounded-md border border-slate-200 bg-white p-2">
                          <span class="text-[10px] text-slate-400 font-semibold block uppercase">Tipe Pesanan</span>
                          <span class="font-bold text-slate-800">Makan di Tempat (Meja 07)</span>
                        </div>
                        <div class="rounded-md bg-brand-600 p-2 text-center text-white font-bold">
                          Kirim Pesanan &rarr;
                        </div>
                      </div>
                    </div>
                  </div>

                {:else if feature.visualType === 'kitchen'}
                  <!-- Mockup: Kitchen Order Queue -->
                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                      <span>Antrean Pesanan Aktif (3)</span>
                      <span class="text-brand-600 font-semibold text-[11px]">Real-time Sync</span>
                    </div>

                    <!-- Item 1 -->
                    <div class="rounded-lg border border-brand-200 bg-brand-50/60 p-2.5 flex items-center justify-between">
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-xs text-slate-900">#RL-204</span>
                          <span class="rounded bg-brand-600 px-1.5 py-0.2 text-[9px] font-bold text-white">Baru</span>
                          <span class="text-[10px] text-slate-500">Meja 02</span>
                        </div>
                        <p class="text-xs text-slate-700 font-medium mt-0.5">2x Mie Goreng Spesial, 1x Es Teh Manis</p>
                      </div>
                      <span class="text-xs font-bold text-slate-900">Rp 42.000</span>
                    </div>

                    <!-- Item 2 -->
                    <div class="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 flex items-center justify-between">
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-xs text-slate-900">#RL-203</span>
                          <span class="rounded bg-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">Diproses</span>
                          <span class="text-[10px] text-slate-500">Takeaway</span>
                        </div>
                        <p class="text-xs text-slate-700 font-medium mt-0.5">1x Nasi Gila Pedas Sedang</p>
                      </div>
                      <span class="text-xs font-bold text-slate-900">Rp 25.000</span>
                    </div>
                  </div>

                {:else if feature.visualType === 'stock'}
                  <!-- Mockup: Instant Stock Toggle -->
                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div class="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                      Pengaturan Menu &amp; Stok Cepat
                    </div>

                    <div class="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between">
                      <div>
                        <p class="text-xs font-bold text-slate-900">Ayam Geprek Sambal Matah</p>
                        <p class="text-[11px] text-slate-500">Rp 24.000 • Makanan Utama</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-semibold text-emerald-700">Tersedia</span>
                        <div class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-brand-600">
                          <span class="translate-x-4 inline-block size-4 transform rounded-full bg-white shadow-sm"></span>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between opacity-80">
                      <div>
                        <p class="text-xs font-bold text-slate-900">Jus Alpukat Kocok</p>
                        <p class="text-[11px] text-slate-500">Rp 15.000 • Minuman</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-semibold text-slate-500">Habis</span>
                        <div class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-300">
                          <span class="translate-x-0 inline-block size-4 transform rounded-full bg-white shadow-sm"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 3. KEUNGGULAN TAMBAHAN (HIGHLIGHTS GRID)                                -->
    <!-- ======================================================================= -->
    <section class="border-y border-slate-200/80 bg-white py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">Keunggulan Ekstra</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Kenapa Memilih RestoLink Dibanding Aplikasi Kasir Tradisional?
          </h2>
        </div>

        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {#each highlights as item}
            <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between">
              <div>
                <div class="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  {#if item.icon === 'percent'}
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  {:else if item.icon === 'bolt'}
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  {:else if item.icon === 'shield'}
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  {:else}
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  {/if}
                </div>
                <h3 class="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                <p class="mt-2 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 4. BOTTOM CTA BANNER                                                    -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div class="absolute -right-20 -top-20 size-60 rounded-full bg-brand-600/30 blur-3xl pointer-events-none" aria-hidden="true"></div>

          <h2 class="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Mulai Transformasi Digital Usaha Kuliner Anda
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Daftar sekarang dan dapatkan akses gratis selama 30 hari penuh ke seluruh fitur Paket Mikro tanpa kewajiban kartu kredit.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/daftar" class="w-full sm:w-auto">
              <Button size="lg" full>
                Mulai Trial 30 Hari
              </Button>
            </a>
            <a href="/harga" class="w-full sm:w-auto">
              <Button size="lg" variant="secondary" full>
                Bandingkan Paket
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
