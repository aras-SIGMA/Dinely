<script lang="ts">
  import Logo from '@/components/ui/Logo.svelte';

  const currentYear = 2026;
</script>

<footer class="border-t border-slate-200/80 bg-white">
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
      <!-- Col 1: Brand & Identity (2 cols on lg) -->
      <div class="space-y-4 lg:col-span-2">
        <a
          href="/"
          class="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5"
          aria-label="RestoLink Beranda"
        >
          <Logo size="md" showTagline />
        </a>

        <p class="max-w-sm text-sm leading-relaxed text-slate-600">
          Pusat kendali mandiri bagi UMKM kuliner Indonesia: website menu digital otomatis via subdomain,
          katalog responsif, dan pencatatan pesanan terpadu tanpa biaya komisi tinggi.
        </p>

        <div class="pt-2">
          <div class="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
            <span class="size-2 rounded-full bg-brand-500" aria-hidden="true"></span>
            <span>Karya Tim Kepiting Purba — SMK Taruna Bhakti</span>
          </div>
        </div>
      </div>

      <!-- Col 2: Halaman Platform -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
          Navigasi
        </h3>
        <ul class="mt-4 space-y-2.5 text-sm" role="list">
          <li>
            <a
              href="/"
              class="text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Beranda
            </a>
          </li>
          <li>
            <a
              href="/fitur"
              class="text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Fitur Lengkap
            </a>
          </li>
          <li>
            <a
              href="/harga"
              class="text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Paket &amp; Harga
            </a>
          </li>
          <li>
            <a
              href="/daftar"
              class="text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Daftar Akun Baru
            </a>
          </li>
          <li>
            <a
              href="/masuk"
              class="text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Masuk Dashboard
            </a>
          </li>
        </ul>
      </div>

      <!-- Col 3: Solusi Produk -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
          Solusi UMKM
        </h3>
        <ul class="mt-4 space-y-2.5 text-sm text-slate-600" role="list">
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true"></span>
            Subdomain Usaha Mandiri
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true"></span>
            Katalog Foto Web Cepat
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true"></span>
            Toggle Ketersediaan Menu
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true"></span>
            Guest Order Tanpa Akun
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true"></span>
            Pembayaran Midtrans Snap
          </li>
        </ul>
      </div>

      <!-- Col 4: Teknologi & Kompetisi -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
          Infrastruktur
        </h3>
        <ul class="mt-4 space-y-2.5 text-sm text-slate-600" role="list">
          <li>Svelte 5 Runes Engine</li>
          <li>Supabase Row Level Security</li>
          <li>Cloudinary Media CDN</li>
          <li>Vercel Edge &amp; Wildcard DNS</li>
          <li class="pt-1">
            <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              Sistem Aktif 99.9%
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom copyright -->
    <div class="mt-12 border-t border-slate-100 pt-8 sm:flex sm:items-center sm:justify-between">
      <p class="text-xs text-slate-500">
        &copy; {currentYear} RestoLink Platform. Hak Cipta Dilindungi.
      </p>
      <p class="mt-3 text-xs text-slate-400 sm:mt-0">
        Dirancang dan dibangun untuk kompetisi GTNIC 2026
      </p>
    </div>
  </div>
</footer>
