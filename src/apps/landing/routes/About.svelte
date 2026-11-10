<script lang="ts">
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import SplitText from '@/components/ui/SplitText.svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import { uiStore } from '@/stores/ui.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  // Foto profil tim: letakkan file di src/assets/team dengan nama:
  // stefano.jpg, adi.jpg, tubagus.jpg — kartu otomatis memakai foto bila file ada,
  // fallback ke inisial bila tidak. Resolusi via glob import per dokumentasi Vite:
  // https://vite.dev/guide/features#glob-import
  const teamPhotos = import.meta.glob<string>('/src/assets/team/*.{jpg,jpeg,png,webp,avif}', {
    eager: true,
    import: 'default'
  });
  const photoFor = (fileName: string): string | null =>
    teamPhotos[`/src/assets/team/${fileName}`] ?? null;

  const developers: { id: string; name: string; role: string; photo: string | null; initials: string; avatarBg: string }[] = [
    {
      id: 'fullstack',
      name: 'Stefano Hari Prasanto .G',
      role: 'Fullstack Developer',
      photo: photoFor('stefano.jpeg'),
      initials: 'SH',
      avatarBg: 'from-orange-100 to-amber-100'
    },
    {
      id: 'frontend',
      name: 'Adi Setio Nugroho',
      role: 'Frontend Developer',
      photo: photoFor('adi.png'),
      initials: 'AN',
      avatarBg: 'from-blue-100 to-indigo-100'
    },
    {
      id: 'backend-qa',
      name: 'Tubagus Kevin Keynaro Christiawan',
      role: 'Backend & QA Engineer',
      photo: photoFor('tubagus.jpeg'),
      initials: 'TK',
      avatarBg: 'from-emerald-100 to-teal-100'
    }
  ];
</script>

<div class="relative flex min-h-screen flex-col overflow-x-hidden bg-white font-sans text-slate-900">
  <Navbar currentPath="/tentang-kami" />

  <main class="relative flex-1 pb-16 pt-24 sm:pb-24 sm:pt-32">
    <!-- Ambient Radial Glow -->
    <div
      class="pointer-events-none absolute inset-x-0 top-12 -z-10 flex items-start justify-center overflow-hidden"
    >
      <div
        class="h-[420px] w-[820px] rounded-full bg-gradient-to-tr from-brand-100/50 via-amber-100/30 to-orange-100/40 opacity-75 blur-3xl"
      ></div>
    </div>

    <!-- ========================================================================= -->
    <!-- SECTION 1: HEADER HALAMAN (Hero serupa Beranda & Fitur)                   -->
    <!-- ========================================================================= -->
    <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8" aria-labelledby="about-headline">
      <div class="mx-auto max-w-4xl text-center">
        <AnimatedContent distance={20} duration={0.5}>
          <div
            class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950"
          >
            TENTANG DINELY
          </div>
        </AnimatedContent>

        <h1
          id="about-headline"
          class="mt-6 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
        >
          <SplitText
            text="Pemberdayaan Digital Mandiri,"
            splitType="chars"
            delay={25}
            duration={0.7}
            ready={uiStore.isAppReady}
          /><br />
          <span class="text-brand-600 block sm:inline">
            <SplitText
              text="Untuk Seluruh UMKM Kuliner."
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
            Dinely hadir sebagai jembatan teknologi bagi pedagang, warung, kedai kopi, dan restoran
            lokal agar memiliki platform pemesanan mandiri tanpa tercekik biaya komisi 20–30%.
          </p>
        </AnimatedContent>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 2: LOGO DINELY & KISAH SINGKAT APLIKASI                       -->
    <!-- ========================================================================= -->
    <section
      id="kisah"
      class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 scroll-mt-32"
      aria-label="Kisah Lahirnya Dinely"
    >
      <AnimatedContent distance={36} duration={0.6}>
        <div class="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/[0.03] sm:p-10 lg:p-12">
          <div class="grid items-center gap-10 lg:grid-cols-12">
            <!-- Sisi Kiri: Tampilan Logo & Identitas Brand -->
            <div class="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-center lg:col-span-4 lg:p-10">
              <img
                src="/dinely-icon.svg"
                alt="Ikon Dinely"
                class="size-24 sm:size-28 rounded-3xl shadow-lg shadow-brand-600/20"
                draggable="false"
              />
            </div>

            <!-- Sisi Kanan: Narasi Kisah Mengapa Aplikasi Ini Dibuat -->
            <div class="lg:col-span-8">
              <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Kisah di Balik Dinely
              </span>
              <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Mengapa Kami Membangun Dinely?
              </h2>

              <div class="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
                <p>
                  Di era digital saat ini, pengusaha kuliner mandiri sering terjebak dalam dilema besar:
                  bergabung dengan aplikasi pesan-antar besar berarti harus merelakan <strong class="text-slate-900">20% hingga 30% margin keuntungan</strong>
                  terpotong sebagai biaya komisi, sementara mengandalkan cara manual membuat staf kewalahan
                  mencatat pesanan lewat chat WhatsApp atau nota kertas yang rentan terselip.
                </p>
                <p>
                  Kenyataan di lapangan membuktikan bahwa biaya sewa domain dan hosting yang mahal serta
                  kerumitan teknis sering menjadi penghalang UMKM lokal untuk memiliki identitas digital
                  profesional mereka sendiri.
                </p>
                <p>
                  <strong class="text-brand-600">Dinely lahir sebagai jawaban yang adil.</strong> Kami
                  menyediakan website menu digital dengan subdomain mandiri instan, pemesanan QR code di meja
                  makan tanpa unduh aplikasi, dan antrean layar dapur sinkron real-time. Semua operasional modern
                  ini dapat dinikmati dengan biaya langganan flat terjangkau — keuntungan penjualan 100% tetap
                  milik pelaku usaha.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContent>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 3: VISI & MISI (2 Card dengan Background Berbeda)                -->
    <!-- ========================================================================= -->
    <section
      id="visi-misi"
      class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 scroll-mt-32"
      aria-label="Visi dan Misi"
    >
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
          Landasan Kami
        </span>
        <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Visi &amp; Misi Dinely
        </h2>
        <p class="mt-2 text-sm text-slate-600">
          Prinsip fundamental yang mengarahkan setiap baris kode dan inovasi fitur yang kami kembangkan.
        </p>
      </div>

      <div class="grid gap-6 sm:grid-cols-2 items-stretch">
        <!-- CARD 1: VISI (Warm Light Tone) -->
        <AnimatedContent distance={30} duration={0.6}>
          <div class="group relative flex h-full flex-col justify-between rounded-3xl border border-brand-200/90 bg-gradient-to-br from-brand-50/70 via-amber-50/50 to-orange-50/40 p-8 shadow-lg shadow-brand-900/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/15">
            <div>
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center rounded-full bg-brand-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  Visi
                </span>
                <div class="flex size-10 items-center justify-center rounded-xl bg-brand-100/80 text-brand-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-200/70">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 transition-transform duration-300 group-hover:rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
              </div>

              <h3 class="mt-6 font-display text-xl sm:text-2xl font-bold text-slate-950 transition-colors duration-300 group-hover:text-brand-950">
                Ekosistem Digital Mandiri Tanpa Potongan Komisi
              </h3>

              <p class="mt-4 text-sm sm:text-base leading-relaxed text-slate-700">
                Menjadi platform teknologi operasional kuliner nomor satu di Indonesia yang membebaskan
                seluruh pelaku UMKM dari ketergantungan komisi platform delivery pihak ketiga,
                menjadikan kemandirian finansial dan identitas brand milik mitra sepenuhnya.
              </p>
            </div>

            <div class="mt-8 border-t border-brand-200/60 pt-5">
              <p class="text-xs font-semibold text-brand-900">
                Target: Mendorong 100.000+ warung &amp; resto lokal mandiri secara digital.
              </p>
            </div>
          </div>
        </AnimatedContent>

        <!-- CARD 2: MISI (Deep Slate Contrast Tone) -->
        <AnimatedContent distance={30} duration={0.6} delay={0.15}>
          <div class="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-700 hover:shadow-2xl hover:shadow-brand-500/10">
            <div>
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center rounded-full bg-white/15 border border-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  Misi
                </span>
                <div class="flex size-10 items-center justify-center rounded-xl bg-white/10 text-brand-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:text-brand-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 transition-transform duration-300 group-hover:-rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" x2="4" y1="22" y2="15"/>
                  </svg>
                </div>
              </div>

              <h3 class="mt-6 font-display text-xl sm:text-2xl font-bold text-white transition-colors duration-300 group-hover:text-amber-100">
                Demokratisasi Teknologi Restoran Bintang Lima
              </h3>

              <ul class="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                <li class="flex items-start gap-2.5">
                  <svg class="size-4.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span><strong>Kemudahan Akses:</strong> Pemesanan instan lewat browser native tanpa membebani pelanggan dengan unduhan aplikasi.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <svg class="size-4.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span><strong>Efisiensi Operasional:</strong> Mengganti nota kertas manual dengan antrean dapur digital real-time tanpa resiko salah catat.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <svg class="size-4.5 mt-0.5 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span><strong>Transparansi Finansial:</strong> Tarif flat terjangkau tanpa biaya tersembunyi demi menjaga margin keuntungan pelaku usaha.</span>
                </li>
              </ul>
            </div>

            <div class="mt-8 border-t border-slate-800 pt-5">
              <p class="text-xs font-semibold text-slate-400">
                Komitmen: Kualitas performa tinggi, keamanan RLS multi-tenant, dan kemudahan bagi staf.
              </p>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 4: PROFIL DEVELOPER & JOBDESK (Fullstack, Frontend, QA, Backend)  -->
    <!-- ========================================================================= -->
    <section
      id="tim-leadership"
      class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8 scroll-mt-32"
      aria-label="Profil Pengembang Dinely"
    >
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
          Tim Leadership &amp; Engineering
        </span>
        <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          Para Pengembang di Balik Dinely
        </h2>
        <p class="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
          Karya kolaboratif dari <strong class="text-slate-900">Tim Kepiting Purba — SMK Taruna Bhakti</strong>,
          menyatukan rekayasa perangkat lunak modern, riset kebutuhan lapangan, dan standar pengujian industri.
        </p>
      </div>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each developers as dev, idx (dev.id)}
          <AnimatedContent distance={30} duration={0.6} delay={0.1 * (idx + 1)}>
            <article class="group h-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/[0.06]">
              <!-- Slot Foto Profil -->
              <div class="relative aspect-square w-full overflow-hidden bg-slate-100">
                {#if dev.photo}
                  <img src={dev.photo} alt="Foto {dev.name}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                {:else}
                  <div class="flex h-full w-full items-center justify-center bg-gradient-to-br {dev.avatarBg}">
                    <span class="font-display text-4xl font-bold tracking-tight text-slate-400">
                      {dev.initials}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Identitas -->
              <div class="p-5 text-center">
                <h3 class="font-display text-base font-bold text-slate-950">
                  {dev.name}
                </h3>
                <p class="mt-1 text-xs font-medium text-slate-500">
                  {dev.role}
                </p>
              </div>
            </article>
          </AnimatedContent>
        {/each}
      </div>
    </section>
  </main>

  <Footer />
</div>
