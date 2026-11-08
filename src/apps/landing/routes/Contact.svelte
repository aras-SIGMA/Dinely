<script lang="ts">
  import AnimatedContent from '@/components/ui/AnimatedContent.svelte';
  import SplitText from '@/components/ui/SplitText.svelte';
  import { uiStore } from '@/stores/ui.svelte';
  import Navbar from '../components/Navbar.svelte';
  import Footer from '../components/Footer.svelte';

  type FormErrors = {
    nama?: string;
    noHp?: string;
    email?: string;
    pesan?: string;
  };

  let nama = $state('');
  let noHp = $state('');
  let email = $state('');
  let pesan = $state('');
  let errors = $state<FormErrors>({});
  let sent = $state(false);

  const inputClass = (error?: string) =>
    `w-full rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
      error ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300'
    }`;

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const errs: FormErrors = {};
    if (!nama.trim()) errs.nama = 'Nama lengkap wajib diisi.';
    if (!noHp.trim()) errs.noHp = 'Nomor HP wajib diisi.';
    else if (!/^\+?[\d\s()-]{8,16}$/.test(noHp.trim())) errs.noHp = 'Format nomor HP tidak valid.';
    if (!email.trim()) errs.email = 'Email wajib diisi.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Format email tidak valid.';
    if (!pesan.trim()) errs.pesan = 'Pesan wajib diisi.';
    errors = errs;
    if (Object.keys(errs).length === 0) sent = true;
  }

  function resetForm() {
    nama = '';
    noHp = '';
    email = '';
    pesan = '';
    errors = {};
    sent = false;
  }

  const contactFaqs = [
    {
      id: 'aktivasi',
      q: 'Berapa lama proses aktivasi subdomain menu digital?',
      a: 'Sangat cepat — setelah berlangganan, Anda cukup memilih nama subdomain, mengisi menu, dan website Anda tampil dalam waktu kurang dari 5 menit. Panduan langkah demi langkah tersedia langsung di dashboard RestoLink.'
    },
    {
      id: 'komisi',
      q: 'Apakah benar RestoLink tidak memotong komisi penjualan?',
      a: 'Benar. Seluruh hasil penjualan menu digital dan pemesanan QR meja 100% milik pelaku usaha. RestoLink hanya memungut biaya langganan flat bulanan, tanpa potongan per transaksi.'
    },
    {
      id: 'setup',
      q: 'Bagaimana jika saya kesulitan setup printer kasir atau layar dapur?',
      a: 'Tim kami siap mendampingi. Kirimkan pesan lewat formulir ini dan kami akan memandu konfigurasi printer POS maupun Kitchen Display System hingga berhasil — tanpa biaya tambahan.'
    },
    {
      id: 'demo',
      q: 'Bisa minta demo langsung bersama tim di lokasi?',
      a: 'Tentu. Ajukan permintaan kunjungan melalui formulir ini; Tim Kepiting Purba — SMK Taruna Bhakti akan menjadwalkan sesi demonstrasi langsung layanan RestoLink di basecamp kami.'
    }
  ];

  let openFaqId = $state<string | null>(null);

  function toggleFaq(id: string) {
    openFaqId = openFaqId === id ? null : id;
  }
</script>

<div class="relative flex min-h-screen flex-col overflow-x-hidden bg-white font-sans text-slate-900">
  <Navbar currentPath="/hubungi-kami" />

  <main class="relative flex-1 pb-16 pt-24 sm:pb-24 sm:pt-32">
    <!-- Ambient Radial Glow -->
    <div
      class="pointer-events-none absolute inset-x-0 top-12 -z-10 flex items-start justify-center overflow-hidden"
    >
      <div
        class="h-[420px] w-[820px] rounded-full bg-gradient-to-tr from-brand-100/50 via-amber-100/30 to-orange-100/40 opacity-75 blur-3xl"
      ></div>
    </div>

    <!-- Hiasan Background: Dot grid halus di area atas + glow lembut di bawah -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1200px] bg-[radial-gradient(circle,#cbd5e140_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_85%_65%_at_50%_0%,#000_35%,transparent_100%)]"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute -right-52 bottom-64 -z-10 h-[400px] w-[560px] rounded-full bg-gradient-to-tr from-amber-100/30 via-orange-100/25 to-brand-100/35 opacity-60 blur-3xl"
      aria-hidden="true"
    ></div>

    <!-- ========================================================================= -->
    <!-- SECTION 1: HEADER HALAMAN (Hero serupa Beranda, Fitur, & Tentang Kami)    -->
    <!-- ========================================================================= -->
    <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8" aria-labelledby="contact-headline">
      <div class="mx-auto max-w-4xl text-center">
        <AnimatedContent distance={20} duration={0.5}>
          <div
            class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-950"
          >
            BANTUAN &amp; KONSULTASI
          </div>
        </AnimatedContent>

        <h1
          id="contact-headline"
          class="mt-6 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight"
        >
          <SplitText
            text="Tim Kami Siap Membantu,"
            splitType="chars"
            delay={25}
            duration={0.7}
            ready={uiStore.isAppReady}
          /><br />
          <span class="text-brand-600 block sm:inline">
            <SplitText
              text="Kapan Saja Anda Butuh."
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
            Punya pertanyaan seputar aktivasi subdomain, panduan paket langganan, atau bantuan
            integrasi? Kirimkan pesan Anda — tim teknis RestoLink balas maksimal 1x24 jam kerja.
          </p>
        </AnimatedContent>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 2: KANAL BANTUAN (KIRI) + FORMULIR KONTAK (KANAN)                 -->
    <!-- ========================================================================= -->
    <section
      id="formulir-kontak"
      class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 scroll-mt-32"
      aria-label="Kanal Bantuan dan Formulir Pesan RestoLink"
    >
      <div class="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <!-- Kolom Kiri: Narasi, Kanal Langsung, & Komitmen -->
        <AnimatedContent distance={36} duration={0.6}>
          <div>
            <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
              Kenali Kanal Bantuan
            </span>
            <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Konsultasi Langsung, Tanpa Biaya
            </h2>
            <p class="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
              Tim kecil kami mengenal keseharian pedagang — karena itu setiap pesan dibalas
              langsung oleh orang yang benar-benar paham teknis, bukan bot otomatis.
            </p>

            <!-- Kanal Langsung (1 Kartu Compact) -->
            <div class="mt-8 rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.02]">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t-2xl"
              >
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    <path d="M8 12h.01" />
                    <path d="M12 12h.01" />
                    <path d="M16 12h.01" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp Support</p>
                  <p class="font-display text-sm font-bold text-slate-950 transition-colors group-hover:text-brand-600 sm:text-base">
                    (+62) 812-3456-7890
                  </p>
                </div>
                <span class="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span class="size-1.5 rounded-full bg-emerald-500"></span>
                  Respon &lt; 15 menit
                </span>
              </a>

              <div class="border-t border-slate-100"></div>

              <a
                href="mailto:support@restolink.id"
                class="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Bantuan</p>
                  <p class="font-display text-sm font-bold text-slate-950 transition-colors group-hover:text-brand-600 sm:text-base">
                    support@restolink.id
                  </p>
                </div>
                <span class="ml-auto shrink-0 text-xs font-medium text-slate-500">Balas &lt; 1x24 jam</span>
              </a>

              <div class="border-t border-slate-100"></div>

              <div class="flex items-center gap-4 px-5 py-4">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jam Operasional</p>
                  <p class="font-display text-sm font-bold text-slate-950 sm:text-base">
                    Senin–Jumat 08.00–17.00 WIB
                  </p>
                </div>
                <span class="ml-auto shrink-0 text-right text-xs font-medium text-slate-500">
                  Sabtu 09.00–14.00 WIB
                </span>
              </div>
            </div>
          </div>
        </AnimatedContent>

        <!-- Kolom Kanan: Formulir Pesan / Konfirmasi Sukses -->
        <AnimatedContent distance={36} duration={0.6} delay={0.15}>
          <div class="lg:sticky lg:top-32">
            {#if sent}
              <div class="rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-md shadow-slate-900/[0.02]">
                <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                    <path d="m9 11 3 3L22 4" />
                  </svg>
                </div>
                <h2 class="mt-5 font-display text-xl font-bold text-slate-950 sm:text-2xl">
                  Pesan Berhasil Dikirim
                </h2>
                <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Terima kasih, {nama.trim()}! Tim kami akan menghubungi Anda melalui
                  <strong class="text-slate-900">{email.trim()}</strong> dalam 1x24 jam kerja.
                </p>
                <button
                  type="button"
                  onclick={resetForm}
                  class="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Kirim Pesan Lain
                </button>
              </div>
            {:else}
              <form
                novalidate
                onsubmit={handleSubmit}
                class="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-900/[0.02] sm:p-8"
              >
                <div class="space-y-5">
                  <!-- Nama Lengkap -->
                  <div class="flex flex-col gap-1.5">
                    <label for="kontak-nama" class="text-sm font-medium text-slate-700">
                      Nama Lengkap <span class="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="kontak-nama"
                      name="nama"
                      type="text"
                      autocomplete="name"
                      placeholder="cth. Nia Kusuma"
                      bind:value={nama}
                      aria-invalid={errors.nama ? 'true' : undefined}
                      class="h-11 px-3 {inputClass(errors.nama)}"
                    />
                    {#if errors.nama}<p class="text-xs text-red-600">{errors.nama}</p>{/if}
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- No HP -->
                    <div class="flex flex-col gap-1.5">
                      <label for="kontak-nohp" class="text-sm font-medium text-slate-700">
                        Nomor HP <span class="text-red-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="kontak-nohp"
                        name="noHp"
                        type="tel"
                        autocomplete="tel"
                        placeholder="cth. 0812-3456-7890"
                        bind:value={noHp}
                        aria-invalid={errors.noHp ? 'true' : undefined}
                        class="h-11 px-3 {inputClass(errors.noHp)}"
                      />
                      {#if errors.noHp}<p class="text-xs text-red-600">{errors.noHp}</p>{/if}
                    </div>

                    <!-- Email -->
                    <div class="flex flex-col gap-1.5">
                      <label for="kontak-email" class="text-sm font-medium text-slate-700">
                        Email <span class="text-red-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="kontak-email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        placeholder="cth. nia@kedaikak.com"
                        bind:value={email}
                        aria-invalid={errors.email ? 'true' : undefined}
                        class="h-11 px-3 {inputClass(errors.email)}"
                      />
                      {#if errors.email}<p class="text-xs text-red-600">{errors.email}</p>{/if}
                    </div>
                  </div>

                  <!-- Pesan -->
                  <div class="flex flex-col gap-1.5">
                    <label for="kontak-pesan" class="text-sm font-medium text-slate-700">
                      Pesan Yang Ingin Disampaikan <span class="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="kontak-pesan"
                      name="pesan"
                      rows="5"
                      placeholder="Tuliskan pertanyaan atau kendala Anda, mis. aktivasi subdomain, panduan paket langganan, atau integrasi lainnya."
                      bind:value={pesan}
                      aria-invalid={errors.pesan ? 'true' : undefined}
                      class="py-2.5 px-3 {inputClass(errors.pesan)}"
                    ></textarea>
                    {#if errors.pesan}<p class="text-xs text-red-600">{errors.pesan}</p>{/if}
                  </div>

                  <!-- Aksi -->
                  <div class="pt-1">
                    <button
                      type="submit"
                      class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      Kirim Pesan
                      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </button>
                    <p class="mt-3 text-center text-xs text-slate-500">
                      Pesan Anda bersifat privat &amp; hanya dibaca oleh tim inti RestoLink.
                    </p>
                  </div>
                </div>
              </form>
            {/if}
          </div>
        </AnimatedContent>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SECTION 3: MINI FAQ ACCORDION                                             -->
    <!-- ========================================================================= -->
    <section
      id="faq-kontak"
      class="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 scroll-mt-32"
      aria-label="Pertanyaan Umum Seputar Bantuan"
    >
      <AnimatedContent distance={30} duration={0.6}>
        <div class="text-center">
          <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
            Pertanyaan Umum
          </span>
          <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Sebelum Menghubungi, Mungkin Ini Jawabannya
          </h2>
        </div>
      </AnimatedContent>

      <div class="mt-8 space-y-3">
        {#each contactFaqs as faq, index}
          {@const isOpen = openFaqId === faq.id}
          <AnimatedContent distance={24} duration={0.5} delay={Math.min(index * 0.08, 0.32)}>
            <div class="rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.02] transition-all overflow-hidden {isOpen ? 'border-brand-200 ring-1 ring-brand-100' : 'hover:border-slate-300'}">
              <button
                type="button"
                class="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
                onclick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <span class="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-sm text-slate-500 transition-transform duration-200 {isOpen ? 'rotate-45 bg-brand-100 font-bold text-brand-700' : ''}">
                  +
                </span>
              </button>
              {#if isOpen}
                <div class="border-t border-slate-100 px-5 pb-5 pt-3 text-xs sm:text-sm leading-relaxed text-slate-600 animate-slide-in-up">
                  {faq.a}
                </div>
              {/if}
            </div>
          </AnimatedContent>
        {/each}
      </div>
    </section>
  </main>

  <Footer />
</div>
