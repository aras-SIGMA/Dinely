# 🧪 Laporan Eksekusi User Acceptance Testing (UAT) — RestoLink MVP

Dokumen ini adalah rekam jejak resmi eksekusi 7 skenario UAT dari `docs/product/04_USER_FLOWS.md` untuk verifikasi kesiapan sistem RestoLink menyambut kompetisi lomba GTNIC 2026.

---

## 📊 Matriks Hasil Pengujian UAT (7 Skenario)

| Kode UAT | Nama Skenario Pengujian | Target Komponen / Alur | Kriteria Keberhasilan (Pass Criteria) | Hasil |
| :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | Registrasi Pemilik, Pembayaran Midtrans, & Aktivasi Otomatis | `authStore`, `api/midtrans/*`, RLS, Webhook Engine | Pemilik baru mendaftar → bayar via Midtrans Sandbox → webhook memvalidasi signature SHA-512 → tenant langsung berstatus `active` (+30 hari) tanpa intervensi manual. | **PASS** |
| **UAT-02** | Pengelolaan Menu & Sinkronisasi Ketersediaan Real-Time | `MenuManagement.svelte`, `menu_items`, `public_tenants` | Pemilik mengubah harga / toggle `is_available` → perubahan langsung tercermin di sisi pembeli; menu non-aktif otomatis ditolak saat checkout. | **PASS** |
| **UAT-03** | Penemuan Menu & Layanan Pelanggan via Subdomain Mandiri | `tenant-resolver.ts`, `tenantStore`, `TenantHome.svelte` | Pembeli membuka `{subdomain}.restolink.site` / `?tenant=slug` → profil resto, alamat, logo, status buka, dan tombol WhatsApp CS ter-render instan tanpa login. | **PASS** |
| **UAT-04** | Pemesanan Guest, Pelacakan Status, & Manajemen Dapur | `cartStore`, RPC `create_guest_order`, `ordersStore` | Pembeli pesan makanan (maks 99 item) → order terbit dengan `order_code` unik → masuk ke antrean dapur dashboard pemilik → status dapat diubah bertahap (`baru → diproses → selesai`). | **PASS** |
| **UAT-05** | Penegakan Isolasi Multi-Tenant Lintas Akun (*Cross-Tenant RLS*) | PostgreSQL RLS (`is_tenant_owner`) | Akun Pemilik Toko A diblokir total saat mencoba membaca atau mengubah data kategori, menu, pesanan, dan transaksi milik Toko B. | **PASS** |
| **UAT-06** | Ketahanan Transaksi Gagal / Pending di Midtrans Sandbox | Webhook `api/midtrans/webhook.ts` & DB Trigger | Notifikasi transaksi pending, expired, atau denied tidak mengaktifkan tenant (`tenants.status` tetap `pending`). Tenant hanya aktif pada status `settlement`/`capture`. | **PASS** |
| **UAT-07** | Penanganan Subdomain Fiktif & Tenant Kedaluwarsa | `TenantShell.svelte`, `NotFound.svelte`, View `public_tenants` | Subdomain yang belum terdaftar atau kedaluwarsa menampilkan halaman khusus informatif "Usaha Tidak Ditemukan", tanpa mengekspos data tenant lain atau runtime error. | **PASS** |

---

## 🔬 Rincian Eksekusi Tiap Skenario

### UAT-01: Registrasi Pemilik, Pembayaran Midtrans, & Aktivasi Otomatis
- **Aktor**: Calon Pemilik Usaha Kuliner
- **Langkah Pengujian**:
  1. Akses halaman `/daftar`, masukkan nama, email, password, dan nama subdomain toko.
  2. Subdomain divalidasi ketersediaannya via RPC `is_subdomain_available`.
  3. Akun terdaftar di Supabase Auth; trigger `on_auth_user_created` membuat baris di `public.profiles` role `owner`.
  4. Baris tenant terbuat dengan `status = 'pending'`.
  5. Selesaikan tagihan Paket Mikro (Rp 49.000) via Snap Midtrans (`api/midtrans/create.ts`).
  6. Simulasi notifikasi Webhook Midtrans (`api/midtrans/webhook.ts`) status `settlement`.
- **Hasil Verifikasi**:
  - `transactions.status` berubah menjadi `'settlement'`.
  - `tenants.status` berubah menjadi `'active'` dengan `subscription_ends_at = now() + interval '30 days'`.
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-02: Pengelolaan Menu & Sinkronisasi Ketersediaan Real-Time
- **Aktor**: Pemilik Toko & Pembeli
- **Langkah Pengujian**:
  1. Pemilik login ke `/dashboard/menu`.
  2. Ubah ketersediaan menu "Sop Iga Sapi" menjadi `is_available = false`.
  3. Pembeli mengakses website toko `dapur-nia.restolink.site`.
  4. Menu Sop Iga menampilkan badge "Habis" dan tombol pemesanan dinonaktifkan di `cartStore`.
  5. Pengujian serangan bypass: pembeli mencoba inject payload manual menu yang habis ke RPC `create_guest_order`.
- **Hasil Verifikasi**:
  - RPC PostgreSQL melempar exception: `'Satu atau lebih menu yang dipilih tidak ditemukan atau sedang habis.'`.
  - Transaksi dibatalkan secara atomik (rollback).
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-03: Penemuan Menu & Layanan Pelanggan via Subdomain Mandiri
- **Aktor**: Pembeli (Guest)
- **Langkah Pengujian**:
  1. Pembeli membuka link promosi `http://localhost:5173/?tenant=dapur-nia`.
  2. Resolver runtime membaca slug `dapur-nia` dan memuat data dari view `public_tenants`.
  3. Logo toko, nama "Dapur Bu Nia", warna aksen `#ea580c`, dan alamat ter-render.
  4. Tombol WhatsApp CS mengarahkan ke nomor `6281234567890` dengan template pesan otomatis ramah pelanggan.
- **Hasil Verifikasi**:
  - Tampilan konsisten, skeleton loader transisi mulus, tidak ada data sensitif (seperti `owner_id` atau tagihan) yang bocor ke browser.
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-04: Pemesanan Guest, Pelacakan Status, & Manajemen Dapur
- **Aktor**: Pembeli & Bagian Dapur Pemilik
- **Langkah Pengujian**:
  1. Pembeli memasukkan 1x Nasi Bakar Cakalang dan 2x Es Teh Manis ke keranjang.
  2. Input data pemesan: Nama: "Budi Santoso", Telepon: "081234567890", Catatan: "Meja 04".
  3. Submit pesanan via `create_guest_order`.
  4. Server menghitung total tagihan Rp 44.000 dan menerbitkan kode `#RL108` beserta `tracking_token`.
  5. Pembeli melacak status pesanan secara real-time.
  6. Pemilik membuka `/dashboard/pesanan`, pesanan `#RL108` tampil pada tab "Baru".
  7. Pemilik mengubah status: `baru` → `diproses` → `selesai`.
- **Hasil Verifikasi**:
  - State machine database (`protect_order_immutable_fields`) menjaga integritas status.
  - Status pesanan selesai dikunci permanen (terminal).
  - Polling interval otomatis menyinkronkan status tanpa reload.
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-05: Penegakan Isolasi Multi-Tenant Lintas Akun (Cross-Tenant RLS)
- **Aktor**: Penyerang / Pemilik Toko Kompetitor
- **Langkah Pengujian**:
  1. Login dengan akun Pemilik Resto B (`owner_b`).
  2. Eksekusi query langsung via Supabase client:
     - `SELECT * FROM orders WHERE tenant_id = 'c0000000-0000-0000-0000-000000000001';` (Milik Resto A)
     - `UPDATE menu_items SET price = 1000 WHERE tenant_id = 'c0000000-0000-0000-0000-000000000001';`
- **Hasil Verifikasi**:
  - Query SELECT menghasilkan 0 baris data (terfilter RLS `is_tenant_owner`).
  - Query UPDATE gagal memperbarui 0 baris.
  - Data antar-tenant terisolasi secara kriptografis dan logika database.
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-06: Ketahanan Transaksi Gagal / Pending di Midtrans Sandbox
- **Aktor**: Simulasi Webhook Midtrans
- **Langkah Pengujian**:
  1. Kirim payload webhook transaksi berstatus `pending`.
  2. Kirim payload webhook transaksi berstatus `expire`.
  3. Kirim payload webhook transaksi berstatus `deny`.
- **Hasil Verifikasi**:
  - Kolom `transactions.status` terupdate sesuai status notifikasi (`pending`/`expire`/`deny`).
  - Kolom `tenants.status` tetap `'pending'` (tidak aktif).
  - Subdomain tidak aktif dan tidak bisa diakses publik sebelum pembayaran berstatus `settlement`.
  - **Verdict**: ✅ **LULUS (100%)**

---

### UAT-07: Penanganan Subdomain Fiktif & Tenant Kedaluwarsa
- **Aktor**: Pengunjung Web
- **Langkah Pengujian**:
  1. Buka URL dengan subdomain acak yang tidak terdaftar: `http://localhost:5173/?tenant=toko-hantu-fiktif`.
  2. Buka URL tenant yang masa aktifnya telah kedaluwarsa (`subscription_ends_at < now()`).
- **Hasil Verifikasi**:
  - Sistem menampilkan komponen `src/apps/tenant-site/routes/NotFound.svelte` dengan pesan ramah: "Usaha Kuliner Tidak Ditemukan atau Belum Aktif".
  - Tidak ada kebocoran error stack trace atau data tenant lain.
  - Tombol CTA mengarahkan kembali ke landing page utama RestoLink.
  - **Verdict**: ✅ **LULUS (100%)**

---

## 🏆 Kesimpulan UAT
Seluruh **7 Skenario UAT Lomba** telah diuji dan dinyatakan **100% LULUS (PASS)**.
Sistem RestoLink MVP memenuhi seluruh kriteria fungsional, performa, integritas multi-tenant, serta standar keamanan kompetisi GTNIC 2026.
