# 👥 Master Task List Tim RestoLink (M2 s/d M9)

Dokumen ini adalah panduan kerja teknis seluruh anggota tim RestoLink (PM/Fullstack, Backend Developer, dan Frontend Developer) untuk menyelesaikan implementasi MVP secara paralel tanpa konflik Git.

---

## 👥 Matriks Peran & Lingkup Kerja

| Peran | Anggota | Fokus Utama | Target Branch | Area Direktori Bebas Konflik |
|---|---|---|---|---|
| **PM & Fullstack** | Anggota 1 (Lead) | Resolusi Subdomain (M2), Arsitektur Inti, Integrasi Supabase Auth & RPC (M3, M6, M7), Review PR | `feature/subdomain-resolver` → `feature/integration-*` | `src/lib/`, `src/stores/`, `src/routes/`, `src/App.svelte`, `src/apps/tenant-site/TenantShell.svelte` |
| **Backend Dev** | Anggota 2 | Serverless Endpoints (`api/`), Integrasi Midtrans Snap & Webhook (M4), Cloudinary Signer (M5), Gemini AI Proxy (M8) | `feature/backend-api-services` | `api/**` |
| **Frontend Dev** | Anggota 3 | Slicing Landing Page & Auth UI (M3), UI Dashboard (M4, M5, M7), UI Website Publik Tenant & Keranjang (M6) | `feature/landing-and-auth-ui` → `feature/dashboard-and-tenant-ui` | `src/apps/landing/**`, `src/apps/dashboard/**`, `src/apps/admin/**`, `src/components/ui/**` |

---

## 🔒 Zona Direktori Bebas Konflik (Git Boundaries)

| Anggota | Boleh Menulis & Mengubah (Write Access) | Dilarang Mengubah (Read-Only) |
|---|---|---|
| **PM & Fullstack** | `src/lib/`, `src/stores/`, `src/routes/`, `src/App.svelte`, `src/apps/tenant-site/TenantShell.svelte` | `api/**` (serahkan ke Backend) |
| **Backend Dev** | `api/**` (`midtrans/`, `cloudinary/`, `gemini/`, `_types.ts`) | `src/**` (serahkan ke Frontend/Fullstack) |
| **Frontend Dev** | `src/apps/landing/**`, `src/apps/dashboard/**`, `src/apps/admin/**`, `src/components/ui/**` | `src/lib/tenant-resolver.ts`, `src/App.svelte`, `api/**` |

---

## 📋 Daftar Rincian Task per Posisi

### 1. PM & Fullstack
* **Milestone 2: Subdomain Resolver Engine**
  - [ ] **FS-01**: Parser hostname runtime (`src/lib/tenant-resolver.ts`, `src/lib/host.ts`) untuk domain produksi `*.restolink.site`, lokal `*.localhost:5173`, dan dev query `?tenant=slug`.
  - [ ] **FS-02**: Store reaktif `src/stores/tenant.svelte.ts` untuk query view Supabase `public_tenants`.
  - [ ] **FS-03**: Shell layout `src/apps/tenant-site/TenantShell.svelte` dengan dynamic theming CSS variable (`--brand-primary`) dan skeleton loader.
  - [ ] **FS-04**: Root dispatcher di `src/App.svelte` penentu perutean Platform vs Tenant Site.
* **Milestone 3: Autentikasi & Guard**
  - [ ] **FS-05**: Implementasi logika registrasi pemilik (`supabase.auth.signUp`) + create tenant status `pending` di `src/stores/auth.svelte.ts`.
  - [ ] **FS-06**: Implementasi login & auto-redirect berdasarkan role (`owner` → `/dashboard`, `platform_admin` → `/admin`).
  - [ ] **FS-07**: Route guard hooks (`src/lib/guards.ts`) proteksi akses rute `/dashboard/*` dan `/admin/*`.
* **Milestone 4 & 5: Integrasi Pembayaran & Upload Client**
  - [ ] **FS-08**: Integrasi Snap Popup Midtrans di sisi browser saat pemilik checkout paket langganan.
  - [ ] **FS-09**: Client image compressor `src/lib/image-compressor.ts` (canvas kompresi WebP max 800px / 300KB).
  - [ ] **FS-10**: Client uploader `src/lib/cloudinary-upload.ts` (request signature ke backend → POST multipart ke Cloudinary API).
* **Milestone 6 & 7: Integrasi Pemesanan & Dashboard Realtime**
  - [ ] **FS-11**: Keranjang belanja reaktif `src/stores/cart.svelte.ts` (hitung subtotal, simpan LocalStorage).
  - [ ] **FS-12**: Integrasi submit pesanan guest ke RPC Postgres `create_guest_order` dan pelacakan via `get_guest_order_status`.
  - [ ] **FS-13**: Store pesanan pemilik `src/stores/orders.svelte.ts` dengan update status (`baru → diproses → selesai`) dan polling interval 15 detik.
* **Milestone 8 & 9: Admin Platform & UAT**
  - [ ] **FS-14**: Query admin lintas-tenant & aksi manual override status tenant via Supabase client.
  - [ ] **FS-15**: Eksekusi 7 skenario UAT dari `docs/product/04_USER_FLOWS.md`.
  - [ ] **FS-16**: Seed demo data (1 resto kuliner contoh lengkap menu foto menarik untuk demo juri).

---

### 2. Backend Developer
* **Milestone 4: Midtrans Payment Engine**
  - [ ] **BE-01**: Endpoint `api/midtrans/create.ts`
    - Validasi sesi user / tenant ID.
    - Hitung tagihan paket Mikro (Rp 29.000).
    - Request Snap Token ke Midtrans API Sandbox menggunakan `MIDTRANS_SERVER_KEY`.
    - Insert transaksi ke tabel `transactions` status `pending`.
  - [ ] **BE-02**: Endpoint `api/midtrans/webhook.ts` *(Titik Paling Kritis Sistem)*
    - Validasi signature hash SHA-512: `SHA512(order_id + status_code + gross_amount + ServerKey)`.
    - Idempotency protection (cegah pemrosesan ulang webhook duplikat).
    - Jika `settlement` / `capture`: update `transactions.status = 'settlement'`, update `tenants.status = 'active'`, pasang `subscription_ends_at` (+30 hari) via Supabase `service_role`.
* **Milestone 5: Cloudinary Upload Signer**
  - [ ] **BE-03**: Endpoint `api/cloudinary/sign-upload.ts`
    - Validasi bearer token sesi owner.
    - Generate signature SHA-1 berbatas waktu (timestamp) dengan `CLOUDINARY_API_SECRET`.
    - Response: `{ signature, timestamp, apiKey, cloudName, folder }`.
* **Milestone 8: Chatbot AI Proxy**
  - [ ] **BE-04**: Endpoint `api/gemini/chat.ts`
    - Request proxy ke Google Gemini API menggunakan `GEMINI_API_KEY`.
    - System prompt restriksi: hanya menjawab seputar produk RestoLink (fitur, paket, cara daftar).
    - Error fallback jika kuota habis atau pertanyaan di luar topik.
* **Milestone 9: Audit Keamanan Backend**
  - [ ] **BE-05**: Verifikasi tidak ada secret key (`SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`) yang bocor ke bundle client frontend.

---

### 3. Frontend Developer
* **Milestone 0 & 3: Landing Page & Auth UI**
  - [ ] **FE-01**: Komponen navigasi umum: `src/apps/landing/components/Navbar.svelte` & `Footer.svelte`.
  - [ ] **FE-02**: Slicing halaman `Home.svelte` (Hero section, 3 langkah mudah UMKM, value proposition, CTA).
  - [ ] **FE-03**: Slicing halaman `Features.svelte` (Menu digital, QR Code, Manajemen pesanan).
  - [ ] **FE-04**: Slicing halaman `Pricing.svelte` (Paket Mikro aktif Rp 29.000 + badge trial 30 hari; Paket Kecil & Menengah berlabel "Segera Hadir").
  - [ ] **FE-05**: Slicing halaman `Register.svelte` (Nama pemilik, nama resto, live subdomain preview `namatoko.restolink.site`, email, password).
  - [ ] **FE-06**: Slicing halaman `Login.svelte` (Input email, password, error display, forgot password stub).
* **Milestone 4, 5, 7: Dashboard Pemilik Usaha UI**
  - [ ] **FE-07**: Halaman `Subscription.svelte`: Tampilan status paket aktif, sisa hari trial, tombol perpanjang langganan.
  - [ ] **FE-08**: Halaman `Profile.svelte`: Form info resto (logo upload preview, nama usaha, deskripsi, alamat, kontak WhatsApp, color picker brand).
  - [ ] **FE-09**: Halaman `MenuManagement.svelte`: Modal tambah/edit kategori, modal tambah/edit menu (dropzone foto, input harga, toggle ketersediaan `is_available`).
  - [ ] **FE-10**: Halaman `Orders.svelte`: Kolom/tab pesanan per status (`baru`, `diproses`, `selesai`, `dibatalkan`), kartu pesanan dengan snapshot menu & info pemesan.
* **Milestone 6: Website Publik Tenant UI**
  - [ ] **FE-11**: Layout resto publik `TenantHome.svelte`: Header resto, logo, alamat, badge buka, link WhatsApp.
  - [ ] **FE-12**: Komponen katalog menu: Tab filter kategori, grid kartu menu, badge "Habis" jika non-aktif, tombol tambah ke keranjang.
  - [ ] **FE-13**: Komponen Keranjang Belanja (Drawer/Floating Bar) & Modal Checkout (input nama pemesan wajib, no HP opsional, catatan).
  - [ ] **FE-14**: Halaman/modal bukti pesanan (`order_code`) untuk ditunjukkan pembeli ke kasir.
* **Milestone 8 & 9: Admin Platform UI & Polish**
  - [ ] **FE-15**: Halaman `Tenants.svelte`: Tabel daftar seluruh tenant, badge status warna, filter paket.
  - [ ] **FE-16**: Halaman `Transactions.svelte`: Tabel riwayat transaksi Midtrans (order ID, nominal, status).
  - [ ] **FE-17**: Widget Chatbot AI di pojok kanan bawah Landing Page (bubble chat popup, chat bubble user/AI, input pesan).
  - [ ] **FE-18**: Audit tampilan responsif mobile (HP Android/iPhone) di seluruh halaman publik tenant dan dashboard.

---

## 🚦 Aturan Git & Alur Kolaborasi

1. **Pembuatan Branch**:
   - Seluruh anggota checkout dari branch `develop` terbaru:
     ```bash
     git checkout develop
     git pull origin develop
     git checkout -b <nama-branch-masing-masing>
     ```
2. **Pull Request (PR) & Code Review**:
   - Anggota tim membuat PR ke `develop` setelah menyelesaikan unit task.
   - Lead/PM (Anda) melakukan verifikasi `npm run check` dan `npm run build` sebelum merge ke `develop`.
