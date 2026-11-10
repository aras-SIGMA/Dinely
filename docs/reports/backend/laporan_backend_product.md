# Laporan Analisis Kebutuhan Backend (Berdasarkan Dokumen Product)

Dokumen ini disusun oleh Backend Developer berdasarkan hasil penelaahan mendalam terhadap seluruh dokumen di folder `docs/product/` (`00_README.md`, `02_ARCHITECTURE.md`, `03_DATABASE_SCHEMA.md`, `05_FEATURE_SPEC.md`, `04_USER_FLOWS.md`, dan `01_PRD.md`).

---

## 1. Ringkasan Proyek
Dinely adalah platform web multi-tenant yang berfungsi sebagai pusat kendali terpadu bagi UMKM kuliner untuk mengelola profil, menu digital, dan pesanan secara terstruktur (`01_PRD.md`, `00_README.md`). Platform ini menyediakan website menu publik berbasis subdomain unik (`{slug}.dinely.site`) yang diselesaikan secara runtime di sisi client menggunakan satu basis kode frontend (`01_PRD.md`, `02_ARCHITECTURE.md`). Pemilik usaha mendaftar, memilih paket layanan (fokus MVP pada paket Mikro), dan membayar langganan melalui payment gateway Midtrans (`01_PRD.md`, `05_FEATURE_SPEC.md`). Aktivasi tenant dan paket hanya dapat dipicu oleh validasi server terhadap webhook resmi dari Midtrans (`02_ARCHITECTURE.md`, `04_USER_FLOWS.md`). Ruang lingkup MVP mencakup registrasi pemilik, manajemen menu dan pesanan sederhana, website publik untuk pemesanan tamu (guest checkout), chatbot AI informasi platform di landing page, serta dashboard admin platform (`01_PRD.md`, `05_FEATURE_SPEC.md`).

---

## 2. Tech Stack dan Konvensi dari ARCHITECTURE
Berdasarkan `02_ARCHITECTURE.md` (Bagian 1, 2, 4, 5, 7):
* **Frontend & Client Routing**: Vite + Svelte + TypeScript, Svelte-based routing (Multi-page untuk Landing Page SEO, SPA untuk Dashboard Pemilik & Admin Platform, serta Runtime Subdomain Resolver untuk Website Tenant). Frontend murni client-side rendering (tanpa SSR).
* **Backend & Database**: Supabase (PostgreSQL), Supabase Auth, Row Level Security (RLS), serta RPC / Edge Functions / Serverless API routes untuk logika bisnis server.
* **Asset Storage**: Cloudinary untuk penyimpanan logo usaha dan foto menu dalam format WebP yang dikompresi sebelum upload.
* **Payment Gateway**: Midtrans (Snap / Sandbox) khusus untuk pembayaran paket langganan (bukan untuk pesanan pembeli).
* **Hosting & Subdomain**: Vercel dengan konfigurasi wildcard subdomain (`*.dinely.site`).
* **Chatbot AI**: Google Gemini API, hanya aktif di Landing Page utama platform.
* **Konvensi & Aturan Arsitektur Penting**:
  1. *Data Isolation Guarantee*: Setiap tabel entitas tenant wajib memiliki kolom `tenant_id` dan dilindungi oleh RLS Supabase (`auth.uid() = owner_id`).
  2. *Server-Side Activation Only*: Aktivasi tenant/paket haram dipicu oleh redirect browser; wajib melalui validasi server atas notifikasi webhook Midtrans.
  3. *Idempotency*: Webhook Midtrans wajib menangani pengiriman berulang tanpa menimbulkan duplikasi aktivasi atau error.
  4. *Runtime Client Resolving*: Subdomain diparsing langsung di browser (`window.location.hostname`) lalu di-query ke Supabase.

---

## 3. Ringkasan Database
Berdasarkan `03_DATABASE_SCHEMA.md`:

### 3.1 Daftar Tabel
1. `profiles`: Ekstensi `auth.users` Supabase (`id` PK uuid, `full_name`, `phone`, `role` enum: `'owner'|'platform_admin'`, `created_at`).
2. `tenants`: Entitas profil UMKM (`id` PK uuid, `owner_id` FK ke `profiles.id`, `business_name`, `subdomain` text unique, `logo_url`, `description`, `contact_phone`, `contact_whatsapp`, `address`, `status` enum: `'pending'|'active'|'trial'|'suspended'|'expired'`, `current_package_id` FK ke `packages.id`, `trial_ends_at`, `created_at`).
3. `packages`: Katalog paket (`id` PK uuid, `name`, `tier` enum: `'mikro'|'kecil'|'menengah'`, `price_monthly`, `price_6_months`, `price_yearly`, `trial_days`, `feature_flags` jsonb, `is_active` boolean).
4. `transactions`: Riwayat transaksi langganan Midtrans (`id` PK uuid, `tenant_id` FK ke `tenants.id`, `package_id` FK ke `packages.id`, `billing_cycle` enum: `'trial'|'monthly'|'6_months'|'yearly'`, `amount`, `midtrans_order_id` text unique, `midtrans_transaction_id` text, `status` enum: `'pending'|'settlement'|'capture'|'deny'|'cancel'|'expire'|'failure'`, `raw_notification` jsonb, `created_at`, `settled_at`).
5. `categories`: Kategori menu tenant (`id` PK uuid, `tenant_id` FK ke `tenants.id`, `name`, `sort_order`, `created_at`).
6. `menu_items`: Daftar menu tenant (`id` PK uuid, `tenant_id` FK ke `tenants.id`, `category_id` FK ke `categories.id`, `name`, `description`, `price`, `image_url`, `is_available` boolean, `sort_order`, `created_at`, `updated_at`).
7. `orders`: Pesanan pembeli/guest (`id` PK uuid, `tenant_id` FK ke `tenants.id`, `order_code` text unique per tenant, `buyer_name`, `buyer_contact`, `note`, `status` enum: `'baru'|'diproses'|'selesai'|'dibatalkan'`, `total_amount`, `created_at`, `updated_at`).
8. `order_items`: Rincian item pesanan (`id` PK uuid, `order_id` FK ke `orders.id`, `menu_item_id` FK ke `menu_items.id`, `menu_item_name_snapshot`, `price_snapshot`, `quantity`, `subtotal`).
9. *Tabel Lanjutan (Di luar MVP)*: `addons`, `tenant_addons`, `staff_members`.

### 3.2 Relasi Utama
* `profiles` 1:1 `tenants` (satu owner memiliki satu usaha).
* `tenants` 1:N `transactions`, `categories`, `orders`.
* `packages` 1:N `transactions`, 1:N `tenants` (`current_package_id`).
* `categories` 1:N `menu_items`.
* `orders` 1:N `order_items` N:1 `menu_items`.

### 3.3 Constraint & Aturan RLS Penting
* `subdomain` pada `tenants` wajib case-insensitive, alfanumerik + dash, unique, serta tidak boleh menggunakan reserved words platform (`www`, `admin`, `api`, `app`).
* `midtrans_order_id` pada `transactions` harus unique.
* `order_code` unik per tenant.
* `order_items` wajib menyimpan snapshot (`menu_item_name_snapshot` dan `price_snapshot`) agar perubahan harga/nama menu di kemudian hari tidak mengubah riwayat pesanan lampau.
* **RLS Policies**:
  * Publik (anon): Hanya dapat `SELECT` tabel `tenants`, `categories`, dan `menu_items` milik tenant yang berstatus `'active'` atau `'trial'`. Dapat melakukan `INSERT` ke `orders` hanya pada tenant aktif.
  * Owner: Full access (CRUD) hanya ke baris tabel yang memiliki `tenant_id` miliknya (`auth.uid() = tenants.owner_id`).
  * Platform Admin: Full access ke seluruh baris lintas-tenant (`profiles.role = 'platform_admin'`).

---

## 4. Daftar Fitur dan Endpoint yang Dibutuhkan Backend
Berdasarkan `02_ARCHITECTURE.md`, `03_DATABASE_SCHEMA.md`, `05_FEATURE_SPEC.md`, dan `04_USER_FLOWS.md`:

1. **Midtrans Create Transaction Endpoint**
   * *Method & Path*: `POST` (Path: TIDAK JELAS di dokumen produk; disarankan `api/midtrans/create` atau Supabase Edge Function).
   * *Tujuan*: Meminta Snap Token / redirect URL dari Midtrans Sandbox dan membuat record transaksi awal.
   * *Validasi*: Sesi authenticated owner (`auth.uid()`), `tenant_id` valid milik user, `package_id` valid dan aktif.
    * *Aturan Bisnis*: Hitung amount paket Mikro (Rp 49.000 / skema trial), generate `midtrans_order_id` unik, insert ke `transactions` dengan `status = 'pending'`, kembalikan Snap token ke client (`02_ARCHITECTURE.md` Bagian 5, `04_USER_FLOWS.md` Bagian 4).

2. **Midtrans Webhook Receiver Endpoint**
   * *Method & Path*: `POST` (Path: TIDAK JELAS di dokumen produk; disarankan `api/midtrans/webhook` atau Supabase Edge Function).
   * *Tujuan*: Menerima dan memproses notifikasi perubahan status pembayaran dari Midtrans.
   * *Validasi*: Validasi signature hash SHA-512: `SHA512(order_id + status_code + gross_amount + ServerKey)` (`02_ARCHITECTURE.md` Bagian 5).
   * *Aturan Bisnis*:
     * Idempotency: Jika `transactions.status` sudah `settlement`, abaikan pemrosesan ulang.
     * Simpan raw payload ke `transactions.raw_notification`.
     * Jika status `settlement` atau `capture`: update `transactions.status = 'settlement'`, update `transactions.settled_at = now()`, update `tenants.status = 'active'`, pasang `tenants.current_package_id` dan perpanjang masa aktif.
     * Jika `deny`, `cancel`, `expire`, atau `failure`: update `transactions.status` sesuai notifikasi; `tenants.status` tetap `pending` (`04_USER_FLOWS.md` Bagian 1 & 4).

3. **Asset Upload Signer / Direct Storage Endpoint**
   * *Method & Path*: `POST api/cloudinary/sign-upload.ts` (Sesuai `TIM_TASKS.md` BE-03).
   * *Tujuan*: Menyediakan signature berbatas waktu (timestamp) terotentikasi ke Cloudinary menggunakan `CLOUDINARY_API_SECRET` agar client dapat mengunggah logo dan gambar menu secara aman tanpa membocorkan secret key ke frontend.
   * *Validasi*: Sesi autentikasi owner (Bearer token), batasan ukuran file, tipe file gambar.

4. **Guest Order Creation Handler / Database RPC**
   * *Method & Path*: RPC Database Supabase (misal `create_guest_order`) atau `POST /rest/v1/rpc/...` (`03_DATABASE_SCHEMA.md` Bagian 9 & 10).
   * *Tujuan*: Memproses pesanan dari pembeli tamu secara atomik.
   * *Validasi*: Tenant target wajib `status IN ('active', 'trial')`, keranjang tidak boleh kosong, `buyer_name` wajib diisi, seluruh menu dalam item harus milik tenant dan berstatus `is_available = true` (`04_USER_FLOWS.md` Bagian 2).
   * *Aturan Bisnis*: Validasi ketersediaan menu secara realtime di sisi database/server sebelum insert; generate `order_code` unik per tenant (misal `#A123`); insert record `orders` (`status = 'baru'`); insert `order_items` dengan snapshot nama menu dan harga; hitung total amount transaksi pesanan.

5. **Guest Order Tracking Function / RPC**
   * *Method & Path*: RPC Database Supabase (misal `get_guest_order_status`).
   * *Tujuan*: Mengizinkan pembeli melihat status pesanannya tanpa perlu login dan tanpa mengekspos data pesanan pembeli lain (`03_DATABASE_SCHEMA.md` Bagian 9, `04_USER_FLOWS.md` Bagian 2).
   * *Validasi*: Parameter `tenant_id` dan `order_code` harus cocok.

6. **Chatbot AI Proxy Endpoint**
   * *Method & Path*: `POST` (Path: TIDAK JELAS di dokumen produk; disarankan `api/gemini/chat` atau Edge Function) (`05_FEATURE_SPEC.md` Bagian A2).
   * *Tujuan*: Menjadi perantara permintaan chat dari landing page ke Google Gemini API agar `GEMINI_API_KEY` tidak bocor ke bundle frontend.
   * *Validasi*: Format input pertanyaan user tidak kosong, rate limiting request.
   * *Aturan Bisnis*: System prompt restriksi ketat (hanya seputar platform Dinely: fitur, paket, cara daftar); sediakan fallback ramah jika pertanyaan di luar konteks.

---

## 5. Alur User yang Berdampak ke Backend
Berdasarkan `04_USER_FLOWS.md` dan `02_ARCHITECTURE.md`:

### 5.1 Alur Registrasi, Checkout Paket, & Aktivasi Tenant
1. User sign up via Supabase Auth -> backend membuat row di `profiles` (`role = 'owner'`) dan `tenants` (`status = 'pending'`).
2. User memilih paket -> client meminta pembuatan transaksi -> backend membuat record di `transactions` (`status = 'pending'`) dan request Snap token ke Midtrans.
3. User menyelesaikan pembayaran di Midtrans -> Midtrans mengirim HTTP POST notifikasi ke Webhook server Dinely.
4. Backend memvalidasi signature SHA-512 -> update status `transactions` -> update `tenants.status` dari `'pending'` menjadi `'active'` (atau `'trial'`), mengisi `current_package_id`.
5. Website publik tenant aktif dan dapat diakses pembeli.

### 5.2 Alur Pemesanan oleh Pembeli (Guest)
1. Pembeli membuka `{subdomain}.dinely.site` -> frontend resolve subdomain melalui query publik ke `tenants`.
2. Pembeli memasukkan menu ke keranjang dan menekan submit pesanan.
3. Backend (via RPC/server) memvalidasi ketersediaan `menu_items.is_available` secara realtime.
4. Backend mencatat `orders` baru dengan `status = 'baru'`, membuat `order_code`, dan menyimpan snapshot item ke `order_items`.
5. Dashboard pemilik menerima pesanan masuk secara realtime/polling.

### 5.3 Alur Pengelolaan Status Pesanan oleh Pemilik
1. Pemilik membuka dashboard pesanan -> query terfilter RLS (`orders.tenant_id = user_tenant_id`).
2. Pemilik mengubah status: `'baru'` -> `'diproses'` -> `'selesai'` (atau `'dibatalkan'`).
3. Perubahan status tersimpan di database dan dapat dicek oleh pembeli via `order_code`.

### 5.4 Alur Penanganan Transaksi & Override oleh Admin Platform
1. Admin Platform login (`profiles.role = 'platform_admin'`).
2. Admin memantau transaksi yang pending/gagal melalui query lintas-tenant.
3. Admin melakukan update manual status tenant (`status = 'active'`) jika terjadi kendala teknis webhook.

---

## 6. Kontradiksi atau Ketidaksesuaian Antar Dokumen

1. **Penyedia Storage Gambar (Penyelarasan ke Cloudinary)**:
   * *Status*: Telah diselaraskan dari Cloudflare R2 ke **Cloudinary** di seluruh dokumen produk agar sesuai dengan `TIM_TASKS.md` (BE-03: Cloudinary Upload Signer) dan implementasi `api/cloudinary/sign-upload.ts`.

2. **Skema Pembayaran Trial & Nominal Paket Mikro**:
   * *Keputusan PM (Final)*: Paket Mikro ditetapkan sebesar **Rp 49.000 / bulan** (sesuai `seed.sql` dan `api/midtrans/create.ts`). Pemilik usaha menyelesaikan pembayaran awal Rp 49.000 melalui Midtrans Snap.

3. **Status Tenant Pasca Pembayaran Pertama (Opsi A Dipilih)**:
   * *Keputusan PM (Final)*: Menggunakan **Opsi A**. Setelah notifikasi webhook Midtrans (`settlement` / `capture`) tervalidasi, backend langsung mengubah `tenants.status = 'active'`, mengisi `tenants.current_package_id`, dan menyetel `tenants.subscription_ends_at = now() + interval '30 days'`. Kolom `trial_ends_at` dan enum status `'trial'` disimpan untuk keperluan roadmap lanjutan bila ada skema free trial tanpa kartu/pembayaran di masa mendatang.

4. **Kapan `current_package_id` Disimpan**:
   * *04_USER_FLOWS.md* Bagian 1 langkah 2-3: Pemilik memilih paket **sebelum** mendaftar dan mengisi formulir.
   * *03_DATABASE_SCHEMA.md* Bagian 3: `tenants.current_package_id` berstatus nullable.
   * *04_USER_FLOWS.md* Bagian 4 langkah 6: `current_package_id` baru diset pada tabel `tenants` setelah notifikasi webhook Midtrans berhasil diverifikasi.

---

## 7. Informasi yang Kurang atau Ambigu

1. **Lokasi Hosting & Eksekusi Backend Serverless**:
   * *Status*: TIDAK JELAS.
   * *Detail*: `02_ARCHITECTURE.md` menyatakan frontend di-hosting di Vercel dan database di Supabase. Namun dokumen tidak merinci apakah endpoint backend (Midtrans webhook, Snap creator, Gemini proxy) harus diimplementasikan sebagai **Vercel Serverless Functions** (folder `api/`) atau **Supabase Edge Functions** (Deno di folder `supabase/functions/`).

2. **Spesifikasi Teknis Upload ke Cloudinary**:
   * *Status*: Sudah jelas via endpoint signer `api/cloudinary/sign-upload.ts` (generate signature SHA-1 dengan timestamp dan `CLOUDINARY_API_SECRET`), lalu client melakukan direct POST multipart ke API Cloudinary.

3. **Nominal Pasti Pembayaran Paket Mikro**:
   * *Status*: SUDAH FINAL (Rp 49.000 / bulan).
   * *Detail*: Ditetapkan Rp 49.000 / bulan sesuai `seed.sql`, `api/midtrans/create.ts`, dan arahan PM.

4. **Generator Format `order_code`**:
   * *Status*: SUDAH DISELESAIKAN DI M1.
   * *Detail*: Telah diimplementasikan pada RPC `create_guest_order` dengan format alfanumerik acak anti-collision (misal `#A123`).

5. **Spesifikasi Interface Database Function (RPC) Pesanan Guest**:
   * *Status*: SUDAH DISELESAIKAN DI M1.
   * *Detail*: Telah diimplementasikan via RPC `create_guest_order` (atomik validasi menu dan snapshot harga) dan `get_guest_order_status` (masking nomor kontak).

---

## 8. Jawaban & Konfirmasi PM untuk Backend

1. **Runtime Serverless Backend**: Menggunakan **Vercel Serverless Functions** (`api/*.ts`) berbasis Node.js/TypeScript.
2. **Skema Pembayaran Trial**: Menggunakan **Opsi A**. Pemilik baru menyelesaikan pembayaran Rp 49.000 melalui Midtrans untuk 30 hari pertama, dan langsung berstatus `active`.
3. **Mekanisme Upload Cloudinary**: Sesuai kesepakatan: endpoint signer `api/cloudinary/sign-upload.ts` (SHA-1 signature + timestamp) dipanggil oleh browser sebelum direct upload ke Cloudinary API.
4. **Implementasi Pemesanan Guest**: Sudah tuntas via RPC PostgreSQL `create_guest_order` (M1) untuk menjamin atomisitas validasi ketersediaan menu dan snapshot harga.
5. **Format `order_code`**: Sudah tuntas via generator di dalam RPC `create_guest_order` (M1).
6. **Harga Paket Mikro**: **Rp 49.000** (final).
7. **Arsitektur Chatbot Gemini**: Dipanggil via proxy backend `api/gemini/chat.ts` untuk menjaga kerahasiaan `GEMINI_API_KEY` dan membatasi respon hanya seputar produk Dinely.

---

## 9. Usulan Urutan Pengerjaan Backend

1. **Tahap 1: Fondasi Skema Database & Keamanan RLS (Supabase)**
   * Membuat skema tabel inti: `profiles`, `tenants`, `packages`, `transactions`, `categories`, `menu_items`, `orders`, `order_items`.
   * Menyiapkan constraint: uniqueness `subdomain`, pengecekan reserved words, uniqueness `midtrans_order_id`.
   * Menerapkan Row Level Security (RLS) policies untuk akses publik (anon), owner, dan platform admin.

2. **Tahap 2: Payment Engine Midtrans (Kritis)**
   * Membangun endpoint pembuatan transaksi Midtrans (Snap Token generator).
   * Membangun endpoint penerima webhook Midtrans dengan validasi signature hash SHA-512.
   * Mengimplementasikan proteksi idempotensi dan logika aktivasi tenant (`tenants.status = 'active'`, update durasi langganan).

3. **Tahap 3: Engine Pemesanan Tamu & Snapshot Data (RPC Database)**
   * Membuat RPC `create_guest_order` untuk validasi realtime menu (`is_available`), kalkulasi total, pembuatan snapshot harga & nama menu, serta generate `order_code`.
   * Membuat RPC/query proteksi pelacakan status pesanan guest berdasarkan `order_code`.

4. **Tahap 4: Endpoint Media Storage Signer (Cloudinary)**
   * Membangun endpoint signer (`api/cloudinary/sign-upload.ts`) untuk upload gambar menu dan logo ke Cloudinary secara aman.

5. **Tahap 5: Chatbot AI Proxy (Gemini API)**
   * Membangun endpoint proxy untuk request chat landing page menggunakan Gemini API dengan system prompt Dinely dan proteksi API key.

6. **Tahap 6: Pengujian Integrasi & Keamanan**
   * Uji coba webhook Midtrans di sandbox (skenario settlement, deny, expire, duplicate webhook).
   * Verifikasi pengujian isolasi RLS antar-tenant untuk memastikan zero cross-tenant data leak.
