-- ==============================================================================
-- DINELY - 010_TENANT_ON_SIGNUP_TRIGGER.SQL
-- Otomasi Pembuatan Tenant Saat Registrasi Akun Auth (Dukungan Email OTP)
-- ==============================================================================
-- Masalah sebelumnya: Saat email confirmation aktif di Supabase, auth.signUp()
-- mengembalikan session = null. Logika pembuatan baris tenant di client-side
-- terlewati sehingga user terverifikasi tidak memiliki baris tenant.
-- Solusi: Trigger handle_new_user() diperbarui agar secara atomik membuat
-- baris profiles dan tenants (status 'pending') dari raw_user_meta_data.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_subdomain text;
  v_business_name text;
BEGIN
  -- 1. Buat profil owner akun
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = coalesce(EXCLUDED.phone, public.profiles.phone);

  -- 2. Buat baris tenant pending jika metadata registrasi toko tersedia
  v_subdomain := lower(trim(coalesce(new.raw_user_meta_data->>'subdomain', '')));
  v_business_name := trim(coalesce(new.raw_user_meta_data->>'business_name', ''));

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

-- Pastikan trigger on_auth_user_created terpasang pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
