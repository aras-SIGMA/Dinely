# 🗺️ Roadmap Milestone RestoLink (MVP Lomba GTNIC 2026)

Dokumen ini adalah panduan kerja teknis seluruh tim RestoLink untuk menyelesaikan MVP dalam waktu **< 2 minggu (14 hari)**.

---

## 📋 Ringkasan Timeline & Matriks Milestone

| Milestone | Nama Modul | Estimasi | Target Branch | Status |
|---|---|---|---|---|
| **M0** | Setup Proyek & Scaffolding | H1 | `develop` | ✅ **Selesai** |
| **M1** | Database Schema, RLS, & Order RPC | H2–H3 | `feature/database-schema-and-rls` | ⏳ **Berikutnya** |
| **M2** | Subdomain Resolver Engine | H3–H4 | `feature/subdomain-resolver` | ⏹️ Antrean |
| **M3** | Autentikasi & Registrasi Pemilik | H4–H5 | `feature/auth-and-registration` | ⏹️ Antrean |
| **M4** | Pembayaran Midtrans (Serverless Webhook) | H6–H7 | `feature/midtrans-payment` | ⏹️ Antrean |
| **M5** | Menu Management & Cloudinary Image Upload | H8–H9 | `feature/menu-and-cloudinary-upload` | ⏹️ Antrean |
| **M6** | Website Publik Tenant & Guest Checkout | H9–H10 | `feature/tenant-site-and-order` | ⏹️ Antrean |
| **M7** | Dashboard Pesanan (Owner Order Tracking) | H11 | `feature/order-management` | ⏹️ Antrean |
| **M8** | Dashboard Admin Platform & Landing Page | H12–H13 | `feature/admin-and-landing` | ⏹️ Antrean |
| **M9** | UAT, Audit Keamanan RLS, & Demo Polish | H13–H14 | `feature/uat-and-hardening` | ⏹️ Antrean |

---

## 🛠️ Rincian Pengerjaan per Milestone

### Milestone 0: Setup & Scaffolding *(Selesai)*
* **Tujuan**: Membangun fondasi proyek, routing SPA, styling atomik, dan struktur repositori terpadu.
* **Deliverables**:
  * Svelte 5 + Vite + TypeScript + Tailwind CSS v4.
  * Router `sv-router` (history mode, lazy route components).
  * Komponen UI atomik: Button, Input, Card, Badge, Skeleton, Modal, Toast.
  * Resolver subdomain dasar (`src/lib/tenant-resolver.ts`).
  * Konfigurasi Vercel SPA rewrite (`vercel.json`).

---

### Milestone 1: Database Schema, RLS, & Order RPC
* **Branch**: `feature/database-schema-and-rls`
* **Dependensi**: M0
* **Tujuan**: Menyediakan skema database relasional lengkap, isolasi data multi-tenant (RLS), dan stored procedure pemesanan aman.
* **Langkah Konkret**:
  1. `supabase/migrations/001_initial_schema.sql`: DDL 8 tabel (`profiles`, `packages`, `tenants`, `transactions`, `categories`, `menu_items`, `orders`, `order_items`), ENUMs, index, dan view `public_tenants`.
  2. `supabase/migrations/002_rls_policies.sql`: Kebijakan RLS isolasi data per tenant (Owner only, Public read active, Admin full access). Blokir direct insert anon ke tabel transaksi & order.
  3. `supabase/migrations/003_order_rpc.sql`: Fungsi Postgres RPC `create_guest_order` dengan kalkulasi harga server-side dan generate `order_code` unik.
  4. `supabase/migrations/004_triggers.sql`: Sinkronisasi otomatis `auth.users` ke `public.profiles` dan proteksi manipulasi role.
  5. `supabase/seed.sql`: Data katalog paket Mikro aktif dan panduan akun `platform_admin`.
* **Kriteria Selesai (AC)**:
  * Seluruh file SQL berhasil dieksekusi di Supabase SQL Editor / Supabase CLI tanpa error.
  * Akun tenant A tidak dapat membaca atau mengubah data milik tenant B.

---

### Milestone 2: Subdomain Resolver Engine
* **Branch**: `feature/subdomain-resolver`
* **Dependensi**: M0, M1
* **Tujuan**: Menyelesaikan resolusi tenant secara dinamis di sisi browser berdasarkan hostname URL.
* **Langkah Konkret**:
  1. Validasi hostname runtime di `src/lib/tenant-resolver.ts`:
     * Mendukung `slug.restolink.site` (produksi).
     * Mendukung `slug.localhost:5173` (lokal).
     * Menolak `reserved subdomains` (`www`, `admin`, `api`, `app`, `auth`, `mail`, dll).
  2. Implementasi query view `public_tenants` saat subdomain terdeteksi.
  3. State handling: Tampilkan Skeleton Loading saat memuat data, dan halaman `NotFound.svelte` jika tenant tidak terdaftar atau non-aktif.
* **Kriteria Selesai (AC)**:
  * Membuka `dapur-nia.localhost:5173` memuat data tenant Dapur Nia.
  * Membuka `tidak-ada.localhost:5173` menampilkan halaman "Usaha Tidak Ditemukan", bukan error kosong atau data tenant lain.

---

### Milestone 3: Autentikasi & Registrasi Pemilik Usaha
* **Branch**: `feature/auth-and-registration`
* **Dependensi**: M1, M2
* **Tujuan**: Alur pendaftaran akun pemilik UMKM kuliner dan akses dashboard yang aman.
* **Langkah Konkret**:
  1. Halaman Registrasi (`/daftar`): Form nama pemilik, email, password, nama usaha, dan subdomain.
  2. Validasi realtime ketersediaan subdomain (debounce query ke tabel `tenants`).
  3. Integrasi Supabase Auth (`signUp`) → trigger pembuatan profil → insert tenant status `pending`.
  4. Halaman Login (`/masuk`): Autentikasi Supabase Auth + redirect otomatis berdasarkan role (`owner` → `/dashboard`, `platform_admin` → `/admin`).
  5. Route Guard: Proteksi rute `/dashboard/*` dan `/admin/*` via hooks router.
* **Kriteria Selesai (AC)**:
  * Pemilik baru berhasil mendaftar dan langsung diarahkan ke dashboard.
  * Subdomain yang sudah terpakai ditolak sebelum form di-submit.

---

### Milestone 4: Pembayaran Midtrans (Serverless Webhook)
* **Branch**: `feature/midtrans-payment`
* **Dependensi**: M1, M3
* **Tujuan**: Pembayaran paket langganan digital tervalidasi server (titik paling kritis).
* **Langkah Konkret**:
  1. Endpoint `api/midtrans/create.ts`: Request Snap Token ke Midtrans API menggunakan Server Key rahasia; catat transaksi status `pending`.
  2. Endpoint `api/midtrans/webhook.ts`:
     * Validasi signature SHA-512: `SHA512(order_id + status_code + gross_amount + ServerKey)`.
     * Idempotency check: Jangan proses ulang transaksi yang sudah selesai.
     * Jika `settlement` / `capture`: Ubah `tenants.status` menjadi `active` (atau `trial`).
  3. Dashboard UI: Integrasi Snap popup JS dan polling status transaksi.
* **Kriteria Selesai (AC)**:
  * Tenant hanya aktif jika webhook berhasil divalidasi dengan signature sah dari Midtrans.
  * Notifikasi webhook duplikat tidak memicu error atau aktivasi ganda.

---

### Milestone 5: Menu Management & Cloudinary Image Upload
* **Branch**: `feature/menu-and-cloudinary-upload`
* **Dependensi**: M3, M4
* **Tujuan**: Pemilik dapat mengatur identitas usaha dan katalog produk makanan/minuman dengan penyimpanan gambar Cloudinary.
* **Langkah Konkret**:
  1. Client WebP Compressor (`src/lib/image-compressor.ts`): Kompresi gambar via canvas browser (max 800px, max 300KB).
  2. Endpoint `api/cloudinary/sign-upload.ts`: Pembuatan signature terotentikasi (SHA-1) untuk direct upload ke Cloudinary API.
  3. Dashboard Profil Usaha: Update nama usaha, deskripsi, alamat, kontak WhatsApp, dan logo.
  4. Dashboard Kategori: CRUD kategori + input urutan tampil (`sort_order`).
  5. Dashboard Menu: CRUD item menu (nama, kategori, deskripsi, harga, upload foto WebP ke Cloudinary, toggle ketersediaan `is_available`).
* **Kriteria Selesai (AC)**:
  * Foto menu terunggah ke Cloudinary dan URL tersimpan di database.
  * Toggle ketersediaan menu langsung tersimpan dan aman di bawah RLS owner.

---

### Milestone 6: Website Publik Tenant & Guest Checkout
* **Branch**: `feature/tenant-site-and-order`
* **Dependensi**: M1, M2, M5
* **Tujuan**: Tampilan menu digital untuk pelanggan pembeli dan sistem checkout tanpa login.
* **Langkah Konkret**:
  1. Tampilan Website Tenant (`apps/tenant-site`): Header resto, kontak WA, tab kategori, grid kartu menu, badge "Habis" jika tidak tersedia.
  2. Keranjang Belanja (`cart.svelte.ts`): Tambah/kurang item, pencegahan item habis.
  3. Modal Checkout Pembeli: Input nama pembeli (wajib), kontak (opsional), catatan pesanan (opsional).
  4. Submit pesanan memanggil RPC `create_guest_order`.
  5. Halaman Konfirmasi Pesanan: Menampilkan `order_code` bukti pesanan untuk ditunjukkan ke kasir/pelayan.
* **Kriteria Selesai (AC)**:
  * Pembeli dapat membuat pesanan tanpa perlu registrasi akun.
  * Harga pesanan dihitung ulang di server Postgres (aman dari manipulasi inspeksi elemen browser).

---

### Milestone 7: Dashboard Pesanan (Owner Order Tracking)
* **Branch**: `feature/order-management`
* **Dependensi**: M5, M6
* **Tujuan**: Pemilik usaha menerima dan mengelola progres pesanan pelanggan secara teratur.
* **Langkah Konkret**:
  1. Halaman Antrean Pesanan (`/dashboard/pesanan`): Daftar pesanan masuk diurutkan dari terbaru.
  2. Filter pesanan berdasarkan status: `baru`, `diproses`, `selesai`, `dibatalkan`.
  3. Modal Detail Pesanan: Menampilkan item snapshot harga saat dipesan dan data pemesan.
  4. Tombol pembaruan status bertahap: `baru` → `diproses` → `selesai` (atau `dibatalkan`).
  5. Sinkronisasi data otomatis dengan interval polling 15 detik.
* **Kriteria Selesai (AC)**:
  * Pesanan yang dibuat pembeli langsung muncul di dashboard pemilik.
  * Perubahan status pesanan tersimpan konsisten di database.

---

### Milestone 8: Dashboard Admin Platform & Landing Page
* **Branch**: `feature/admin-and-landing`
* **Dependensi**: M3, M4, M7
* **Tujuan**: Pengawasan operasional seluruh tenant dan portal pemasaran platform.
* **Langkah Konkret**:
  1. Dashboard Admin Platform (`/admin`):
     * Tabel monitoring seluruh tenant beserta status aktivasi dan paketnya.
     * Riwayat transaksi Midtrans lintas tenant.
     * Fitur manual override status tenant (untuk bantuan kendala teknis darurat).
  2. Landing Page Platform (`apps/landing`): Halaman Beranda, Fitur, dan Harga (Paket Mikro aktif, Kecil & Menengah berlabel "Segera Hadir").
  3. Chatbot Gemini AI (`api/gemini/chat.ts`): Widget bantuan interaktif khusus di landing page utama.
* **Kriteria Selesai (AC)**:
  * Admin platform dapat memantau seluruh tenant terdaftar.
  * Chatbot hanya muncul di domain platform dan mampu menjawab pertanyaan FAQ seputar RestoLink.

---

### Milestone 9: UAT, Audit Keamanan RLS, & Demo Polish
* **Branch**: `feature/uat-and-hardening`
* **Dependensi**: M1 s/d M8
* **Tujuan**: Finalisasi pra-lomba dan simulasi demo pitch.
* **Langkah Konkret**:
  1. Eksekusi 7 skenario checklist UAT dari `docs/product/04_USER_FLOWS.md` Bagian 7.
  2. Audit keamanan: Verifikasi tidak ada data bocor antar-tenant dan tidak ada secret key yang terbawa ke bundle browser.
  3. Audit responsif layar HP / mobile.
  4. Penyiapan data demo (seed 1 tenant contoh lengkap menu foto menarik untuk presentasi juri).
* **Kriteria Selesai (AC)**:
  * Seluruh alur utama berjalan mulus dari awal hingga akhir tanpa kendala teknis saat presentasi.

---

## 🌿 Aturan Git Tim
1. **Branch Utama**:
   * `main` = Rilis produksi stabil (Vercel Live).
   * `develop` = Integrasi pengembangan harian tim.
2. **Aturan Fitur**:
   * Selalu buat branch baru dari `develop`:
     ```bash
     git checkout develop
     git pull origin develop
     git checkout -b feature/<nama-milestone>
     ```
   * Selesai pengerjaan: Buat Pull Request (PR) ke `develop` untuk di-merge bersama.
