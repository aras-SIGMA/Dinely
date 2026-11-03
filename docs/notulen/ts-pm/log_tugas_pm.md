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
| **FS-06** | M3 | Subdomain Availability RPC & Validation Service | ⏳ Antrean | - | `feature/auth-and-registration` |
| **FS-07** | M3 | Owner Auth Store & Tenant Provisioning Engine | ⏳ Antrean | - | `feature/auth-and-registration` |
| **FS-08** | M3 | Route Guard Engine & Access Control Hooks | ⏳ Antrean | - | `feature/auth-and-registration` |
| **FS-09** | M4 | Integrasi Client Midtrans Snap Popup | ⏹️ Antrean | - | `feature/midtrans-payment` |
| **FS-10** | M5 | Client Canvas Image Compressor (WebP) | ⏹️ Antrean | - | `feature/menu-and-cloudinary-upload` |
| **FS-11** | M6 | Reactive Cart Store & Guest Order RPC Integration | ⏹️ Antrean | - | `feature/tenant-site-and-order` |
| **FS-12** | M7 | Owner Order Realtime Sync & Status Transition | ⏹️ Antrean | - | `feature/order-management` |
| **FS-13** | M8 | Admin Tenant Monitoring & Manual Override | ⏹️ Antrean | - | `feature/admin-and-landing` |
| **FS-14** | M9 | Eksekusi 7 Skenario UAT Lomba & Demo Data Polish | ⏹️ Antrean | - | `feature/uat-and-hardening` |

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
