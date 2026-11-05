# 📝 Log Tugas & Keputusan Teknis PM / Fullstack Lead

Dokumen ini adalah rekam jejak resmi pekerjaan, keputusan arsitektur, dan hasil audit kualitas yang dikerjakan oleh **PM & Fullstack Lead**. Dokumen ini diperbarui setiap kali satu task selesai dikerjakan dan diverifikasi.

---

## 📊 Matriks Status Pekerjaan PM (Milestone 1 s/d Milestone 9)

| ID Task | Milestone | Modul / Fitur | Status | Tanggal Selesai | Branch Git |
|---|---|---|---|---|---|
| **FS-M1** | M1 | Database Schema, RLS, Order RPC, & Storage Cloudinary | ✅ Selesai | 02 Nov 2026 | `feature/database-schema-and-rls` |
| **FS-01** | M2 | Enhanced Host & Subdomain Parser + Query Override | ✅ Selesai | 02 Nov 2026 | `feature/subdomain-resolver` |
| **FS-02** | M2 | Tenant Svelte 5 Reactive Store (`public_tenants`) | ✅ Selesai | 02 Nov 2026 | `feature/subdomain-resolver` |
| **FS-03** | M2 | TenantShell Layout, Skeleton Loader, & Theming | ✅ Selesai | 02 Nov 2026 | `feature/subdomain-resolver` |
| **FS-04** | M2 | Polish Tenant Home, WhatsApp CS Card, & 404 Route | ✅ Selesai | 02 Nov 2026 | `feature/subdomain-resolver` |
| **FS-05** | M2 | Eager Prefetch & In-Flight Request Deduplication | ✅ Selesai | 02 Nov 2026 | `feature/subdomain-resolver` |
| **FS-06** | M3 | Subdomain Availability RPC & Validation Service | ✅ Selesai | 03 Nov 2026 | `feature/auth-and-registration` |
| **FS-07** | M3 | Owner Auth Store & Tenant Provisioning Engine | ✅ Selesai | 03 Nov 2026 | `feature/auth-and-registration` |
| **FS-08** | M3 | Route Guard Engine & Access Control Hooks | ✅ Selesai | 03 Nov 2026 | `feature/auth-and-registration` |
| **FS-08** | M4 | Integrasi Client Midtrans Snap Popup | ✅ Selesai | 03 Nov 2026 | `feature/midtrans-payment` |
| **FS-09** | M5 | Client Canvas Image Compressor (WebP) | ✅ Selesai | 04 Nov 2026 | `feature/menu-and-cloudinary-upload` |
| **FS-10** | M5 | Client Cloudinary Direct Uploader | ✅ Selesai | 04 Nov 2026 | `feature/cloudinary-upload` |
| **FS-11** | M6 | Reactive Cart Store & LocalStorage Sync | ✅ Selesai | 04 Nov 2026 | `feature/tenant-site-and-order` |
| **FS-12** | M6 | Integrasi Submit Guest Order RPC & Status Tracking | ✅ Selesai | 04 Nov 2026 | `feature/guest-order-integration` |
| **FS-13** | M7 | Owner Order Realtime Sync & Status Transition | ✅ Selesai | 04 Nov 2026 | `feature/order-management` |
| **FS-14** | M8 | Admin Tenant Monitoring & Manual Override | ✅ Selesai | 05 Nov 2026 | `feature/admin-and-landing` |
| **FS-15** | M9 | Eksekusi 7 Skenario UAT Lomba & Demo Data Polish | ⏹️ Antrean | - | `feature/uat-and-hardening` |

---

## 📜 Riwayat Detail Pengerjaan Task

### [FS-M1] Finalisasi Database Schema, RLS, Order RPC, & Migrasi Storage
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M1 (Database & RLS)
* **Branch**: `feature/database-schema-and-rls`
* **File Terkait**:
  - `supabase/migrations/001_initial_schema.sql` s/d `004_triggers.sql`
  - `supabase/seed.sql`
  - `api/cloudinary/sign-upload.ts`
  - `.env.example`, `README.md`, `docs/MILESTONES.md`
* **Keputusan Teknis**:
  1. Pengalihan storage dari Cloudflare R2 ke Cloudinary (kuota gratis 25 GB tanpa kartu kredit). Package `@aws-sdk/*` dicopot.
  2. Implementasi CTE murni anti-OID caching di RPC `create_guest_order`.
  3. Mengunci `order_items.subtotal` sebagai `GENERATED ALWAYS AS (price_snapshot * quantity) STORED`.
  4. Penyusunan 10 test case QA di `docs/qa/restolink_db_test_cases.md`.
* **Hasil Verifikasi**:
  - Eksekusi 10 skenario SQL di Supabase SQL Editor lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Sukses.

---

### [FS-01] Enhanced Host & Subdomain Parser
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M2 (Subdomain Resolver Engine)
* **Branch**: `feature/subdomain-resolver`
* **File Terkait**:
  - `src/lib/config.ts`
  - `src/lib/tenant-resolver.ts`
  - `src/lib/host.ts`
* **Keputusan Teknis**:
  1. Sinkronisasi 14 kata *reserved subdomains* dengan DDL SQL (`support`, `billing`, dll).
  2. Penambahan fungsi validasi `isValidSubdomain` (panjang 3–63 char, regex, no dash di awal/akhir).
  3. Dukungan query parameter override `?tenant=slug` dan `?t=slug` untuk memudahkan dev lokal dan preview URL Vercel.
* **Hasil Verifikasi**:
  - Unit test mandiri (16 skenario URL lokal/prod/reserved/IP/query) lulus 16/16.

---

### [FS-02] Tenant Svelte 5 Reactive Store
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M2 (Subdomain Resolver Engine)
* **Branch**: `feature/subdomain-resolver`
* **File Terkait**:
  - `src/stores/tenant.svelte.ts`
* **Keputusan Teknis**:
  1. State management berbasis Svelte 5 Runes (`$state`, derived getters).
  2. Query murni ke database view `public_tenants` (otomatis menyaring tenant aktif/trial dan belum expired).
  3. Data sensitif (`owner_id`, `current_package_id`, riwayat tagihan) terlindungi dan tidak di-expose ke store.
* **Hasil Verifikasi**:
  - Uji transisi state (initial, fetch sukses, not found, reset) lulus 100%.

---

### [FS-03] TenantShell Layout & Dynamic Theming
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M2 (Subdomain Resolver Engine)
* **Branch**: `feature/subdomain-resolver`
* **File Terkait**:
  - `src/apps/tenant-site/TenantShell.svelte`
  - `src/routes/tenant.ts`
* **Keputusan Teknis**:
  1. Injeksi dinamis variabel CSS `--brand-primary: {tenant.primary_color}` pada container root.
  2. Skeleton loading state saat fetch view `public_tenants`.
  3. Error boundary terisolasi saat koneksi server database terkendala dengan opsi muat ulang.
* **Hasil Verifikasi**:
  - `npm run check`: 0 error.
  - `npm run build`: Sukses.

---

### [FS-04] Polish Tenant Home & Customer Service WhatsApp Card
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M2 (Subdomain Resolver Engine)
* **Branch**: `feature/subdomain-resolver`
* **File Terkait**:
  - `src/apps/tenant-site/routes/TenantHome.svelte`
  - `src/apps/tenant-site/routes/NotFound.svelte`
* **Keputusan Teknis**:
  1. Penegasan peran WhatsApp toko: Murni untuk **layanan bantuan / tanya jawab / pesanan khusus**, bukan jalur pemesanan reguler (jalur pemesanan reguler diproses langsung via web di M6).
  2. Card dedicated WhatsApp CS dengan template pesan ramah otomatis.
  3. Halaman 404 informatif saat tenant fiktif diakses.
* **Hasil Verifikasi**:
  - Verifikasi browser: Tampilan profil, logo/inisial toko, kontak, dan alamat ter-render akurat.

---

### [FS-05] Eager Prefetch & In-Flight Request Deduplication
* **Tanggal Selesai**: 02 November 2026
* **Milestone**: M2 (Subdomain Resolver Engine)
* **Branch**: `feature/subdomain-resolver`
* **File Terkait**:
  - `src/App.svelte`
  - `src/stores/tenant.svelte.ts`
  - `src/apps/tenant-site/routes/TenantHome.svelte`
* **Keputusan Teknis**:
  1. Prefetch data tenant di root router `App.svelte` saat `host.slug` terdeteksi.
  2. Mekanisme deduplikasi promise `#inFlight` di store untuk memblokir race condition dan redundant network query.
  3. Fallback cerdas nomor kontak WhatsApp (`contact_whatsapp` -> `contact_phone`).
* **Hasil Verifikasi**:
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Berhasil dibundel tanpa kendala.
  - Audit keamanan URL: Percobaan mengakses `/dashboard` di subdomain tenant otomatis diblokir ke halaman 404.

---

### [PM-DECISION-01] Penyelarasan Harga Paket Mikro & Transisi Status Tenant
* **Tanggal**: 02 November 2026
* **Konteks**: Sinkronisasi dokumen produk, `TIM_TASKS.md`, `seed.sql`, dan implementasi BE-01 Midtrans.
* **Keputusan Resmi PM**:
  1. **Nominal Paket Mikro**: Ditetapkan final **Rp 49.000 / bulan** (menghapus referensi lama Rp 29.000 di `TIM_TASKS.md`).
  2. **Transisi Status Tenant (Opsi A)**: Setelah pembayaran awal Rp 49.000 tervalidasi webhook Midtrans, `tenants.status` langsung `'active'` dengan `subscription_ends_at = now() + interval '30 days'`. Enum `'trial'` disimpan untuk kemungkinan roadmap free trial di masa depan.
  3. **Router Library**: Mengonfirmasi penggunaan `sv-router` (history mode), mengoreksi catatan lama `svelte-spa-router` di `docs/notulen/01_arsitektur_dan_skema.md`.
  4. **Runtime Backend**: Vercel Serverless Functions (`api/` Node.js/TS).

---

### [FS-06] Subdomain Availability RPC & Validation Service
* **Tanggal Selesai**: 03 November 2026
* **Milestone**: M3 (Autentikasi & Registrasi Pemilik Usaha)
* **Branch**: `feature/auth-and-registration`
* **File Terkait**:
  - `supabase/migrations/005_subdomain_rpc.sql`
  - `src/lib/subdomain-validator.ts`
* **Keputusan Teknis**:
  1. Fungsi RPC Postgres `is_subdomain_available(subdomain_input text)` beratribut `SECURITY DEFINER` dan `SET search_path = public, pg_temp` agar role `anon` dan `authenticated` dapat mengecek keunikan subdomain tanpa membuka akses SELECT langsung ke tabel `tenants`.
  2. Sinkronisasi penuh 14 daftar reserved subdomains dan regex `^[a-z0-9-]+$` (panjang 3-63 karakter, tanpa tanda hubung di awal/akhir).
  3. Service client `src/lib/subdomain-validator.ts` menyertakan `slugify` (pembersihan otomatis nama toko menjadi format URL) dan validasi sintaks lokal sebelum memicu network call RPC.
  4. Instruksi delegasi FE-05: Frontend Developer wajib memasang debounce 300–400ms saat menghubungkan input subdomain ke `checkSubdomainAvailability` agar tidak memicu query RPC per ketukan tombol.
* **Hasil Verifikasi**:
  - Unit test lokal (slugify, format length, dash check, reserved subdomains) lulus 100%.
  - `npm run check`: 0 error, 0 warning.

---

### [FS-07] Owner Auth Store & Tenant Provisioning Engine
* **Tanggal Selesai**: 03 November 2026
* **Milestone**: M3 (Autentikasi & Registrasi Pemilik Usaha)
* **Branch**: `feature/auth-and-registration`
* **File Terkait**:
  - `src/stores/auth.svelte.ts`
  - `src/App.svelte`
* **Keputusan Teknis**:
  1. State reaktif Svelte 5 (`loading`, `profile`, `tenant`) dengan helper derived getters (`role`, `isAuthenticated`, `isOwner`, `isPlatformAdmin`, `hasActiveTenant`).
  2. Metode `signUp`: Verifikasi ketersediaan subdomain -> pendaftaran Supabase Auth -> sinkronisasi profil -> otomatis membuat baris tenant status `pending` jika sesi aktif.
  3. Metode `signIn`: Validasi password -> eager load paralel profil dan data tenant (`loadProfile` & `loadTenant`).
  4. Jeda retry resilient (250ms) pada `loadProfile` untuk menangani asinkronisitas eksekusi trigger `on_auth_user_created`.
* **Hasil Verifikasi**:
  - `npm run check`: 0 error, 0 warning.

---

### [FS-08] Route Guard Engine & Access Control Hooks
* **Tanggal Selesai**: 03 November 2026
* **Milestone**: M3 (Autentikasi & Registrasi Pemilik Usaha)
* **Branch**: `feature/auth-and-registration`
* **File Terkait**:
  - `src/lib/guards.ts`
  - `src/routes/platform.ts`
  - `src/App.svelte`
* **Keputusan Teknis**:
  1. Engine otorisasi RBAC murni (`evaluateAccess`):
     - Rute `/dashboard/*` terproteksi khusus role `owner`. Guest dilempar ke `/masuk`, admin dialihkan ke `/admin`.
     - Rute `/admin/*` terproteksi khusus role `platform_admin`. Guest dilempar ke `/masuk`, owner dialihkan ke `/dashboard`.
     - Rute guest-only (`/masuk`, `/daftar`) otomatis mengalihkan user yang sudah login ke dashboard masing-masing.
  2. Pemasangan lifecycle hooks `beforeLoad` pada konfigurasi rute `sv-router`. Menunggu `authStore.waitUntilReady()` untuk mencegah false redirect saat inisialisasi awal.
  3. Integrasi fungsi `navigate` router klien via `setPlatformNavigate` di `App.svelte` dengan fallback `window.location.replace`.
* **Hasil Verifikasi**:
  - Unit test RBAC (seluruh permutasi login/unauth/role mismatch/role match) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala.

---

### [FS-09] Integrasi Client Midtrans Snap Popup
* **Tanggal Selesai**: 03 November 2026
* **Milestone**: M4 (Midtrans Payment Client)
* **Branch**: `feature/midtrans-payment`
* **File Terkait**:
  - `src/types/index.ts`
  - `src/lib/midtrans.ts`
  - `src/stores/subscription.svelte.ts`
  - `src/apps/dashboard/routes/Subscription.svelte`
* **Keputusan Teknis**:
  1. Loader script dinamis `loadSnapScript` dengan caching promise untuk mengunduh library Midtrans Snap JS sekali saja, mendukung mode sandbox dan produksi.
  2. Implementasi `createSubscriptionTransaction`: meminta snap token ke endpoint serverless `POST /api/midtrans/create` menggunakan Bearer token JWT Supabase.
  3. Integrasi Svelte 5 reactive store `subscriptionStore`:
     - Memuat daftar paket aktif via `fetchPackages()`.
     - Orkestrasi `checkout`: request token -> buka popup `window.snap.pay` -> polling status tenant aktivasi via `pollTenantActivation`.
  4. Penyediaan dummy test harness pada `Subscription.svelte` sebagai sarana pengujian langsung sebelum slicing final Frontend Dev (`FE-07`) siap.
  5. Instruksi delegasi FE-07: Sediakan tombol manual "Cek Status Ulang" yang memanggil `authStore.refreshTenant()` jika polling otomatis 30 detik selesai sebelum webhook Midtrans selesai memproses update database.
* **Hasil Verifikasi**:
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (3.77s).

---

### [FS-09] Client Canvas Image Compressor (WebP)
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M5 (Menu Management & Cloudinary Image Upload)
* **Branch**: `feature/menu-and-cloudinary-upload`
* **File Terkait**:
  - `src/lib/image-compressor.ts`
* **Keputusan Teknis**:
  1. Validasi awal berkas (`validateImage`): memastikan MIME type valid (`image/jpeg`, `image/png`, `image/webp`, dll) dan membatasi ukuran input mentah maksimum 10MB.
  2. Perhitungan dimensi proporsional (`calculateDimensions`): membatasi panjang dan lebar gambar maksimum 800px sambil mempertahankan aspek rasio asli.
  3. Konversi format & optimasi adaptif (`compressImage`):
     - Prioritas format output WebP (`image/webp`) dengan fallback aman ke JPEG jika browser tidak mendukung WebP export.
     - Ladder kualitas bertahap (0.85 -> 0.75 -> 0.65 -> 0.50).
     - Downscaling dimensi dinamis (skala -20%) jika pada kualitas 0.50 ukuran masih melampaui batas 300KB (307.200 bytes).
     - Otomatis mengganti ekstensi output menjadi `.webp` (`getWebpFilename`).
  4. Manajemen memori aman: pembersihan object URL via `URL.revokeObjectURL(url)` segera setelah gambar selesai dimuat.
  5. Instruksi integrasi FS-10 (`cloudinary-upload.ts`): File gambar wajib melewati `compressImage` sebelum multipart upload, dan fungsi upload wajib mengembalikan metadata ringkasan kompresi (`originalSize`, `compressedSize`, `compressionRatio`) agar UI dapat menampilkan feedback penghematan ukuran file.
* **Hasil Verifikasi**:
  - Unit test lokal (dimensi, ukuran byte, penamaan ekstensi, validasi berkas) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (5.59s).

---

### [FS-10] Client Cloudinary Direct Uploader
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M5 (Menu Management & Cloudinary Image Upload)
* **Branch**: `feature/cloudinary-upload`
* **File Terkait**:
  - `src/lib/cloudinary-upload.ts`
* **Keputusan Teknis**:
  1. Integrasi otomatis `compressImage` (`src/lib/image-compressor.ts`) sebelum pengiriman data, memastikan semua foto menu dan logo yang diunggah ke Cloudinary bertipe WebP dan berukuran <= 300KB.
  2. Alur otentikasi signature backend:
     - Mengirim request `POST /api/cloudinary/sign-upload` berotentikasi Bearer token JWT Supabase dengan payload kategori (`menu` atau `logo`).
     - Mendukung parsing fleksibel payload langsung `{ signature, timestamp, apiKey, cloudName, folder }` maupun nested `{ data: { ... } }`.
  3. Direct multipart upload ke Cloudinary API (`https://api.cloudinary.com/v1_1/<cloudName>/image/upload`):
     - Memanfaatkan `XMLHttpRequest` untuk real-time upload progress tracking (`onProgress: (percent: number) => void`) dengan fallback ke `fetch`.
     - Validasi status response dan `secure_url`.
  4. Penyediaan metadata penghematan kompresi (`originalSize`, `compressedSize`, `compressionRatio`, `savedBytes`, `savedPercent`) pada hasil upload untuk memudahkan integrasi UI feedback visual.
  5. Instruksi delegasi FE-08 & FE-09: Frontend Developer wajib menghubungkan callback `onProgress: (percent) => void` pada `uploadImage` ke komponen progress bar UI, serta menampilkan badge informasi efisiensi kompresi gambar (contoh: "2.4 MB -> 180 KB (-92%)") saat pemilik mengunggah logo usaha dan foto menu.
* **Hasil Verifikasi**:
  - Unit test lokal (perhitungan penghematan byte/persentase, parsing signature, pemetaan data response) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (3.60s).

---

### [FS-11] Reactive Cart Store & LocalStorage Sync
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M6 (Website Publik Tenant & Guest Checkout)
* **Branch**: `feature/tenant-site-and-order`
* **File Terkait**:
  - `src/stores/cart.svelte.ts`
* **Keputusan Teknis**:
  1. Pengelolaan state berbasis Svelte 5 Runes (`items = $state([])`, `tenantId = $state(null)`), dengan getters reaktif (`totalItems`, `subtotal`, `formattedSubtotal`, `isEmpty`, `itemCount`, `rpcPayloadItems`).
  2. Isolasi multi-tenant pada browser storage: Kunci LocalStorage dibedakan per resto (`restolink_cart_${tenantId}`) agar keranjang tidak saling menimpa saat pelanggan membuka beberapa toko kuliner berbeda.
  3. Validasi & batas integritas keranjang:
     - Menolak penambahan menu habis (`is_available === false`).
     - Membatasi kuantitas maksimum per menu hingga 99 item (`MAX_QUANTITY_PER_ITEM = 99`).
     - Membatasi variasi menu dalam satu keranjang hingga 50 jenis (`MAX_ITEMS_IN_CART = 50`) selaras dengan batas validasi anti-DoS RPC Postgres `create_guest_order`.
  4. Penyusunan payload RPC otomatis via getter `rpcPayloadItems`: memetakan item langsung menjadi format `{ menu_item_id, quantity }` untuk konsumsi Task FS-12 berikutnya.
* **Hasil Verifikasi**:
  - Unit test lokal (tambah item, akumulasi qty, penolakan stok habis, decrement/auto-remove, isolasi multi-tenant, persistensi storage, format Rupiah) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (3.74s).

---

### [FS-12] Integrasi Submit Guest Order RPC & Status Tracking
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M6 (Website Publik Tenant & Guest Checkout)
* **Branch**: `feature/guest-order-integration`
* **File Terkait**:
  - `src/lib/guest-order.ts`
  - `src/stores/guest-order.svelte.ts`
* **Keputusan Teknis**:
  1. Service `src/lib/guest-order.ts`:
     - Validasi data input di client (`validateGuestOrderInput`): panjang nama pemesan (2-100 char), batas jenis menu (1-50 item), kuantitas menu (1-99), dan panjang catatan (max 500 char).
     - Pemanggilan RPC Postgres `create_guest_order` dengan proteksi error handling transaksional.
     - Pemanggilan RPC Postgres `get_guest_order_status` dengan proteksi masking nomor kontak pemesan (PII protection).
     - Helper LocalStorage persistensi kode pesanan terakhir (`saveLastOrderCode`, `getLastOrderCode`, `clearLastOrderCode`) berbasis tenant.
  2. Reactive store Svelte 5 `guestOrderStore` (`src/stores/guest-order.svelte.ts`):
     - State reaktif proses pemesanan (`submitting`, `trackingLoading`, `lastOrder`, `orderDetail`, `errorMessage`).
     - Derived helpers: `statusLabel` ramah pengguna berbahasa Indonesia, `statusTone` badge warna UI (`info`, `warning`, `success`, `error`), `isTerminal` indikator selesai/batal.
     - Polling interval dinamis (12 detik) yang otomatis berhenti jika pesanan mencapai status terminal (`selesai` / `dibatalkan`).
     - Mekanisme pemulihan pesanan `recoverLastOrder` untuk mengantisipasi ketidaksengajaan reload browser pada smartphone pembeli.
  3. Instruksi delegasi FE-13 & FE-14: Frontend Developer diarahkan untuk mengintegrasikan `guestOrderStore.submit` pada form checkout modal serta `guestOrderStore.orderDetail` / `recoverLastOrder` pada modal bukti pesanan, lengkap dengan tombol salin (copy-to-clipboard) kode pesanan `order_code`.
* **Hasil Verifikasi**:
  - Unit test lokal (validasi input nama/item/qty/note, persistensi kode pesanan, pemetaan status & tone, state reactivity) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (3.61s).

---

### [FS-13] Store Pesanan Pemilik & Realtime Sync
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M7 (Dashboard Pesanan / Owner Order Tracking)
* **Branch**: `feature/order-management`
* **File Terkait**:
  - `src/types/index.ts`
  - `src/stores/orders.svelte.ts`
  - `src/apps/dashboard/routes/Orders.svelte`
* **Keputusan Teknis**:
  1. Penambahan tipe relasi `OrderWithItems` di `src/types/index.ts` untuk memfasilitasi join tabel `orders` dan `order_items` (snapshot menu, harga, qty, subtotal).
  2. Implementasi `ordersStore` (`src/stores/orders.svelte.ts`):
     - State reaktif Svelte 5 runes (`orders`, `loading`, `updatingId`, `selectedStatus`, `selectedOrder`, `errorMessage`).
     - Derived helpers: `filteredOrders` (filter status otomatis), `countsByStatus` (agregasi jumlah pesanan per status untuk tab badge), `newOrderCount` (indikator pesanan masuk baru).
     - Aturan transisi status resmi (`ALLOWED_TRANSITIONS` & `isTransitionAllowed`):
       - `baru` -> `diproses` atau `dibatalkan`
       - `diproses` -> `selesai` atau `dibatalkan`
       - Status `selesai` dan `dibatalkan` dikunci (terminal, tidak dapat diubah kembali).
     - Integrasi Supabase client: query join `orders` dan `order_items` dengan sorting terbaru (`created_at DESC`), serta optimasi update status pesanan.
     - Sinkronisasi real-time otomatis via interval polling 15 detik (`startPolling(tenantId, 15000)` dan `stopPolling()`) dengan silent background update agar posisi scroll UI tidak terganggu.
  3. Implementasi antarmuka pengujian operasional pada `src/apps/dashboard/routes/Orders.svelte`:
     - Tab filter status dengan counter badge.
     - Kartu pesanan lengkap dengan kode unik, info pemesan, catatan, rincian menu snapshot, total tagihan, dan tombol aksi transisi status bertahap.
     - Modal rincian pesanan terperinci (`selectOrder`).
  4. Instruksi delegasi FE-10: Frontend Developer diarahkan untuk memanfaatkan `ordersStore` untuk menyambungkan layout kustom Dashboard Pesanan.
* **Hasil Verifikasi**:
  - Unit test lokal (aturan transisi status, label, tone, agregasi counter status, filter pesanan) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (3.82s).

---

### [PM-DECISION-02] Penegakan Batas Volume Pesanan Sekali Pemesanan (Max 99 Item)
* **Tanggal Selesai**: 04 November 2026
* **Konteks**: Anti-spam / anti-abuse perlindungan kapasitas dapur resto UMKM dari pesanan fiktif berukuran masif.
* **File Terkait**:
  - `supabase/migrations/006_order_volume_limit.sql`
  - `supabase/migrations/003_order_rpc.sql`
  - `src/stores/cart.svelte.ts`
  - `src/lib/guest-order.ts`
  - `docs/TIM_TASKS.md`
* **Keputusan Teknis**:
  1. Batasan volume pesanan guest dikunci maksimal 99 item total kuantitas per transaksi (`SUM(quantity) <= 99`), bukan batas harian toko.
  2. Lapisan Frontend / Client:
     - `src/stores/cart.svelte.ts`: `MAX_TOTAL_QUANTITY_PER_ORDER = 99`. Metode `addItem`, `updateQuantity`, `increment`, dan `loadFromStorage` membatasi akumulasi seluruh item agar tidak melampaui 99 item.
     - `src/lib/guest-order.ts`: `validateGuestOrderInput` memvalidasi `totalQuantity <= 99` sebelum RPC dipanggil.
  3. Lapisan Backend / Database RPC:
     - `supabase/migrations/006_order_volume_limit.sql` (dan sinkronisasi `003_order_rpc.sql`): RPC `create_guest_order` menghitung `total_quantity` via CTE dan melempar `RAISE EXCEPTION 'Total kuantitas pesanan maksimal 99 item dalam sekali pemesanan.'` jika `v_total_quantity > 99`, serta membatasi kuantitas individual per menu `1 <= quantity <= 99`.
* **Hasil Verifikasi**:
  - Unit test lokal boundary condition (99 item lolos, 100 item ditolak, multi-item split) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala.

---

### [BE-07 / SEC-01] Hardening Keamanan Sistem Order & Anti-Abuse
* **Tanggal Selesai**: 04 November 2026
* **Milestone**: M6–M7 (Hardening & Security Governance)
* **Branch**: `feature/order-management`
* **File Terkait**:
  - `supabase/migrations/007_order_security_hardening.sql`
  - `supabase/migrations/003_order_rpc.sql`
  - `supabase/migrations/004_triggers.sql`
  - `src/types/index.ts`
  - `src/lib/guest-order.ts`
  - `src/stores/guest-order.svelte.ts`
* **Keputusan Teknis**:
  1. **Enforce State Machine DB**:
     - Fungsi trigger `protect_order_immutable_fields()` memblokir perubahan jika status sudah `selesai` atau `dibatalkan` (terminal), serta hanya mengizinkan transisi `baru -> diproses/dibatalkan` dan `diproses -> selesai/dibatalkan`.
  2. **Anti-DoS Input Cap**:
     - Parameter `p_buyer_contact` dibatasi max 30 karakter dengan validasi format nomor kontak di client & database.
     - Parameter `p_note` dibatasi max 500 karakter di client & database.
  3. **PostgreSQL Anti-Spam Throttling**:
     - Pembatasan maksimal 20 pesanan per menit per tenant untuk membendung flood bot.
     - Pembatasan maksimal 3 pesanan aktif (`baru`) per nomor kontak dalam 10 menit.
  4. **Anti-Enumeration Token Guard**:
     - Kolom `tracking_token uuid` digenerate saat order dibuat dan disimpan di `localStorage` pemesan.
     - RPC `get_guest_order_status` menyaring data berdasarkan token. Akses tanpa token hanya menerima masked view tanpa PII (nama, kontak, catatan, rincian menu disembunyikan).
  5. **Client Cooldown**:
     - Debounce cooldown 3 detik pada submit pesanan guest di `guestOrderStore` untuk mencegah multi-click / double order submission.
* **Hasil Verifikasi**:
  - Unit test (validasi format nomor, panjang teks, validasi state machine, dan proteksi tracking token) lulus 100%.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala.

---

### [FS-14] Query Admin Lintas-Tenant & Manual Override Status
* **Tanggal Selesai**: 05 November 2026
* **Milestone**: M8 (Dashboard Admin Platform)
* **Branch**: `feature/admin-and-landing`
* **File Terkait**:
  - `src/types/index.ts`
  - `src/stores/admin.svelte.ts`
  - `src/apps/admin/AdminLayout.svelte`
  - `src/apps/admin/routes/Tenants.svelte`
  - `src/apps/admin/routes/Transactions.svelte`
* **Keputusan Teknis**:
  1. Definisi model data relasional `AdminTenantItem` (join `owner:profiles`, `package:packages`) dan `AdminTransactionItem` (join `tenant:tenants`, `package:packages`) di `src/types/index.ts`.
  2. Implementasi store reaktif `adminStore` (`src/stores/admin.svelte.ts`):
     - State reaktif runes: `tenants`, `transactions`, `packages`, filter status & query pencarian, indikator loading & updating ID.
     - Derived helpers: `filteredTenants`, `tenantCounts`, `filteredTransactions`, `transactionStats` (total transaksi, jumlah settlement/pending/failed, total akumulasi omset platform).
     - Metode `updateTenantStatus`: aksi manual override status tenant (`active`, `trial`, `pending`, `suspended`, `expired`) dengan fleksibilitas perpanjangan masa aktif langganan/trial secara kustom (`extendDays`) dan penyesuaian paket.
     - Metode `updateTransactionStatus`: override status transaksi Midtrans (misal: menandai `settlement` manual jika webhook Midtrans mengalami kegagalan transmisi), dilengkapi auto-sync aktivasi tenant (+30 hari langganan).
     - Polling sinkronisasi background 30 detik (`startPolling` & `stopPolling`).
  3. Antarmuka Manajemen Tenant (`src/apps/admin/routes/Tenants.svelte`):
     - 6 kartu metrik status (Total, Aktif, Trial, Pending, Ditangguhkan, Kedaluwarsa).
     - Filter tab status responsif dengan counter badge dan input pencarian multi-parameter (nama resto, subdomain, pemilik, no telepon).
     - Tabel komprehensif dengan logo/avatar warna brand, direct link tenant, profil pemilik, badge paket, status tone, dan tanggal masa aktif.
     - Modal interaktif "Manual Override Status Tenant" lengkap dengan audit trail catatan alasan override.
  4. Antarmuka Riwayat Transaksi (`src/apps/admin/routes/Transactions.svelte`):
     - 4 kartu ringkasan keuangan platform.
     - Tabel riwayat Midtrans dengan fitur copy Order ID instan, nominal Rupiah terformat, badge status, dan modal override transaksi dengan opsi aktivasi tenant otomatis.
  5. Navigasi Admin (`src/apps/admin/AdminLayout.svelte`):
     - Active route highlighting, profile admin badge, and responsive drawer navigation.
* **Hasil Verifikasi**:
  - Unit test lokal (format Rupiah, pemetaan status label & badge tone, filter & search simulator) lulus 100%.
  - Audit kode & perbaikan temuan (Code Review):
    1. Reaktivitas sidebar admin (`AdminLayout.svelte` & `src/lib/router.ts`): Memanfaatkan `router.route.pathname` dalam `$derived` rune untuk sinkronisasi seketika status link aktif saat navigasi SPA.
    2. Audit trail persisten (`supabase/migrations/008_admin_audit_logs.sql`): Pembuatan tabel `admin_audit_logs` dengan RLS `is_platform_admin()` untuk mencatat jejak setiap aksi override status tenant dan transaksi beserta alasannya.
    3. Eliminasi duplikasi kode (`src/lib/format.ts`): Sentralisasi helper `formatRupiah` dan `formatDate` sebagai single source of truth.
  - Verifikasi browser (Headless Chrome): Landing page, form login, dan redirect guard terverifikasi valid tanpa error konsol.
  - `npm run check`: 0 error, 0 warning.
  - `npm run build`: Bundling sukses tanpa kendala (5.52s).
