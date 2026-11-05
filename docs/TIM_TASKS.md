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
  - [x] **FS-01**: Parser hostname runtime (`src/lib/tenant-resolver.ts`, `src/lib/host.ts`) untuk domain produksi `*.restolink.site`, lokal `*.localhost:5173`, dan dev query `?tenant=slug`.
  - [x] **FS-02**: Store reaktif `src/stores/tenant.svelte.ts` untuk query view Supabase `public_tenants`.
  - [x] **FS-03**: Shell layout `src/apps/tenant-site/TenantShell.svelte` dengan dynamic theming CSS variable (`--brand-primary`) dan skeleton loader.
  - [x] **FS-04**: Root dispatcher di `src/App.svelte` penentu perutean Platform vs Tenant Site.
* **Milestone 3: Autentikasi & Guard**
  - [x] **FS-05**: Implementasi logika registrasi pemilik (`supabase.auth.signUp`) + create tenant status `pending` di `src/stores/auth.svelte.ts`.
  - [x] **FS-06**: Implementasi login & auto-redirect berdasarkan role (`owner` → `/dashboard`, `platform_admin` → `/admin`).
  - [x] **FS-07**: Route guard hooks (`src/lib/guards.ts`) proteksi akses rute `/dashboard/*` dan `/admin/*`.
* **Milestone 4 & 5: Integrasi Pembayaran & Upload Client**
  - [x] **FS-08**: Integrasi Snap Popup Midtrans di sisi browser saat pemilik checkout paket langganan.
  - [x] **FS-09**: Client image compressor `src/lib/image-compressor.ts` (canvas kompresi WebP max 800px / 300KB).
  - [x] **FS-10**: Client uploader `src/lib/cloudinary-upload.ts` (request signature ke backend → POST multipart ke Cloudinary API).
    - *Catatan Integrasi:* Integrasikan dengan `compressImage` (`src/lib/image-compressor.ts`) sebelum file dikirim ke Cloudinary. Sediakan metadata ringkasan kompresi (misal: ukuran awal, ukuran terkompresi, dan persentase penghematan ukuran) agar komponen UI dapat menampilkan feedback visual hasil optimasi gambar kepada pengguna.
* **Milestone 6 & 7: Integrasi Pemesanan & Dashboard Realtime**
  - [x] **FS-11**: Keranjang belanja reaktif `src/stores/cart.svelte.ts` (hitung subtotal, simpan LocalStorage).
  - [x] **FS-12**: Integrasi submit pesanan guest ke RPC Postgres `create_guest_order` dan pelacakan via `get_guest_order_status`.
  - [x] **FS-13**: Store pesanan pemilik `src/stores/orders.svelte.ts` dengan update status (`baru → diproses → selesai`) dan polling interval 15 detik.
* **Milestone 8 & 9: Admin Platform & UAT**
  - [x] **FS-14**: Query admin lintas-tenant & aksi manual override status tenant via Supabase client (`src/stores/admin.svelte.ts`).
  - [x] **FS-15**: Eksekusi 7 skenario UAT dari `docs/product/04_USER_FLOWS.md` (`docs/qa/uat_execution_report.md`).
  - [x] **FS-16**: Seed demo data (1 resto kuliner contoh lengkap menu foto menarik untuk demo juri di `supabase/seed.sql`).

---

### 2. Backend Developer
* **Milestone 4: Midtrans Payment Engine**
  - [x] **BE-01**: Endpoint `api/midtrans/create.ts`
    - Validasi sesi user / tenant ID.
    - Hitung tagihan paket Mikro (Rp 49.000).
    - Request Snap Token ke Midtrans API Sandbox menggunakan `MIDTRANS_SERVER_KEY`.
    - Insert transaksi ke tabel `transactions` status `pending`.
  - [x] **BE-02**: Endpoint `api/midtrans/webhook.ts` *(Titik Paling Kritis Sistem)*
    - Validasi signature hash SHA-512: `SHA512(order_id + status_code + gross_amount + ServerKey)`.
    - Idempotency protection (cegah pemrosesan ulang webhook duplikat).
    - Jika `settlement` / `capture`: update `transactions.status = 'settlement'`, update `tenants.status = 'active'`, pasang `subscription_ends_at` (+30 hari) via Supabase `service_role`.
* **Milestone 5: Cloudinary Upload Signer**
  - [ ] **BE-03**: Endpoint `api/cloudinary/sign-upload.ts`
    - Validasi bearer token sesi owner.
    - Generate signature SHA-1 berbatas waktu (timestamp) dengan `CLOUDINARY_API_SECRET`.
    - Response: `{ signature, timestamp, apiKey, cloudName, folder }`.
* **Milestone 6: Penegakan Batas Volume Pesanan Server-Side**
  - [x] **BE-06**: Penegakan Batas Volume Pesanan di RPC `create_guest_order` (`supabase/migrations/006_order_volume_limit.sql`)
    - Validasi kuantitas individual per menu: `1 <= quantity <= 99`.
    - Validasi total akumulasi kuantitas seluruh menu dalam sekali pemesanan: `SUM(quantity) <= 99`.
    - Postgres exception: `'Total kuantitas pesanan maksimal 99 item dalam sekali pemesanan.'`.
    - Sinkronisasi dengan client store `src/stores/cart.svelte.ts` dan service `src/lib/guest-order.ts`.
  - [x] **BE-07**: Hardening Keamanan Sistem Order & Anti-Abuse (`supabase/migrations/007_order_security_hardening.sql`)
    - Enforce transisi status state machine di database trigger `protect_order_immutable_fields` (kunci status terminal `selesai` & `dibatalkan`).
    - Anti-DoS input cap: `p_buyer_contact` (max 30 char) dan `p_note` (max 500 char) pada RPC `create_guest_order`.
    - Anti-Spam throttling di level Postgres: batas 20 pesanan per menit per tenant & max 3 pesanan aktif per kontak.
    - Anti-Enumeration token: kolom `tracking_token uuid` pada `orders` & verifikasi otorisasi pada RPC `get_guest_order_status` untuk melindungi data privasi pembeli.
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
  - [ ] **FE-04**: Slicing halaman `Pricing.svelte` (Paket Mikro aktif Rp 49.000 + badge trial 30 hari; Paket Kecil & Menengah berlabel "Segera Hadir").
  - [ ] **FE-05**: Slicing halaman `Register.svelte` (Nama pemilik, nama resto, live subdomain preview `namatoko.restolink.site`, email, password).
    - *Catatan Integrasi:* Gunakan debounce 300–400ms saat memanggil `checkSubdomainAvailability` (`src/lib/subdomain-validator.ts`) pada input form agar tidak membebani query RPC Supabase per keystroke. Gunakan `authStore.signUp` (`src/stores/auth.svelte.ts`) untuk submit registrasi.
  - [ ] **FE-06**: Slicing halaman `Login.svelte` (Input email, password, error display, forgot password stub).
* **Milestone 4, 5, 7: Dashboard Pemilik Usaha UI**
  - [ ] **FE-07**: Halaman `Subscription.svelte`: Tampilan status paket aktif, sisa hari trial, tombol perpanjang langganan.
    - *Catatan Integrasi:* Gunakan `subscriptionStore` (`src/stores/subscription.svelte.ts`) untuk memicu checkout `subscriptionStore.checkout(pkg.id)`. Jika polling 30 detik selesai mendahului konfirmasi webhook, sediakan tombol interaktif "Cek Status Ulang" yang memanggil `authStore.refreshTenant()`.
  - [ ] **FE-08**: Halaman `Profile.svelte`: Form info resto (logo upload preview, nama usaha, deskripsi, alamat, kontak WhatsApp, color picker brand).
    - *Catatan Integrasi:* Gunakan `uploadImage(file, { type: 'logo', onProgress })` (`src/lib/cloudinary-upload.ts`) untuk unggah logo resto. Manfaatkan callback `onProgress` untuk indikator progress bar dan tampilkan ringkasan hasil kompresi (ukuran awal vs terkompresi).
  - [ ] **FE-09**: Halaman `MenuManagement.svelte`: Modal tambah/edit kategori, modal tambah/edit menu (dropzone foto, input harga, toggle ketersediaan `is_available`).
    - *Catatan Integrasi:* Gunakan `uploadImage(file, { type: 'menu', onProgress })` (`src/lib/cloudinary-upload.ts`) pada dropzone foto menu. Hubungkan `onProgress` ke progress bar upload dan tampilkan badge penghematan kompresi WebP (misal: "2.4 MB -> 180 KB (-92%)").
  - [ ] **FE-10**: Halaman `Orders.svelte`: Kolom/tab pesanan per status (`baru`, `diproses`, `selesai`, `dibatalkan`), kartu pesanan dengan snapshot menu & info pemesan.
    - *Catatan Integrasi:* Gunakan `ordersStore` (`src/stores/orders.svelte.ts`) untuk memuat data via `ordersStore.fetchOrders(tenantId)`, filter tab `ordersStore.setStatusFilter(status)`, pembaruan status `ordersStore.updateStatus(orderId, nextStatus)`, serta pemanggilan otomatis `startPolling(tenantId, 15000)` dan `stopPolling()`. Sediakan modal detail dengan `ordersStore.selectOrder(order)`.
* **Milestone 6: Website Publik Tenant UI**
  - [ ] **FE-11**: Layout resto publik `TenantHome.svelte`: Header resto, logo, alamat, badge buka, link WhatsApp.
  - [ ] **FE-12**: Komponen katalog menu: Tab filter kategori, grid kartu menu, badge "Habis" jika non-aktif, tombol tambah ke keranjang.
  - [ ] **FE-13**: Komponen Keranjang Belanja (Drawer/Floating Bar) & Modal Checkout (input nama pemesan wajib, no HP opsional, catatan).
    - *Catatan Integrasi:* Gunakan `guestOrderStore.submit(tenant.id, { buyerName, buyerContact, note })` (`src/stores/guest-order.svelte.ts`) untuk submit pesanan guest. Keranjang otomatis dikosongkan setelah sukses.
  - [ ] **FE-14**: Halaman/modal bukti pesanan (`order_code`) untuk ditunjukkan pembeli ke kasir.
    - *Catatan Integrasi:* Gunakan `guestOrderStore.orderDetail`, `guestOrderStore.statusLabel`, dan `guestOrderStore.statusTone` (`src/stores/guest-order.svelte.ts`) untuk menampilkan status live pesanan. Sediakan tombol salin (copy-to-clipboard) kode pesanan untuk memudahkan pembeli menunjukkan ke kasir. Panggil `guestOrderStore.recoverLastOrder(tenant.id)` saat inisialisasi agar bukti pesanan tidak hilang jika pembeli me-refresh browser.
* **Milestone 8 & 9: Admin Platform UI & Polish**
  - [x] **FE-15**: Halaman `Tenants.svelte`: Tabel daftar seluruh tenant, badge status warna, filter paket, dan modal manual override status.
  - [x] **FE-16**: Halaman `Transactions.svelte`: Tabel riwayat transaksi Midtrans (order ID, nominal, status) dan manual settlement override.
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
