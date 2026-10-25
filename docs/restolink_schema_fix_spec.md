# Instruksi Refactoring Skema Database & RLS — RestoLink (Supabase PostgreSQL)

Dokumen ini berisi spesifikasi teknis dan daftar periksa (*checklist*) perbaikan skema database, kebijakan Row Level Security (RLS), serta fungsi RPC PostgreSQL untuk **RestoLink**. Gunakan instruksi di bawah ini secara berurutan untuk memperbarui file migrasi SQL.

## 1. Perbaikan Kebijakan Row Level Security (RLS) & Hak Akses View

| Komponen | Masalah Saat Ini | Tindakan Perbaikan yang Wajib Dilakukan |
| :--- | :--- | :--- |
| **Tabel `tenants`** | Role `anon` memiliki akses `SELECT` langsung ke tabel `tenants`, sehingga membocorkan kolom sensitif (`owner_id`, `current_package_id`, `trial_ends_at`, `subscription_ends_at`). | Cabut policy `SELECT` untuk role `anon` pada tabel `tenants`. Batasi `SELECT` pada tabel `tenants` hanya untuk `owner` (`owner_id = (SELECT auth.uid())`) dan `platform_admin`. |
| **View `public_tenants`** | Publik membutuhkan akses baca ke profil toko tanpa membuka akses tabel utama. | Pastikan view `public_tenants` hanya menampilkan kolom publik (`id`, `business_name`, `subdomain`, `logo_url`, `description`, `contact_phone`, `contact_whatsapp`, `address`, `primary_color`, `status`) dengan filter `status IN ('active', 'trial')` dan masa aktif yang belum kedaluwarsa, lalu berikan `GRANT SELECT ON public.public_tenants TO anon, authenticated;`. |
| **Helper Functions RLS** | Fungsi `is_platform_admin()` dan `is_tenant_owner(tenant_id)` berisiko dieksekusi berulang kali per baris (*row-by-row*). | Deklarasikan kedua fungsi dengan atribut `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp`. Di dalam ekspresi `USING` / `WITH CHECK` pada RLS, selalu bungkus pemanggilan UID dengan `(SELECT auth.uid())` agar dievaluasi satu kali per query (*initPlan*). |

## 2. Pencegahan *Privilege Escalation* & *Mass Assignment* (Triggers)

1. **Trigger Proteksi Kolom Billing & Kepemilikan (`protect_tenant_billing_fields`)**:
   - Buat trigger `BEFORE UPDATE ON public.tenants`.
   - Izinkan perubahan penuh **hanya** jika `current_setting('request.jwt.claim.role', true) = 'service_role'` atau `public.is_platform_admin() = true`.
   - Jika dijalankan oleh `owner` biasa, blokir (`RAISE EXCEPTION`) apabila terjadi perubahan (`IS DISTINCT FROM`) pada kolom:
     - `owner_id`
     - `status`
     - `current_package_id`
     - `trial_ends_at`
     - `subscription_ends_at`
2. **Trigger Proteksi Kolom Pesanan (`protect_order_immutable_fields`)**:
   - Buat trigger `BEFORE UPDATE ON public.orders`.
   - Pastikan `owner` hanya dapat mengubah kolom `status` (dan `updated_at`).
   - Blokir perubahan pada `tenant_id`, `order_code`, `buyer_name`, `buyer_contact`, `note`, dan `total_amount` setelah pesanan dibuat.

## 3. Penguatan Constraint, Normalisasi, & Indexing

1. **Composite Foreign Key Lintas-Tenant (`menu_items` ke `categories`)**:
   - Tambahkan constraint unik komposit pada tabel `categories`:
     `ALTER TABLE public.categories ADD CONSTRAINT uq_categories_id_tenant UNIQUE (id, tenant_id);`
   - Ubah Foreign Key pada `menu_items` agar mengunci `category_id` sekaligus `tenant_id`:
     `FOREIGN KEY (category_id, tenant_id) REFERENCES public.categories (id, tenant_id) ON DELETE RESTRICT;`
2. **Validasi Subdomain Terlarang (*Reserved Subdomains*)**:
   - Tambahkan `CHECK constraint` pada `tenants.subdomain` untuk memblokir kata kunci sistem:
     `CHECK (subdomain NOT IN ('www', 'app', 'api', 'admin', 'auth', 'dashboard', 'cdn', 'mail', 'support', 'billing', 'static', 'status'))`
3. **Generated Column untuk `order_items.subtotal`**:
   - Tambahkan `CHECK (price_snapshot >= 0)` pada `order_items`.
   - Ubah kolom `subtotal` menjadi ` numeric GENERATED ALWAYS AS (price_snapshot * quantity) STORED` (atau pastikan dihitung murni di sisi server tanpa menerima input dari luar).
4. **Penambahan Indeks Kinerja (Foreign Keys & Query Path)**:
   - `CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);`
   - `CREATE INDEX IF NOT EXISTS idx_categories_tenant_sort ON public.categories(tenant_id, sort_order);`
   - `CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_avail ON public.menu_items(tenant_id, is_available, sort_order);`
   - `CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_created ON public.orders(tenant_id, status, created_at DESC);`
   - `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);`

## 4. Refactoring Stored Procedure RPC (`SECURITY DEFINER`)

### A. `create_guest_order(p_tenant_id, p_buyer_name, p_buyer_contact, p_note, p_items)`
1. **Keamanan Fungsi**: Wajib gunakan `SECURITY DEFINER` dan `SET search_path = public, pg_temp`.
2. **Validasi Input & Anti-DoS**:
   - Tolak jika `p_buyer_name` kosong atau panjangnya di luar rentang 2–100 karakter.
   - Tolak jika `p_items` bukan JSONB array, kosong (`jsonb_array_length = 0`), atau melebihi batas wajar (misal `jsonb_array_length(p_items) > 50`).
3. **Validasi Masa Aktif Tenant**:
   - Selain mengecek `status IN ('active', 'trial')`, pastikan `trial_ends_at > now()` (jika `trial`) atau `subscription_ends_at > now()` (jika `active`).
4. **Kalkulasi Set-Based & Deduplikasi Item**:
   - Jangan gunakan loop query satu per satu (`FOR ... LOOP` dengan `SELECT` di dalamnya).
   - Gunakan CTE / subquery dengan `jsonb_array_elements(p_items)` dan `GROUP BY (elem->>'menu_item_id')::uuid` serta `SUM((elem->>'quantity')::int)` untuk menggabungkan item menu yang duplikat di dalam payload JSONB.
   - Pastikan semua `quantity > 0` dan `quantity <= 1000`, serta jumlah item yang valid di tabel `menu_items` (milik `p_tenant_id` dan `is_available = true`) sama persis dengan jumlah item unik yang dikirim pembeli.
5. **Penanganan Race Condition `order_code`**:
   - Jangan gunakan `SELECT EXISTS` sebelum `INSERT` karena rentan tabrakan saat transaksi berjalan paralel (*TOCTOU race condition*).
   - Lakukan `INSERT INTO public.orders` di dalam blok `LOOP ... BEGIN ... EXCEPTION WHEN unique_violation THEN ... END;` dengan batas maksimal 5 kali percobaan (*retry*), atau tambahkan tanggal pembuatan pesanan pada constraint unik (`UNIQUE (tenant_id, created_date, order_code)`).
6. **Bulk Insert `order_items`**:
   - Masukkan seluruh rincian item sekaligus menggunakan `INSERT INTO public.order_items ... SELECT ...` dengan mengambil `name` dan `price` langsung dari tabel `menu_items`.

### B. `get_guest_order_status(p_tenant_id, p_order_code)`
1. **Keamanan Fungsi**: Wajib gunakan `SECURITY DEFINER` dan `SET search_path = public, pg_temp`.
2. **Perlindungan Data Pribadi (PII Masking)**:
   - Karena `p_order_code` (`#AB102`) pendek dan mudah ditebak (*enumerable*), jangan kembalikan kolom `buyer_contact` (nomor telepon/WA) secara utuh ke publik. Kembalikan hanya informasi status pesanan, daftar item, total harga, dan nama pemesan (atau lakukan *masking* pada nomor kontak).

## 5. Checklist Output yang Diharapkan dari Agent

Saat selesai melakukan perubahan pada skema SQL, pastikan output mencakup:
- [ ] Kode DDL lengkap untuk constraint baru, indeks, dan perubahan tabel.
- [ ] Kode lengkap fungsi helper RLS (`STABLE SECURITY DEFINER`) dan daftar `CREATE POLICY` terbaru.
- [ ] Kode lengkap trigger `protect_tenant_billing_fields` dan `protect_order_immutable_fields`.
- [ ] Kode lengkap RPC `create_guest_order` dan `get_guest_order_status` yang sudah di-refactor.
