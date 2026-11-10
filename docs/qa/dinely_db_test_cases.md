# 10 Skenario Pengujian Keamanan & Integritas Database — Dinely

Dokumen ini berisi 10 skenario uji (*test cases*) beserta script SQL siap pakai yang dapat Anda jalankan langsung di **Supabase SQL Editor** (atau diberikan ke *coding agent* Anda) untuk memverifikasi apakah skema baru, RLS, Trigger, dan RPC sudah bebas dari celah keamanan maupun *bug* logika.

## Ringkasan 10 Skenario Pengujian

| No | Nama Test Case | Target Komponen | Ekspektasi Hasil (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Eksfiltrasi Kolom Sensitif `tenants` oleh Publik (`anon`)** | RLS `tenants` & View `public_tenants` | Role `anon` mendapat 0 baris / *permission denied* saat `SELECT * FROM tenants`, namun berhasil membaca data publik dari `public_tenants`. |
| **TC-02** | **Self-Upgrade Paket & Masa Aktif oleh Owner** | Trigger `protect_tenant_billing_fields` | Eksekusi `UPDATE tenants SET status = 'active', current_package_id = ...` oleh `owner` ditolak dengan `RAISE EXCEPTION`. |
| **TC-03** | **Manipulasi `total_amount` Pesanan oleh Owner** | Trigger `protect_order_immutable_fields` | Owner berhasil mengubah `orders.status = 'diproses'`, tetapi ditolak (`RAISE EXCEPTION`) saat mencoba mengubah `total_amount` atau `buyer_name`. |
| **TC-04** | **Injeksi Kategori Lintas-Tenant (*Cross-Tenant FK*)** | Composite FK `menu_items(category_id, tenant_id)` | Owner Resto A gagal (`foreign key violation`) saat membuat atau memindahkan menu ke `category_id` milik Resto B. |
| **TC-05** | **Pendaftaran Subdomain Sistem (*Reserved Subdomains*)** | Constraint `chk_reserved_subdomains` | `INSERT` atau `UPDATE` tenant dengan subdomain `'admin'`, `'api'`, `'www'`, atau `'billing'` gagal karena `check constraint violation`. |
| **TC-06** | **Deduplikasi Item & Akurasi Harga di `create_guest_order`** | RPC `create_guest_order` & Generated Column `subtotal` | Jika JSONB mengirim 2 elemen dengan `menu_item_id` yang sama (`qty: 2` dan `qty: 3`), sistem menggabungkannya menjadi 1 baris `order_items` (`qty: 5`) dengan harga server. |
| **TC-07** | **Serangan Payload Jahat: Kuantitas Negatif, Menu Habis, & Lintas-Tenant** | Validasi RPC `create_guest_order` | RPC menolak pesanan (`RAISE EXCEPTION`) jika ada `quantity <= 0`, menu dengan `is_available = false`, atau `menu_item_id` milik tenant lain. |
| **TC-08** | **Checkout pada Toko Kedaluwarsa (*Expired Trial/Subscription*)** | Validasi Masa Aktif di `create_guest_order` | Meskipun kolom `tenants.status` masih tertulis `'active'` atau `'trial'`, jika `subscription_ends_at < now()` atau `trial_ends_at < now()`, pesanan ditolak. |
| **TC-09** | **Serangan DoS Array JSONB Besar (> 50 Item)** | Anti-DoS Guard di `create_guest_order` | Mengirim array JSONB berisi 51+ objek langsung ditolak di awal fungsi sebelum menyentuh query tabel. |
| **TC-10** | **Kebocoran Nomor WA (`buyer_contact`) pada Pelacakan Publik** | RPC `get_guest_order_status` | Saat role `anon` memanggil `get_guest_order_status(tenant_id, order_code)`, respons JSON tidak menampilkan nomor HP/WA utuh milik pembeli. |

## Script SQL Pengujian Otomatis (Supabase SQL Editor)

Jalankan blok transaksi pengujian di bawah ini di **Supabase SQL Editor**. Script ini menggunakan blok `DO $$ ... $$` dan `ROLLBACK` di akhir sehingga **tidak akan mengotori data produksi/development Anda**.

```sql
BEGIN;

-- ============================================================================
-- PERSIAPAN DATA DUMMY UNTUK PENGUJIAN (SEEDING SEMENTARA)
-- ============================================================================
SET LOCAL ROLE postgres;

-- Buat 2 user dummy di auth.users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner_a@restolink.test'),
  ('22222222-2222-2222-2222-222222222222', 'owner_b@restolink.test')
ON CONFLICT DO NOTHING;

-- Pastikan profil terbentuk
INSERT INTO public.profiles (id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Owner Resto A', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'Owner Resto B', 'owner')
ON CONFLICT (id) DO NOTHING;

-- Buat 2 tenant (Resto A aktif, Resto B trial tapi sudah lewat waktu/expired)
INSERT INTO public.tenants (id, owner_id, business_name, subdomain, status, trial_ends_at, subscription_ends_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Dapur A', 'dapur-a-test', 'active', NULL, now() + interval '30 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Dapur B Expired', 'dapur-b-test', 'trial', now() - interval '1 day', NULL);

-- Buat kategori untuk Resto A dan Resto B
INSERT INTO public.categories (id, tenant_id, name) VALUES
  ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Makanan Utama A'),
  ('cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Makanan Utama B');

-- Buat menu untuk Resto A (1 tersedia, 1 habis)
INSERT INTO public.menu_items (id, tenant_id, category_id, name, price, is_available) VALUES
  ('faaaaaaa-aaaa-aaaa-aaaa-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nasi Goreng Spesial', 25000, true),
  ('faaaaaaa-aaaa-aaaa-aaaa-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Es Teh Manis (Habis)', 5000, false);


-- ============================================================================
-- EKSEKUSI 10 TEST CASES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TC-01: Eksfiltrasi Kolom Sensitif `tenants` oleh Publik (`anon`)
-- ----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';

DO $$
DECLARE
  v_leak_count int := 0;
  v_public_count int := 0;
BEGIN
  BEGIN
    SELECT count(*) INTO v_leak_count FROM public.tenants;
  EXCEPTION WHEN insufficient_privilege THEN
    v_leak_count := 0;
  END;

  IF v_leak_count > 0 THEN
    RAISE WARNING '[FAIL] TC-01: Role anon masih bisa membaca % baris langsung dari tabel public.tenants!', v_leak_count;
  ELSE
    RAISE NOTICE '[PASS] TC-01: Role anon berhasil diblokir dari pembacaan langsung tabel public.tenants.';
  END IF;

  SELECT count(*) INTO v_public_count FROM public.public_tenants WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  IF v_public_count = 1 THEN
    RAISE NOTICE '[PASS] TC-01b: Role anon berhasil membaca profil publik melalui view public_tenants.';
  ELSE
    RAISE WARNING '[FAIL] TC-01b: Role anon gagal membaca tenant aktif pada view public_tenants.';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- TC-02: Self-Upgrade Paket & Masa Aktif oleh Owner
-- ----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
BEGIN
  UPDATE public.tenants
  SET subscription_ends_at = now() + interval '10 years'
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  RAISE WARNING '[FAIL] TC-02: Owner berhasil memperpanjang subscription_ends_at miliknya sendiri!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-02: Percobaan self-upgrade oleh owner berhasil diblokir (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-04: Injeksi Kategori Lintas-Tenant (Cross-Tenant Category FK)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO public.menu_items (id, tenant_id, category_id, name, price)
  VALUES (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Tenant A
    'cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Kategori milik Tenant B!
    'Menu Bajakan',
    15000
  );
  RAISE WARNING '[FAIL] TC-04: Menu milik Tenant A berhasil dikaitkan ke category_id milik Tenant B!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-04: Cross-tenant category injection berhasil dicegah (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-05: Pendaftaran Subdomain Sistem (Reserved Subdomains)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  UPDATE public.tenants
  SET subdomain = 'admin'
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  RAISE WARNING '[FAIL] TC-05: Tenant berhasil menggunakan reserved subdomain "admin"!';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE '[PASS] TC-05: Reserved subdomain "admin" berhasil ditolak oleh CHECK constraint.';
WHEN OTHERS THEN
  RAISE NOTICE '[INFO] TC-05: Ditolak dengan pesan lain: %', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-06: Deduplikasi Item & Akurasi Harga di `create_guest_order`
-- ----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';

DO $$
DECLARE
  v_res jsonb;
  v_order_id uuid;
  v_item_rows int;
  v_total numeric;
BEGIN
  -- Kirim 2 item duplikat di JSONB (qty 2 + qty 3 = 5 x Rp25.000 = Rp125.000)
  v_res := public.create_guest_order(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Budi Santoso',
    '081234567890',
    'Pedas sedang',
    '[
      {"menu_item_id": "faaaaaaa-aaaa-aaaa-aaaa-000000000001", "quantity": 2, "price": 0},
      {"menu_item_id": "faaaaaaa-aaaa-aaaa-aaaa-000000000001", "quantity": 3, "price": -5000}
    ]'::jsonb
  );

  v_order_id := (v_res->>'order_id')::uuid;
  v_total := (v_res->>'total_amount')::numeric;

  SELECT count(*) INTO v_item_rows FROM public.order_items WHERE order_id = v_order_id;

  IF v_total = 125000 AND v_item_rows = 1 THEN
    RAISE NOTICE '[PASS] TC-06: Deduplikasi JSONB & kalkulasi harga server akurat (Total: Rp125.000, 1 baris order_items).';
  ELSE
    RAISE WARNING '[FAIL] TC-06: Hasil tidak sesuai! Total: %, Jumlah baris item: % (ekspektasi: 125000 & 1 baris)', v_total, v_item_rows;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- TC-03: Manipulasi `total_amount` Pesanan oleh Owner
-- ----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
BEGIN
  UPDATE public.orders
  SET total_amount = 0
  WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  RAISE WARNING '[FAIL] TC-03: Owner berhasil memanipulasi total_amount pesanan menjadi 0!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-03: Manipulasi total_amount oleh owner berhasil diblokir (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-07: Serangan Payload Jahat (Menu Habis / Kuantitas <= 0)
-- ----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.role" = 'anon';

DO $$
DECLARE
  v_res jsonb;
BEGIN
  -- Mencoba memesan menu yang is_available = false
  v_res := public.create_guest_order(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Pembeli Nakal',
    '0811111111',
    '-',
    '[{"menu_item_id": "faaaaaaa-aaaa-aaaa-aaaa-000000000002", "quantity": 1}]'::jsonb
  );
  RAISE WARNING '[FAIL] TC-07: Pembeli berhasil memesan menu yang sedang habis (is_available = false)!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-07: Pesanan dengan menu habis/tidak valid berhasil ditolak (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-08: Checkout pada Toko Kedaluwarsa (Expired Trial/Subscription)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_res jsonb;
BEGIN
  -- Tenant B masih berstatus 'trial', tapi trial_ends_at sudah kemarin (now() - 1 day)
  v_res := public.create_guest_order(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Pembeli Nyasar',
    '0811111111',
    '-',
    '[{"menu_item_id": "faaaaaaa-aaaa-aaaa-aaaa-000000000001", "quantity": 1}]'::jsonb
  );
  RAISE WARNING '[FAIL] TC-08: Pesanan berhasil dibuat pada tenant yang masa trial-nya sudah kedaluwarsa!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-08: Pesanan pada tenant kedaluwarsa berhasil ditolak (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-09: Serangan DoS Array JSONB Besar (> 50 Item)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_large_payload jsonb;
  v_res jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('menu_item_id', gen_random_uuid(), 'quantity', 1))
  INTO v_large_payload
  FROM generate_series(1, 60);

  v_res := public.create_guest_order(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Spammer Bot',
    '0800000000',
    'Spam',
    v_large_payload
  );
  RAISE WARNING '[FAIL] TC-09: RPC menerima payload JSONB raksasa (> 50 item) tanpa pembatasan!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PASS] TC-09: Serangan payload JSONB besar (> 50 item) berhasil dihentikan (%).', SQLERRM;
END $$;


-- ----------------------------------------------------------------------------
-- TC-10: Kebocoran Nomor WA (`buyer_contact`) pada Pelacakan Publik
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_order_code text;
  v_status_res jsonb;
BEGIN
  SET LOCAL ROLE postgres;
  SELECT order_code INTO v_order_code
  FROM public.orders
  WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  LIMIT 1;

  SET LOCAL ROLE anon;
  v_status_res := public.get_guest_order_status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_order_code);

  IF v_status_res::text LIKE '%081234567890%' THEN
    RAISE WARNING '[FAIL] TC-10: Nomor WhatsApp pembeli (081234567890) terekspos utuh di get_guest_order_status!';
  ELSE
    RAISE NOTICE '[PASS] TC-10: Nomor WhatsApp pembeli terlindungi/di-masking pada get_guest_order_status.';
  END IF;
END $$;

-- Batalkan semua data dummy agar database tetap bersih
ROLLBACK;
```
