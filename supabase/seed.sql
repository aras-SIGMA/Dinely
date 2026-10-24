-- ==============================================================================
-- RESTOLINK - SEED DATA (DATA AWAL DATABASE)
-- ==============================================================================
-- Petunjuk Eksekusi:
-- 1. Jalankan migrasi tabel terlebih dahulu (supabase/migrations/)
-- 2. Jalankan query seed ini di Supabase SQL Editor atau via Supabase CLI:
--    supabase db reset
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. KATALOG PAKET LAYANAN (Tabel: packages)
-- ------------------------------------------------------------------------------
-- Paket 'mikro' adalah satu-satunya paket aktif untuk MVP Lomba GTNIC 2026.
-- Paket 'kecil' dan 'menengah' disimpan untuk roadmap lanjutan (is_active = false).

INSERT INTO public.packages (
  id,
  name,
  tier,
  price_monthly,
  price_6_months,
  price_yearly,
  trial_days,
  feature_flags,
  is_active
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'Mikro',
    'mikro',
    49000,
    269000,
    499000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": false, "table_management": false}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Kecil',
    'kecil',
    99000,
    549000,
    999000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": true, "promo": true}'::jsonb,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Menengah',
    'menengah',
    199000,
    1099000,
    1999000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": true, "table_management": true, "kitchen_display": true, "inventory": true}'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. AKUN PLATFORM ADMIN PERDANA (Tabel: profiles)
-- ------------------------------------------------------------------------------
-- CATATAN PENGGUNA:
-- Untuk membuat akun admin platform:
-- 1. Daftarkan email & password baru via form registrasi aplikasi atau Supabase Auth Dashboard.
-- 2. Ambil UUID user tersebut dari tabel `auth.users`.
-- 3. Jalankan query UPDATE di bawah ini di SQL Editor Supabase untuk mengubah role-nya menjadi 'platform_admin':
--
-- UPDATE public.profiles
-- SET role = 'platform_admin'
-- WHERE id = '<UUID_USER_AUTH_ANDA>';
