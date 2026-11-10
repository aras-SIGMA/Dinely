-- ==============================================================================
-- DINELY - 005_SUBDOMAIN_RPC.SQL
-- RPC Pemeriksaan Ketersediaan Subdomain untuk Anon & Authenticated
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_subdomain_available(subdomain_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slug text;
BEGIN
  -- 1. Normalisasi: trim spasi dan ubah ke huruf kecil
  v_slug := lower(trim(coalesce(subdomain_input, '')));

  -- 2. Validasi panjang (3 - 63 karakter)
  IF length(v_slug) < 3 OR length(v_slug) > 63 THEN
    RETURN false;
  END IF;

  -- 3. Validasi format karakter: huruf kecil a-z, angka 0-9, dan dash (-)
  -- Tidak boleh diawali atau diakhiri dash
  IF v_slug !~ '^[a-z0-9-]+$' OR v_slug LIKE '-%' OR v_slug LIKE '%-' THEN
    RETURN false;
  END IF;

  -- 4. Validasi daftar reserved subdomains (sinkron 001_initial_schema.sql)
  IF v_slug IN (
    'www', 'app', 'api', 'admin', 'auth', 'dashboard', 'cdn',
    'mail', 'support', 'billing', 'static', 'status', 'assets', 'docs'
  ) THEN
    RETURN false;
  END IF;

  -- 5. Periksa apakah subdomain sudah terdaftar di tabel tenants (semua status)
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE subdomain = v_slug
  ) THEN
    RETURN false;
  END IF;

  -- Jika lolos semua validasi dan belum dipakai
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.is_subdomain_available(text) IS
  'Memeriksa ketersediaan subdomain tenant. Mengembalikan true jika valid, bukan reserved, dan belum dipakai.';

-- Berikan izin akses eksekusi kepada publik (anon), user login (authenticated), dan service role
GRANT EXECUTE ON FUNCTION public.is_subdomain_available(text) TO anon, authenticated, service_role;
