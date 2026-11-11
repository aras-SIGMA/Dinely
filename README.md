# Dinely

> Platform web multi-tenant untuk UMKM kuliner Indonesia: website menu digital mandiri per usaha melalui subdomain dinamis, dashboard pengelolaan terpusat, dan alur pemesanan sederhana.

Satu basis kode melayani seluruh tenant. Setiap usaha mendapatkan alamat web sendiri (contoh: `dapur-nia.dinely.site`) tanpa perlu membangun, menyewa hosting, atau merawat website secara teknis.

---

## Daftar Isi

- [Mengapa Dinely Dibangun](#mengapa-dinely-dibangun)
- [Masalah yang Diselesaikan](#masalah-yang-diselesaikan)
- [Solusi](#solusi)
- [Peran Pengguna](#peran-pengguna)
- [Fitur Utama](#fitur-utama)
- [Model Paket Layanan](#model-paket-layanan)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Memulai](#panduan-memulai)
- [Pengujian](#pengujian)
- [Alur Kerja Git Tim](#alur-kerja-git-tim)
- [Dokumentasi Lanjutan](#dokumentasi-lanjutan)
- [Keamanan](#keamanan)

---

## Mengapa Dinely Dibangun

UMKM kuliner Indonesia melayani pesanan dari banyak kanal sekaligus (media sosial, WhatsApp, buku menu meja, nota kertas) tanpa sistem yang saling terhubung. Akibatnya informasi menu dan harga tersebar, pesanan tercecer, dan pemilik menghabiskan waktu untuk pekerjaan administratif yang seharusnya bisa diotomatiskan.

Data yang menjadi dasar perancangan produk:

- **95,17%** pelaku usaha menggunakan aplikasi perpesanan untuk berdagang daring.
- **60-70%** masih mengandalkan pencatatan manual (buku kas atau nota kertas).
- Ketiadaan sistem terpadu menyumbang tingkat **galat pesanan dan stok hingga 10%**.
- **45% pesan masuk** hanya berisi pertanyaan berulang soal harga dan ketersediaan menu.
- Keterlambatan membalas pesan **5-30 menit** pada jam sibuk berpotensi menghilangkan hingga **72% peluang penjualan**.

Dinely dibangun untuk menutup celah tersebut. Tujuannya bukan menjamin peningkatan penjualan secara langsung, melainkan menyelesaikan akar masalah operasional: pemilik kesulitan membuat dan merawat website sendiri, perubahan menu harus diperbarui di banyak media, dan pesanan sulit dilacak statusnya secara seragam.

---

## Masalah yang Diselesaikan

| Kode | Masalah | Dampak |
|------|---------|--------|
| M1 | Perubahan menu dan harga harus diperbarui di banyak media sekaligus | Informasi tidak konsisten, waktu pemilik terbuang |
| M2 | UMKM mikro sulit membuat dan merawat website sendiri (biaya, waktu, keterampilan) | Tidak memiliki kanal digital mandiri |
| M3 | Pesanan dari berbagai kanal sulit dicatat dan dilacak statusnya | Pesanan tercecer, tingkat galat tinggi |
| M4 | Usaha yang lebih besar membutuhkan pembagian peran (dapur, pelayan, stok) | Koordinasi operasional tidak terstruktur |
| M5 | Pemilik sulit memantau kondisi menu, pesanan, dan aktivitas dari satu tempat | Tidak ada visibilitas terpusat |

---

## Solusi

Dinely menjadi pusat kendali tunggal bagi UMKM kuliner untuk:

1. **Memiliki website menu digital sendiri** melalui subdomain platform, aktif seketika tanpa instalasi teknis.
2. **Mengelola profil usaha, kategori, menu, harga, dan ketersediaan** dari satu dashboard.
3. **Menerima dan mencatat pesanan** secara terstruktur agar tidak lagi tercecer di WhatsApp atau nota kertas.
4. **Membayar langganan paket** secara digital dengan aktivasi otomatis setelah pembayaran tervalidasi.

Platform melayani banyak usaha dari satu basis kode aplikasi, bukan satu instance per usaha. Perbaikan bug sekali deploy berlaku untuk seluruh tenant.

---

## Peran Pengguna

| Peran | Deskripsi |
|-------|-----------|
| **Admin Platform** | Mengelola layanan secara keseluruhan: data pengguna dan usaha, paket, status pembayaran, serta penanganan masalah aktivasi. Satu admin mengelola seluruh tenant. |
| **Pemilik Usaha (Tenant Owner)** | Mendaftar, mengisi info usaha, memilih paket, membayar langganan, lalu mengelola profil, menu, ketersediaan, tampilan website, dan pesanan. |
| **Staff UMKM** | Membantu operasional sesuai akses yang diberikan pemilik. Tahap pengembangan lanjutan di luar cakupan MVP. |
| **Pembeli (Guest)** | Mengunjungi website tenant untuk melihat profil, menu, harga, dan ketersediaan, lalu membuat pesanan tanpa wajib memiliki akun (guest checkout). |

---

## Fitur Utama

- Registrasi dan login Pemilik Usaha serta Admin Platform berbasis Supabase Auth.
- Pengelolaan profil usaha: nama, logo, foto, kontak, dan deskripsi.
- Pengelolaan kategori dan menu lengkap: harga, deskripsi, foto, dan status ketersediaan.
- Website publik tenant responsif yang menampilkan profil, menu, harga, dan kontak.
- Pembayaran langganan paket melalui Midtrans dengan validasi webhook di sisi server.
- Aktivasi tenant dan paket otomatis setelah pembayaran settlement tervalidasi.
- Uji coba gratis 30 hari, lalu perpanjangan bulanan, 6 bulanan, atau tahunan.
- Alur pemesanan sederhana dengan pembaruan status (baru, diproses, selesai).
- Dashboard Admin Platform untuk memantau pendaftaran, usaha, paket, dan status pembayaran.
- Chatbot AI Linka pada landing page utama (Google Gemini API) untuk menjawab pertanyaan calon pengguna.
- Isolasi data antar-tenant melalui Row Level Security Supabase.

---

## Model Paket Layanan

| Paket | Sasaran | Fokus Fitur | Status |
|-------|---------|-------------|--------|
| **Mikro** | Usaha yang dikelola sendiri oleh pemilik | Profil, menu, kontak, pemesanan dasar | Diimplementasikan |
| **Kecil** | Usaha dengan beberapa staf | Fitur Mikro, pesanan lebih lengkap, akses Staff, promo | Rencana lanjutan |
| **Menengah** | Usaha dengan peran operasional terpisah | Fitur Kecil, manajemen meja, dapur, stok, laporan | Rencana lanjutan |

- **Trial**: 30 hari gratis di awal untuk siklus percobaan.
- **Perpanjangan**: bulanan, 6 bulanan, atau tahunan dengan harga lebih hemat untuk periode panjang.
- **Add-on**: Custom Domain, Laporan Lanjutan, Multi-Cabang, Promo & Voucher, Notifikasi WhatsApp. Dibeli terpisah dari paket.
- Chatbot AI bukan add-on tenant, melainkan fitur platform-level yang hanya ada di landing page utama.

---

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Svelte** | 5.x | Framework UI reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **TypeScript** | 5.9.x | Keamanan tipe statis di seluruh basis kode |
| **Vite** | 7.x | Build tool, dev server, dan bundler |
| **Tailwind CSS** | 4.x | Utility-first styling untuk landing, dashboard, dan tenant site |
| **sv-router** | 0.19.x | Routing berbasis konfigurasi untuk SPA dan multi-halaman |
| **GSAP** | 3.x | Animasi kompleks pada landing page |
| **Lenis** | 1.x | Smooth scroll |
| **canvas-confetti** | 1.x | Efek perayaan pada interaksi tertentu |

### Backend

| Teknologi | Fungsi |
|-----------|--------|
| **Vercel Serverless Functions** (Node.js) | Endpoint API: Midtrans, Cloudinary, Gemini, tenant menu |
| **Supabase Postgres** | Basis data relasional |
| **Supabase Auth** | Registrasi dan autentikasi pengguna |
| **Supabase Row Level Security (RLS)** | Isolasi dan proteksi data antar-tenant |
| **Supabase RPC / Triggers** | Business logic server-side (order RPC, trigger signup) |

### Integrasi Pihak Ketiga

| Layanan | Fungsi |
|---------|--------|
| **Midtrans** | Payment gateway untuk pembayaran langganan paket (bukan pembayaran pesanan pembeli) |
| **Cloudinary** | Penyimpanan dan optimasi gambar (logo usaha, foto menu) dengan konversi WebP |
| **Google Gemini API** | Chatbot AI Linka pada landing page utama |

### Hosting dan Infrastruktur

| Teknologi | Fungsi |
|-----------|--------|
| **Vercel** | Deployment aplikasi dan routing wildcard subdomain `*.dinely.site` |

### Tooling

| Teknologi | Fungsi |
|-----------|--------|
| **svelte-check** | Pemeriksaan tipe dan diagnostik Svelte |
| **tsx** | Menjalankan skrip pengujian API berbasis TypeScript |

---

## Arsitektur Sistem

Proyek ini merupakan **satu proyek Vite terpadu** yang memuat tiga bagian aplikasi:

### 1. Landing Page Utama Platform

Halaman pemasaran Dinely: beranda, fitur, harga, dan pendaftaran. Setiap halaman memiliki rute sendiri agar dapat diindeks mesin pencari secara terpisah (SEO). Chatbot AI hanya muncul di sini.

### 2. Dashboard Pengelolaan

Single Page Application dengan rute terproteksi dan autentikasi Supabase. Memiliki dua varian:

- **Dashboard Pemilik Usaha**: terbatas pada tenant miliknya, dibatasi RLS.
- **Dashboard Admin Platform**: akses lintas-tenant dengan role khusus.

### 3. Website Publik Tenant

Halaman menu digital setiap usaha, diakses melalui subdomain (`{slug}.dinely.site`). Resolusi tenant dilakukan secara runtime di sisi klien dari hostname, bukan hasil build terpisah per tenant. Satu kode frontend melayani seluruh tenant.

### Resolusi Tenant Berdasarkan Subdomain

Alur resolusi saat pembeli mengakses `https://dapur-nia.dinely.site`:

1. Aplikasi dimuat di browser dan membaca `window.location.hostname`.
2. Bagian subdomain diekstrak sebagai slug tenant (`dapur-nia`).
3. Query ke Supabase mencari baris pada tabel `tenants` dengan `subdomain = slug`.
4. Selama data belum diterima, tampilkan skeleton atau loading state.
5. Jika slug tidak ditemukan atau status tenant tidak aktif, tampilkan halaman "usaha tidak ditemukan" tanpa fallback ke data tenant lain.
6. Akses data tetap dibatasi RLS Supabase sebagai garis pertahanan terakhir.

Prioritas resolusi: parameter query (`?tenant=slug` untuk dev dan preview) → domain produksi → `slug.localhost` → domain multi-level generik.

### Alur Pembayaran dan Aktivasi

Prinsip utama: aktivasi tenant dan paket hanya boleh terjadi dari hasil validasi server terhadap notifikasi Midtrans, tidak boleh dari redirect browser.

```
[Client] Pemilik pilih paket
      -> [Server] buat transaksi Midtrans, simpan status "pending"
      -> [Midtrans] proses pembayaran
      -> [Midtrans] kirim webhook ke endpoint server Dinely
      -> [Server] validasi signature dan status notifikasi
      -> [Server] jika valid (settlement/capture) -> update transaksi dan aktifkan tenant
      -> [Client] polling atau subscribe status untuk menampilkan hasil ke pemilik
```

Halaman "pembayaran berhasil" di browser hanya umpan balik UI, bukan pemicu aktivasi. Skenario sukses, pending, gagal/expired, dan notifikasi berulang (idempotency) ditangani di server.

### Catatan Arsitektur

- Model rendering bersifat **client-side** (bukan server-side rendering). Trade-off ini diterima secara sadar: prioritas produk adalah kemudahan pengelolaan menu dan pesanan, sementara landing page utama tetap SEO-friendly karena memakai routing multi-halaman.
- Domain wildcard `*.dinely.site` dikonfigurasi di level proyek Vercel, terlepas dari framework frontend.
- Resolusi tenant tidak mengandalkan middleware server, sehingga tidak membutuhkan SSR.

---

## Struktur Proyek

```
dinely/
├── docs/                      # Dokumentasi PRD, arsitektur, notulen, laporan
│   ├── product/               # PRD, user flows, skema database, feature spec
│   ├── qa/                    # Skenario uji dan laporan UAT
│   ├── reports/               # Laporan teknis per modul
│   └── notulen/               # Catatan keputusan teknis tim
│
├── src/                       # FRONTEND (Svelte 5 + Tailwind v4 + sv-router)
│   ├── apps/
│   │   ├── landing/           # Website publik Dinely (beranda, fitur, harga, auth)
│   │   ├── dashboard/         # Dashboard pemilik usaha (menu, pesanan, langganan)
│   │   ├── admin/             # Dashboard admin platform (audit, override tenant)
│   │   └── tenant-site/       # Website menu publik tenant (katalog, checkout)
│   ├── components/ui/         # Komponen UI atomik dan bersama
│   ├── lib/                   # Utility bersama (resolver tenant, Supabase, chatbot)
│   ├── stores/                # State management Svelte 5 (auth, cart, orders, chatbot)
│   └── types/                 # Interface TypeScript bersama
│
├── api/                       # BACKEND (Vercel Serverless Functions)
│   ├── _lib/                  # Helper auth, HTTP, dan Supabase admin
│   ├── midtrans/              # Endpoint create transaksi dan webhook validator
│   ├── cloudinary/            # Generator signature upload gambar Cloudinary
│   ├── gemini/                # Proxy AI chatbot dan knowledge base
│   └── tenant/                # Endpoint menu tenant
│
├── supabase/                  # DATABASE POSTGRES DAN KEAMANAN
│   ├── migrations/            # Skema tabel, RLS policies, RPC, dan trigger
│   └── seed.sql               # Data katalog paket dan akun admin perdana
│
├── vercel.json                # Konfigurasi SPA rewrite, header keamanan, CSP
└── package.json               # Dependensi dan skrip npm
```

---

## Panduan Memulai

### 1. Prasyarat

- **Node.js**: versi 20.x atau 22.x LTS ([unduh](https://nodejs.org/))
- **Git**

### 2. Kloning dan Instalasi

Folder `node_modules` tidak disertakan di Git. Jalankan perintah berikut di root proyek:

```bash
git clone https://github.com/aras-SIGMA/Dinely.git
cd Dinely
npm install
```

### 3. Konfigurasi Environment

Salin template `.env.example` menjadi `.env`:

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

Isi nilai kredensial pada `.env`. Hubungi koordinator tim untuk memperoleh nilai aktual.

```dotenv
# Supabase (Client dan Serverless)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-your-key
MIDTRANS_IS_PRODUCTION=false

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Gemini AI (Landing Chatbot)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
GEMINI_SUGGESTION_MODEL=gemini-3.5-flash-lite
```

> Variabel dengan prefiks `VITE_` aman diekspos ke klien. Variabel tanpa prefiks hanya tersedia di serverless function dan tidak boleh bocor ke frontend.

### 4. Menjalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173).

Untuk menguji website tenant secara lokal, gunakan subdomain `localhost`:

- [http://dapur-nia.localhost:5173](http://dapur-nia.localhost:5173)

Alternatif tanpa konfigurasi DNS: gunakan override query parameter pada host platform.

- [http://localhost:5173/?tenant=dapur-nia](http://localhost:5173/?tenant=dapur-nia)

### 5. Skrip npm

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Menjalankan dev server Vite |
| `npm run build` | Mengompilasi aplikasi untuk produksi |
| `npm run preview` | Melihat pratinjau hasil build produksi |
| `npm run check` | Memeriksa tipe TypeScript dan diagnostik Svelte |
| `npm run test:api` | Menjalankan seluruh rangkaian pengujian API (BE-01 hingga BE-05) |

---

## Pengujian

Pengujian backend mencakup lima rangkaian yang dijalankan melalui `npm run test:api`:

| Rangkaian | Cakupan |
|-----------|---------|
| **BE-01** | Endpoint pembuatan transaksi Midtrans: autentikasi, validasi input, anti-trial abuse, throttling transaksi pending |
| **BE-02** | Webhook Midtrans: validasi signature, idempotency, perpanjangan berakumulasi, pemulihan partial failure |
| **BE-03** | Signature upload Cloudinary: validasi kategori, pencegahan path traversal, anti-IDOR lintas tenant |
| **BE-04** | Proxy chatbot Gemini: validasi input, normalisasi history, fallback model, streaming SSE |
| **BE-05** | Audit keamanan: pencegahan kebocoran secret key, sanitasi bundle produksi |

Jalankan pemeriksaan tipe dan pengujian sebelum mengajukan pull request:

```bash
npm run check
npm run test:api
npm run build
```

---

## Alur Kerja Git Tim

Untuk menjaga kolaborasi tetap rapi dan meminimalkan konflik kode, patuhi konvensi branch berikut.

| Branch | Peran |
|--------|-------|
| `main` | Rilis stabil produksi. Commit langsung dilarang. |
| `develop` | Branch integrasi utama. Seluruh pekerjaan fitur digabung ke sini. |
| `feature/<nama-fitur>` | Branch kerja setiap anggota tim, dibuat dari `develop`. |

Contoh penamaan branch:

- `feature/database-schema-and-rls`
- `feature/subdomain-resolver`
- `feature/auth-and-registration`
- `feature/midtrans-payment`
- `feature/menu-and-cloudinary-upload`
- `feature/tenant-site-and-order`
- `feature/order-management`
- `feature/admin-and-landing`

### Alur Pengerjaan Fitur Baru

```bash
# 1. Pastikan branch develop lokal terbaru
git checkout develop
git pull origin develop

# 2. Buat branch baru untuk fitur yang dikerjakan
git checkout -b feature/nama-fitur

# 3. Kerjakan kode, lalu simpan perubahan
git add .
git commit -m "feat: deskripsi singkat perubahan"

# 4. Push branch fitur ke remote
git push -u origin feature/nama-fitur

# 5. Buat Pull Request ke branch develop untuk direview
```

### Konvensi Commit

Gunakan prefiks tipe konvensional agar riwayat commit mudah dibaca:

- `feat:` fitur baru
- `fix:` perbaikan bug
- `docs:` perubahan dokumentasi
- `refactor:` perubahan struktur tanpa mengubah perilaku
- `chore:` pemeliharaan, dependensi, atau konfigurasi

---

## Dokumentasi Lanjutan

| Dokumen | Isi |
|---------|-----|
| `docs/MILESTONES.md` | Roadmap dan checklist milestone tim |
| `docs/TIM_TASKS.md` | Pembagian tugas dan tanggung jawab tim |
| `docs/product/01_PRD.md` | Product Requirements Document: scope MVP dan fitur lanjutan |
| `docs/product/02_ARCHITECTURE.md` | Arsitektur teknis, resolusi subdomain, alur keamanan pembayaran |
| `docs/product/03_DATABASE_SCHEMA.md` | Skema tabel Postgres dan pola Row Level Security |
| `docs/product/04_USER_FLOWS.md` | Alur pengguna langkah demi langkah per peran dan checklist UAT |
| `docs/product/05_FEATURE_SPEC.md` | Kriteria penerimaan setiap modul |
| `docs/qa/` | Skenario uji database dan laporan eksekusi UAT |
| `docs/reports/` | Laporan teknis per modul dan perbaikan keamanan |
| `docs/panduan_integrasi_email_otp_supabase_gmail.md` | Panduan integrasi email OTP Supabase |

---

## Keamanan

Prinsip keamanan yang diterapkan pada platform:

- Setiap tabel yang menyimpan data tenant memiliki kolom `tenant_id` dan RLS policy yang memfilter berdasarkan kepemilikan pengguna.
- Query publik hanya dapat membaca data tenant aktif, dan hanya kolom yang memang untuk konsumsi publik.
- Webhook Midtrans divalidasi signature-nya di server sebelum dipercaya.
- Role Admin Platform memiliki policy RLS terpisah yang eksplisit mengizinkan akses lintas-tenant. Service role key tidak pernah dipakai di klien.
- Upload gambar ke Cloudinary dibatasi ukuran dan tipe file, serta dikompresi ke WebP.
- Header keamanan HTTP dikonfigurasi melalui `vercel.json`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan `Permissions-Policy`.

Jika menemukan potensi kerentanan, laporkan secara privat kepada koordinator tim sebelum membuka isu publik.

---

## Tim

Dikembangkan oleh **Tim Kepiting Purba**, SMK Taruna Bhakti, untuk Lomba GTNIC 2026.

Lisensi dan ketentuan penggunaan menunggu penetapan tim.
