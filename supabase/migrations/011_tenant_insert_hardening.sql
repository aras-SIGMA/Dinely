-- ==============================================================================
-- RESTOLINK - 011_TENANT_INSERT_HARDENING.SQL
-- Hardening Otorisasi INSERT Tenant & Sanitasi Input Metadata Registrasi
-- ==============================================================================
-- Masalah 1 (CRITICAL): Policy "tenants_insert_owner" (002_rls_policies.sql) hanya
-- memvalidasi owner_id = auth.uid() TANPA membatasi nilai kolom. Trigger
-- protect_tenant_billing_fields (004_triggers.sql) hanya terpasang BEFORE UPDATE,
-- sehingga owner terverifikasi dapat melakukan INSERT langsung dengan status='active'
-- dan subscription_ends_at jauh di masa depan -> bypass pembayaran (fraud).
--
-- Masalah 2 (LOW): Trigger handle_new_user() menyalin phone/full_name/business_name
-- dari raw_user_meta_data tanpa pembatasan panjang, membuka celah payload bloat.
--
-- Solusi:
--  1. Trigger BEFORE INSERT pada tenants yang memaksa status='pending' dan
--     mengosongkan kolom billing untuk pemanggil non-privileged.
--  2. Sanitasi panjang pada handle_new_user() (profiles & tenants).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDENING TRIGGER: Proteksi Kolom Billing saat INSERT Tenant
-- Bypass untuk service_role / platform_admin (webhook Midtrans & superadmin).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_tenant_insert_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Bypass untuk superadmin / service_role / platform_admin
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claim.role', true), ''),
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        ) = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  -- Pemanggil non-privileged: paksa status awal & netralkan kolom billing.
  NEW.status := 'pending';
  NEW.current_package_id := NULL;
  NEW.trial_ends_at := NULL;
  NEW.subscription_ends_at := NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_tenant_insert_billing ON public.tenants;

CREATE TRIGGER tr_protect_tenant_insert_billing
  BEFORE INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_tenant_insert_billing_fields();

-- ------------------------------------------------------------------------------
-- 2. HARDENING TRIGGER: handle_new_user() dengan Sanitasi Panjang Input
-- Menjaga atomik provisi profiles + tenants (dukungan alur Email OTP).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_subdomain text;
  v_business_name text;
  v_full_name text;
  v_phone text;
BEGIN
  -- Sanitasi panjang input dari metadata (anti payload bloat)
  v_full_name := substring(trim(coalesce(new.raw_user_meta_data->>'full_name', '')) from 1 for 100);
  v_phone := nullif(substring(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '[^0-9+]', '', 'g') from 1 for 20), '');

  -- 1. Buat profil owner akun
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role
  ) VALUES (
    new.id,
    v_full_name,
    v_phone,
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = coalesce(EXCLUDED.phone, public.profiles.phone);

  -- 2. Buat baris tenant pending jika metadata registrasi toko tersedia
  v_subdomain := lower(trim(coalesce(new.raw_user_meta_data->>'subdomain', '')));
  v_business_name := substring(trim(coalesce(new.raw_user_meta_data->>'business_name', '')) from 1 for 100);

  IF v_subdomain != '' AND v_business_name != '' THEN
    -- Validasi sintaks subdomain dasar sebelum insert untuk mencegah exception
    IF v_subdomain ~ '^[a-z0-9-]+$'
       AND length(v_subdomain) >= 3
       AND length(v_subdomain) <= 63
       AND v_subdomain NOT LIKE '-%'
       AND v_subdomain NOT LIKE '%-' THEN

      INSERT INTO public.tenants (
        owner_id,
        business_name,
        subdomain,
        status,
        primary_color
      ) VALUES (
        new.id,
        v_business_name,
        v_subdomain,
        'pending',
        '#ea580c'
      )
      ON CONFLICT (subdomain) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- Pastikan trigger on_auth_user_created tetap terpasang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
