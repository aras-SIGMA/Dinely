<script lang="ts">
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import InfiniteSlider from '@/components/ui/InfiniteSlider.svelte';

  type Testimonial = {
    id: string;
    quote: string;
    name: string;
    role: string;
    company: string;
    avatar: {
      bg: string;
      fg: string;
    };
  };

  const testimonials: Testimonial[] = [
    // Column 1
    {
      id: 'nia',
      quote:
        'Semenjak beralih ke RestoLink, pesanan tamu langsung masuk antrean tanpa ada nota kertas terselip lagi. Pelanggan juga senang scan QR langsung dari meja tanpa instal aplikasi.',
      name: 'Nia Rahmawati',
      role: 'Pemilik Usaha',
      company: 'Dapur Nia (Depok)',
      avatar: { bg: '#ffedd5', fg: '#fdba74' }
    },
    {
      id: 'aris',
      quote:
        'Fitur guest checkout-nya juara. Pas jam ngopi sore ramai, barista tinggal fokus seduh karena tamu pesan dan bayar mandiri dari meja masing-masing.',
      name: 'Aris Munandar',
      role: 'Co-Founder & Head Barista',
      company: 'Kopi Seduh Senja (Bandung)',
      avatar: { bg: '#eef2ff', fg: '#a5b4fc' }
    },
    {
      id: 'krisdayanti',
      quote:
        'Proses setup-nya beneran di bawah 5 menit. Tinggal upload menu, cetak standee QR meja, dan toko kami sudah punya website menu digital mandiri.',
      name: 'Krisdayanti',
      role: 'Pengelola Outlet',
      company: 'Warung Bu Kris (Tangerang)',
      avatar: { bg: '#f0fdfa', fg: '#5eead4' }
    },

    // Column 2
    {
      id: 'hendra',
      quote:
        'Yang paling terasa itu 0% potongan komisi. Di aplikasi lain margin habis 20–25%, di RestoLink keuntungan penjualan 100% tetap masuk utuh ke kas resto.',
      name: 'Hendra Setiawan',
      role: 'Owner',
      company: 'Sate Maranggi Pak De (Bogor)',
      avatar: { bg: '#ecfdf5', fg: '#6ee7b7' }
    },
    {
      id: 'kevin',
      quote:
        'Layar antrean dapurnya responsif banget. Koki tahu persis mana pesanan yang Baru, Sedang Masak, atau Siap Antar tanpa perlu teriak-teriak ke pelayan.',
      name: 'Kevin Pratama',
      role: 'Manager Operasional',
      company: 'Seafood Muara 99 (Jakarta)',
      avatar: { bg: '#f0f9ff', fg: '#7dd3fc' }
    },
    {
      id: 'rina',
      quote:
        'Kompresi foto menu WebP otomatisnya ngebantu banget. Gambar tetap tajam tapi katalog enteng dibuka pelanggan yang kuota internetnya hemat.',
      name: 'Rina Anggraini',
      role: 'Pemilik Kedai',
      company: 'Ayam Geprek Sambel Korek (Bekasi)',
      avatar: { bg: '#fff1f2', fg: '#fda4af' }
    },

    // Column 3
    {
      id: 'bowo',
      quote:
        'Toggle kendali stoknya praktis. Pas tetelan atau bakso urat habis di siang hari, tinggal matikan dari HP dan menu di website langsung update "Habis".',
      name: 'Bowo Prasetyo',
      role: 'Owner',
      company: 'Bakso Beranak Solo (Solo)',
      avatar: { bg: '#f8fafc', fg: '#94a3b8' }
    },
    {
      id: 'fajar',
      quote:
        'Dashboard analitiknya bikin tutup kasir harian jauh lebih cepat. Rekap omset, jam ramai, dan menu terlaris langsung tersaji rapi otomatis.',
      name: 'Fajar Nugraha',
      role: 'Founder',
      company: 'Kedai Kopi Pagi Sore (Semarang)',
      avatar: { bg: '#f5f3ff', fg: '#c4b5fd' }
    },
    {
      id: 'sudirman',
      quote:
        'Sistem flat bulanan yang sangat adil untuk UMKM. Kami punya website profesional ber-subdomain resmi tanpa pusing biaya sewa server tiap tahun.',
      name: 'H. Sudirman',
      role: 'Pemilik Resto',
      company: 'Bebek Ireng Suroboyo (Surabaya)',
      avatar: { bg: '#f7fee7', fg: '#bef264' }
    }
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);
</script>

{#snippet testimonialCard(item: Testimonial)}
  <figure
    class="group w-full max-w-[320px] rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-900/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
  >
    <blockquote class="text-xs sm:text-sm leading-relaxed text-slate-700">
      &ldquo;{item.quote}&rdquo;
    </blockquote>

    <figcaption class="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
      <!-- Profile Avatar (Minimalist Soft SVG, Low Contrast) -->
      <svg
        viewBox="0 0 40 40"
        class="size-10 shrink-0 rounded-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="20" fill={item.avatar.bg} />
        <circle cx="20" cy="15" r="6" fill={item.avatar.fg} />
        <path
          d="M8.5 35C8.5 28.5 13.5 24.5 20 24.5C26.5 24.5 31.5 28.5 31.5 35"
          fill={item.avatar.fg}
        />
      </svg>

      <div class="min-w-0 flex-1">
        <cite class="block truncate font-display text-xs sm:text-sm font-bold not-italic text-slate-950">
          {item.name}
        </cite>
        <span class="block truncate text-[11px] sm:text-xs text-slate-500">
          {item.role} &middot; <strong class="font-medium text-slate-700">{item.company}</strong>
        </span>
      </div>
    </figcaption>
  </figure>
{/snippet}

<section
  id="testimoni"
  class="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 sm:py-24"
  aria-labelledby="testimonials-headline"
>
  <!-- Ambient Soft Radial Glow -->
  <div
    class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 flex items-center justify-center overflow-hidden"
    aria-hidden="true"
  >
    <div
      class="h-[460px] w-[780px] rounded-full bg-gradient-to-tr from-brand-100/40 via-amber-100/25 to-orange-100/30 opacity-70 blur-3xl"
    ></div>
  </div>

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="mx-auto flex max-w-2xl flex-col items-center justify-center text-center">
      <AnimatedContent distance={20} duration={0.5}>
        <div
          class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950"
        >
          ULASAN MITRA UMKM
        </div>
      </AnimatedContent>

      <AnimatedContent distance={30} duration={0.6} delay={0.1}>
        <h2
          id="testimonials-headline"
          class="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
        >
          Cerita Nyata dari <span class="text-brand-600">Dapur Lokal</span>
        </h2>
      </AnimatedContent>

      <AnimatedContent distance={24} duration={0.6} delay={0.2}>
        <p class="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
          Lihat bagaimana para pelaku usaha kuliner membebaskan diri dari potongan komisi 20% dan
          menata antrean pesanan jadi jauh lebih rapi.
        </p>
      </AnimatedContent>
    </div>

    <!-- Infinite Vertical Sliders (1 col mobile, 2 col md, 3 col lg) with Gradient Mask -->
    <div
      class="mt-12 sm:mt-16 flex h-[620px] justify-center gap-5 sm:gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
    >
      <!-- Column 1 -->
      <InfiniteSlider direction="vertical" speed={30} class="w-full max-w-[320px]">
        {#each firstColumn as item (item.id)}
          {@render testimonialCard(item)}
        {/each}
      </InfiniteSlider>

      <!-- Column 2 (Hidden on mobile, visible on md+) -->
      <InfiniteSlider direction="vertical" speed={45} class="hidden md:block w-full max-w-[320px]">
        {#each secondColumn as item (item.id)}
          {@render testimonialCard(item)}
        {/each}
      </InfiniteSlider>

      <!-- Column 3 (Hidden on mobile and tablet, visible on lg+) -->
      <InfiniteSlider direction="vertical" speed={36} class="hidden lg:block w-full max-w-[320px]">
        {#each thirdColumn as item (item.id)}
          {@render testimonialCard(item)}
        {/each}
      </InfiniteSlider>
    </div>
  </div>
</section>
