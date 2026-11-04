<script lang="ts">
  import Button from '@/components/ui/Button.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  type BillingCycle = 'monthly' | 'yearly';
  let billingCycle = $state<BillingCycle>('monthly');

  const plans = $derived([
    {
      id: 'mikro',
      name: 'Mikro',
      tier: 'mikro',
      tagline: 'Solusi ideal untuk booth, warung, kedai kopi, dan UMKM kuliner mandiri.',
      price: billingCycle === 'monthly' ? '49.000' : '499.000',
      period: billingCycle === 'monthly' ? '/bulan' : '/tahun',
      saveBadge: billingCycle === 'yearly' ? 'Hemat 15%' : null,
      isActive: true,
      popular: true,
      badgeText: 'Trial 30 Hari Gratis',
      ctaText: 'Mulai Trial 30 Hari',
      ctaHref: '/daftar',
      features: [
        'Website menu digital subdomain mandiri',
        'Katalog menu & kategori tanpa batas',
        'Kompresi otomatis foto menu WebP',
        'Pemesanan instan (Guest Checkout)',
        'Dashboard dapur & pelacakan pesanan',
        'Toggle ketersediaan stok instan',
        'QR code meja siap cetak',
        '0% biaya potongan komisi pesanan'
      ]
    },
    {
      id: 'kecil',
      name: 'Kecil',
      tier: 'kecil',
      tagline: 'Untuk kedai dan cafe yang memiliki beberapa staf kasir dan ingin promo khusus.',
      price: billingCycle === 'monthly' ? '99.000' : '999.000',
      period: billingCycle === 'monthly' ? '/bulan' : '/tahun',
      saveBadge: billingCycle === 'yearly' ? 'Hemat 16%' : null,
      isActive: false,
      popular: false,
      badgeText: 'Segera Hadir',
      ctaText: 'Segera Hadir',
      ctaHref: '#',
      features: [
        'Semua fitur pada Paket Mikro',
        'Hingga 3 akun staf & kasir terpisah',
        'Manajemen kode promo & diskon dasar',
        'Laporan penjualan terekap per shift kasir',
        'Dukungan prioritas tim teknis'
      ]
    },
    {
      id: 'menengah',
      name: 'Menengah',
      tier: 'menengah',
      tagline: 'Untuk restoran berkapasitas besar dengan manajemen meja dan koki khusus.',
      price: billingCycle === 'monthly' ? '199.000' : '1.999.000',
      period: billingCycle === 'monthly' ? '/bulan' : '/tahun',
      saveBadge: billingCycle === 'yearly' ? 'Hemat 16%' : null,
      isActive: false,
      popular: false,
      badgeText: 'Segera Hadir',
      ctaText: 'Segera Hadir',
      ctaHref: '#',
      features: [
        'Semua fitur pada Paket Kecil',
        'Pengelolaan denah meja interaktif',
        'Kitchen Display System (KDS) khusus koki',
        'Manajemen inventaris bahan baku dasar',
        'Integrasi laporan keuangan mendalam'
      ]
    }
  ]);

  const comparisonCategories = [
    {
      category: 'Etalase & Menu Digital',
      items: [
        { name: 'Website Subdomain Mandiri', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' },
        { name: 'Jumlah Menu & Kategori', mikro: 'Tanpa Batas', kecil: 'Tanpa Batas', menengah: 'Tanpa Batas' },
        { name: 'Optimasi Foto WebP Otomatis', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' },
        { name: 'Toggle Stok Menu Instan', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' }
      ]
    },
    {
      category: 'Pemesanan & Alur Dapur',
      items: [
        { name: 'Pemesanan Tanpa Registrasi (Guest)', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' },
        { name: 'QR Code Meja Siap Cetak', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' },
        { name: 'Dashboard Alur Pesanan Dapur', mikro: 'Ya', kecil: 'Ya', menengah: 'Ya' },
        { name: 'Kitchen Display System (KDS)', mikro: 'Tidak', kecil: 'Tidak', menengah: 'Ya' }
      ]
    },
    {
      category: 'Operasional & Tim',
      items: [
        { name: 'Akun Staf Tambahan', mikro: '1 Pemilik', kecil: 'Hingga 3 Staf', menengah: 'Tak Terbatas' },
        { name: 'Fitur Promo & Diskon Toko', mikro: 'Tidak', kecil: 'Ya', menengah: 'Ya' },
        { name: 'Pengelolaan Nomor Meja', mikro: 'Manual', kecil: 'Manual', menengah: 'Interaktif Denah' },
        { name: 'Potongan Komisi Pesanan', mikro: '0%', kecil: '0%', menengah: '0%' }
      ]
    }
  ];

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
</script>

<div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
  <Navbar currentPath="/harga" />

  <main class="flex-1">
    <!-- ======================================================================= -->
    <!-- 1. HEADER & BILLING TOGGLE                                              -->
    <!-- ======================================================================= -->
    <section class="border-b border-slate-200/80 bg-white py-14 sm:py-20">
      <div class="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <span class="size-2 rounded-full bg-brand-500" aria-hidden="true"></span>
          Transparan &amp; Terjangkau
        </div>

        <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Skema Harga <span class="text-brand-600">Ramah UMKM</span> Kuliner
        </h1>

        <p class="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Mulai dengan uji coba gratis 30 hari. Tanpa biaya pendaftaran awal, tanpa komisi per transaksi, dan tanpa komitmen jangka panjang.
        </p>

        <!-- Billing Switch -->
        <div class="mt-8 flex items-center justify-center">
          <div class="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-xs font-bold transition-all {billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
              onclick={() => billingCycle = 'monthly'}
            >
              Tagihan Bulanan
            </button>
            <button
              type="button"
              class="relative rounded-lg px-4 py-2 text-xs font-bold transition-all {billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
              onclick={() => billingCycle = 'yearly'}
            >
              Tagihan Tahunan
              <span class="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Hemat s.d. 16%
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 2. PRICING CARDS                                                        -->
    <!-- ======================================================================= -->
    <section class="py-14 sm:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-3 items-stretch">
          {#each plans as plan (plan.id)}
            <div class="relative flex flex-col justify-between rounded-2xl border bg-white p-7 shadow-xs transition-shadow {plan.popular ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg' : 'border-slate-200'}">
              <!-- Popular / Active Badge -->
              {#if plan.popular}
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-0.5 text-xs font-extrabold text-white shadow-xs">
                  {plan.badgeText}
                </div>
              {:else}
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-200 px-3 py-0.5 text-[11px] font-bold text-slate-700">
                  {plan.badgeText}
                </div>
              {/if}

              <div>
                <!-- Plan Title & Tagline -->
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold text-slate-900">{plan.name}</h2>
                  {#if plan.saveBadge}
                    <span class="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      {plan.saveBadge}
                    </span>
                  {/if}
                </div>
                <p class="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">{plan.tagline}</p>

                <!-- Price -->
                <div class="mt-6 flex items-baseline gap-1 border-b border-slate-100 pb-6">
                  <span class="text-xs font-bold text-slate-500">Rp</span>
                  <span class="text-4xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                  <span class="text-xs font-medium text-slate-500">{plan.period}</span>
                </div>

                <!-- Feature List -->
                <ul class="mt-6 space-y-3" role="list">
                  {#each plan.features as feature}
                    <li class="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <svg class="mt-0.5 size-4 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- CTA Button -->
              <div class="mt-8 pt-4 border-t border-slate-100">
                {#if plan.isActive}
                  <a href={plan.ctaHref} class="block">
                    <Button size="lg" full>
                      {plan.ctaText}
                    </Button>
                  </a>
                  <p class="mt-2 text-center text-[11px] text-slate-500">
                    Gratis 30 hari • Tanpa kartu kredit
                  </p>
                {:else}
                  <Button size="lg" variant="secondary" full disabled>
                    {plan.ctaText}
                  </Button>
                  <p class="mt-2 text-center text-[11px] text-slate-400">
                    Segera dirilis di pembaruan berikutnya
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 3. DETAILED FEATURE COMPARISON TABLE (MATRIKS FITUR)                    -->
    <!-- ======================================================================= -->
    <section class="border-t border-slate-200/80 bg-white py-16 sm:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">Perbandingan Lengkap</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tabel Komparasi Fitur Tiap Paket
          </h2>
          <p class="mt-2 text-xs text-slate-500">
            Ketahui secara terperinci apa saja yang Anda dapatkan di setiap level paket layanan RestoLink.
          </p>
        </div>

        <div class="mt-10 overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50">
                <th class="py-3.5 px-4 font-bold text-slate-900 w-1/2">Fitur &amp; Kemampuan</th>
                <th class="py-3.5 px-4 font-bold text-brand-700 bg-brand-50/50 text-center w-1/6">Mikro (Aktif)</th>
                <th class="py-3.5 px-4 font-bold text-slate-600 text-center w-1/6">Kecil</th>
                <th class="py-3.5 px-4 font-bold text-slate-600 text-center w-1/6">Menengah</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              {#each comparisonCategories as cat}
                <tr class="bg-slate-100/70">
                  <td colspan="4" class="py-2.5 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-700">
                    {cat.category}
                  </td>
                </tr>
                {#each cat.items as item}
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                    <td class="py-3 px-4 text-center font-bold text-brand-700 bg-brand-50/20">
                      {#if item.mikro === 'Ya'}
                        <span class="inline-flex text-emerald-600 font-extrabold">✓</span>
                      {:else if item.mikro === 'Tidak'}
                        <span class="inline-flex text-slate-300 font-bold">—</span>
                      {:else}
                        <span>{item.mikro}</span>
                      {/if}
                    </td>
                    <td class="py-3 px-4 text-center text-slate-600">
                      {#if item.kecil === 'Ya'}
                        <span class="inline-flex text-emerald-600 font-extrabold">✓</span>
                      {:else if item.kecil === 'Tidak'}
                        <span class="inline-flex text-slate-300 font-bold">—</span>
                      {:else}
                        <span>{item.kecil}</span>
                      {/if}
                    </td>
                    <td class="py-3 px-4 text-center text-slate-600">
                      {#if item.menengah === 'Ya'}
                        <span class="inline-flex text-emerald-600 font-extrabold">✓</span>
                      {:else if item.menengah === 'Tidak'}
                        <span class="inline-flex text-slate-300 font-bold">—</span>
                      {:else}
                        <span>{item.menengah}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 4. FAQ SECTION                                                          -->
    <!-- ======================================================================= -->
    <section class="py-16 sm:py-20">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold tracking-wider uppercase text-brand-600">FAQ</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div class="mt-10 space-y-4">
          {#each faqs as faq}
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 class="text-sm font-bold text-slate-900">{faq.q}</h3>
              <p class="mt-2 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- ======================================================================= -->
    <!-- 5. BOTTOM CTA BANNER                                                    -->
    <!-- ======================================================================= -->
    <section class="pb-16 sm:pb-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div class="absolute -right-20 -top-20 size-60 rounded-full bg-brand-600/30 blur-3xl pointer-events-none" aria-hidden="true"></div>

          <h2 class="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Siap Majukan Usaha Kuliner Anda?
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Mulai sekarang dengan Paket Mikro seharga Rp 49.000/bulan dan rasakan kemudahan operasional menu digital mandiri selama 30 hari gratis.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/daftar" class="w-full sm:w-auto">
              <Button size="lg" full>
                Mulai Trial 30 Hari
              </Button>
            </a>
            <a href="/fitur" class="w-full sm:w-auto">
              <Button size="lg" variant="secondary" full>
                Pelajari Fitur
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
