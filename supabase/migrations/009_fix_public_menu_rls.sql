-- ==============================================================================
-- RESTOLINK - 009_FIX_PUBLIC_MENU_RLS.SQL
-- Perbaikan Akses RLS Publik (Anon) untuk Kategori dan Menu Restoran Aktif
-- ==============================================================================
-- Masalah sebelumnya: Policy SELECT pada categories dan menu_items melakukan subquery
-- langsung ke tabel `public.tenants` yang memiliki RLS terbatas untuk owner/admin.
-- Hal ini menyebabkan role `anon` selalu mendapatkan 0 baris saat membuka halaman resto.
-- Solusi: Menggunakan helper function SECURITY DEFINER `is_tenant_active(p_tenant_id)`
-- yang memverifikasi keaktifan tenant tanpa membocorkan data sensitif.
-- ==============================================================================

-- 1. Helper function untuk memeriksa apakah tenant berstatus aktif / trial yang valid
CREATE OR REPLACE FUNCTION public.is_tenant_active(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id
      AND (
        (status = 'active' AND (subscription_ends_at IS NULL OR subscription_ends_at > now())) OR
        (status = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at > now()))
      )
  );
$$;

-- Berikan izin eksekusi ke role anon dan authenticated
GRANT EXECUTE ON FUNCTION public.is_tenant_active(uuid) TO anon, authenticated;

-- 2. Perbarui policy SELECT pada categories
DROP POLICY IF EXISTS "categories_select_public_or_owner" ON public.categories;

CREATE POLICY "categories_select_public_or_owner"
  ON public.categories
  FOR SELECT
  USING (
    public.is_tenant_active(tenant_id) OR
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

-- 3. Perbarui policy SELECT pada menu_items
DROP POLICY IF EXISTS "menu_items_select_public_or_owner" ON public.menu_items;

CREATE POLICY "menu_items_select_public_or_owner"
  ON public.menu_items
  FOR SELECT
  USING (
    public.is_tenant_active(tenant_id) OR
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );
