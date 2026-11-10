# Skema Database — Dinely (Supabase / Postgres)

> ⚠️ **Semua nama tabel, kolom, dan tipe data di dokumen ini adalah ASUMSI DESAIN** yang diturunkan dari requirement di `01_PRD.md` dan `02_ARCHITECTURE.md`. Proposal asli hanya menyebutkan entitas-entitas ini secara naratif (tenant, paket & langganan, transaksi pembayaran, kategori, menu, pesanan) tanpa skema literal. Validasi & sesuaikan dengan tim sebelum migrasi final — tapi struktur ini sudah konsisten dengan semua requirement fungsional di PRD dan bisa langsung dipakai sebagai titik awal.

Satu tabel = satu baris tenant terhubung ke seluruh data mereka (menu, pesanan, dst.) via `tenant_id`, diamankan dengan **Row Level Security (RLS)**.

---

## 1. Ringkasan Entitas (ERD Tekstual)

```
profiles (1) ──< (owns) ──(1) tenants
tenants (1) ──< packages_subscriptions
tenants (1) ──< transactions
tenants (1) ──< categories ──< menu_items
tenants (1) ──< orders ──< order_items >── menu_items
tenants (1) ──< staff_members (lanjutan, di luar MVP)
packages (1) ──< packages_subscriptions
packages (1) ──< transactions
addons (1) ──< tenant_addons >── tenants  (lanjutan)
```

---

## 2. `profiles`
Ekstensi dari `auth.users` milik Supabase Auth — menyimpan data tambahan pengguna (Pemilik Usaha / Admin Platform).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK, = `auth.users.id`) | |
| `full_name` | `text` | |
| `phone` | `text` | |
| `role` | `enum('owner','platform_admin')` | Staff ditambahkan di skema lanjutan |
| `created_at` | `timestamptz` | default `now()` |

**RLS**: user hanya bisa `SELECT`/`UPDATE` baris miliknya sendiri (`id = auth.uid()`). `platform_admin` boleh `SELECT` semua.

---

## 3. `tenants`
Satu baris = satu usaha UMKM yang terdaftar.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `owner_id` | `uuid` (FK → `profiles.id`) | Pemilik usaha |
| `business_name` | `text` | Nama usaha |
| `subdomain` | `text`, **unique**, not null | Slug untuk resolusi tenant (lihat `02_ARCHITECTURE.md` bag. 4) |
| `logo_url` | `text` | Path/URL di Cloudinary |
| `description` | `text` | |
| `contact_phone` | `text` | |
| `contact_whatsapp` | `text` | |
| `address` | `text` | |
| `status` | `enum('pending','active','trial','suspended','expired')` | Status tenant — menentukan apakah website publik tampil |
| `current_package_id` | `uuid` (FK → `packages.id`, nullable) | Paket aktif saat ini |
| `trial_ends_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

**RLS**:
- `SELECT` publik (anon) **hanya** untuk baris dengan `status IN ('active','trial')`, dan hanya kolom-kolom publik (gunakan view terpisah `public_tenant_profile` jika perlu menyembunyikan kolom sensitif).
- `owner_id = auth.uid()` boleh `SELECT`/`UPDATE` baris miliknya, termasuk saat status belum aktif.
- `platform_admin` boleh `SELECT` semua, `UPDATE` kolom `status` (untuk bantu penanganan masalah aktivasi — FR terkait Admin Platform).

> **Catatan unik constraint**: validasi `subdomain` harus dicek *case-insensitive*, hanya karakter alfanumerik + dash, dan terhadap daftar reserved words (mis. `www`, `admin`, `api`, `app`) agar tidak bentrok dengan rute platform sendiri.

---

## 4. `packages`
Katalog paket yang ditawarkan platform (Mikro, Kecil, Menengah).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `name` | `text` | "Mikro" / "Kecil" / "Menengah" |
| `tier` | `enum('mikro','kecil','menengah')` | Dipakai untuk feature-gating (FR-11) |
| `price_monthly` | `numeric` | |
| `price_6_months` | `numeric` | |
| `price_yearly` | `numeric` | |
| `trial_days` | `int` | default 30 |
| `feature_flags` | `jsonb` | Daftar fitur yang di-unlock paket ini, dibaca saat feature-gating |
| `is_active` | `boolean` | Untuk soft-disable paket lama |

**RLS**: `SELECT` publik untuk semua baris `is_active = true` (ditampilkan di halaman pricing). `INSERT/UPDATE/DELETE` hanya `platform_admin`.

---

## 5. `addons` *(lanjutan — di luar MVP lomba, siapkan skema sejak awal agar extensible sesuai NFR-08)*

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `name` | `text` | Custom Domain / Laporan Lanjutan / Multi-Cabang / Promo & Voucher / Notifikasi WhatsApp |
| `price` | `numeric` | |
| `billing_cycle` | `enum('monthly','one_time')` | |

### `tenant_addons` (pivot, lanjutan)
| Kolom | Tipe |
|-------|------|
| `id` | `uuid` (PK) |
| `tenant_id` | `uuid` (FK) |
| `addon_id` | `uuid` (FK) |
| `status` | `enum('active','inactive')` |
| `activated_at` | `timestamptz` |

---

## 6. `transactions`
Transaksi pembayaran langganan paket via Midtrans (bukan transaksi pesanan pembeli — lihat `order` di bawah).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `tenant_id` | `uuid` (FK → `tenants.id`) | |
| `package_id` | `uuid` (FK → `packages.id`) | |
| `billing_cycle` | `enum('trial','monthly','6_months','yearly')` | |
| `amount` | `numeric` | |
| `midtrans_order_id` | `text`, unique | ID order yang dikirim ke Midtrans |
| `midtrans_transaction_id` | `text`, nullable | Diisi setelah ada respons/webhook |
| `status` | `enum('pending','settlement','capture','deny','cancel','expire','failure')` | Mengikuti status resmi Midtrans |
| `raw_notification` | `jsonb` | Simpan payload webhook mentah untuk audit/debug |
| `created_at` | `timestamptz` | |
| `settled_at` | `timestamptz`, nullable | Diisi saat validasi server berhasil (lihat `02_ARCHITECTURE.md` bag. 5) |

**RLS**: tenant hanya bisa `SELECT` transaksi miliknya. `INSERT` dilakukan via server (service role/Edge Function), bukan langsung dari client. `UPDATE` status hanya dari server handler webhook. `platform_admin` boleh `SELECT` semua.

---

## 7. `categories`
Kategori menu per tenant (mis. "Makanan Utama", "Minuman").

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `tenant_id` | `uuid` (FK) | |
| `name` | `text` | |
| `sort_order` | `int` | Urutan tampil |
| `created_at` | `timestamptz` | |

**RLS**: `SELECT` publik untuk kategori milik tenant `active`/`trial`. `INSERT/UPDATE/DELETE` hanya `owner_id` tenant tsb.

---

## 8. `menu_items`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `tenant_id` | `uuid` (FK) | |
| `category_id` | `uuid` (FK → `categories.id`) | |
| `name` | `text` | |
| `description` | `text` | |
| `price` | `numeric` | |
| `image_url` | `text` | Cloudinary, format WebP |
| `is_available` | `boolean` | Toggle ketersediaan real-time (FR-06, FR-07) |
| `sort_order` | `int` | |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS**: sama polanya dengan `categories` — publik `SELECT` jika tenant aktif, hanya owner yang bisa ubah.

---

## 9. `orders`
Pesanan dari Pembeli (alur sederhana — tanpa akun Pembeli di versi MVP, lihat `01_PRD.md` bag. 4.4).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `tenant_id` | `uuid` (FK) | |
| `order_code` | `text`, unique per tenant | Kode singkat untuk ditunjukkan ke pembeli, mis. `#A123` |
| `buyer_name` | `text` | Diisi manual oleh pembeli saat checkout |
| `buyer_contact` | `text`, nullable | No. HP/WA opsional, untuk pemilik menghubungi balik |
| `note` | `text`, nullable | Catatan pesanan |
| `status` | `enum('baru','diproses','selesai','dibatalkan')` | Sesuai FR-09 (status minimal: baru/diproses/selesai) |
| `total_amount` | `numeric` | |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS**:
- `INSERT` boleh dari anon/public **hanya** untuk tenant berstatus aktif (buyer tidak perlu login).
- `SELECT` untuk pembeli dibatasi ke pesanan dengan `order_code` yang mereka punya saja (mis. query by code, bukan listing bebas) — implementasikan lewat RPC function yang membatasi, bukan `SELECT *` bebas.
- Owner tenant (`auth.uid()` = `tenants.owner_id`) boleh `SELECT`/`UPDATE status` semua order miliknya.

---

## 10. `order_items`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `order_id` | `uuid` (FK → `orders.id`) | |
| `menu_item_id` | `uuid` (FK → `menu_items.id`) | |
| `menu_item_name_snapshot` | `text` | Simpan nama saat pesan dibuat (harga/nama menu bisa berubah setelahnya) |
| `price_snapshot` | `numeric` | Simpan harga saat pesan dibuat |
| `quantity` | `int` | |
| `subtotal` | `numeric` | |

> **Penting**: gunakan *snapshot* nama & harga di `order_items`, bukan join langsung ke `menu_items` saat tampil histori — agar riwayat pesanan tidak berubah kalau pemilik mengubah harga menu di kemudian hari.

**RLS**: mengikuti akses ke `orders` induknya (tidak ada akses langsung terpisah).

---

## 11. `staff_members` *(lanjutan — di luar MVP, siapkan skema untuk extensibility)*

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` (PK) | |
| `tenant_id` | `uuid` (FK) | |
| `user_id` | `uuid` (FK → `profiles.id`) | |
| `role` | `enum('staff','koki','pelayan','pengelola_stok')` | |
| `permissions` | `jsonb` | Hak akses granular |
| `invited_at` / `accepted_at` | `timestamptz` | |

---

## 12. Prinsip RLS Global (berlaku ke semua tabel ber-`tenant_id`)

```sql
-- Pola umum policy "owner only":
create policy "owner_full_access"
  on <table>
  for all
  using (
    tenant_id in (
      select id from tenants where owner_id = auth.uid()
    )
  );

-- Pola umum policy "public read, active tenant only":
create policy "public_read_active_tenant"
  on <table>
  for select
  using (
    tenant_id in (
      select id from tenants where status in ('active','trial')
    )
  );

-- Pola "platform admin full access":
create policy "platform_admin_full_access"
  on <table>
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'platform_admin'
    )
  );
```

> Terapkan kombinasi ketiga policy di atas (sesuai kebutuhan tiap tabel) secara konsisten — ini adalah mekanisme isolasi data antar-tenant yang disyaratkan NFR-02 di `01_PRD.md`.

---

## 13. Dokumen Terkait

- Requirement yang melatarbelakangi skema ini → `01_PRD.md`
- Penjelasan RLS & arsitektur multi-tenant → `02_ARCHITECTURE.md`
- Alur yang memakai tabel-tabel ini → `04_USER_FLOWS.md`
