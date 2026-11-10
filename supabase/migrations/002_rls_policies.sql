-- ==============================================================================
-- DINELY - 002_RLS_POLICIES.SQL
-- Keamanan & Isolasi Data Multi-Tenant via Supabase Row Level Security (RLS)
-- ==============================================================================

-- 1. AKTIFKAN RLS PADA SELURUH TABEL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS UNTUK EVALUASI RLS
-- Atribut: STABLE SECURITY DEFINER SET search_path = public, pg_temp
-- Menggunakan (SELECT auth.uid()) untuk evaluasi initPlan 1x per query
-- ------------------------------------------------------------------------------

-- Memeriksa apakah user saat ini memiliki role 'platform_admin'
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'platform_admin'
  );
$$;

-- Memeriksa apakah user saat ini adalah pemilik dari tenant yang ditentukan
CREATE OR REPLACE FUNCTION public.is_tenant_owner(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND owner_id = (SELECT auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_owner(uuid) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. POLICIES: profiles
-- User hanya bisa melihat & mengedit profil miliknya sendiri
-- Admin platform bisa membaca seluruh profil
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  USING (
    id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  );

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  )
  WITH CHECK (
    id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  );

-- ------------------------------------------------------------------------------
-- 4. POLICIES: packages
-- Publik dapat melihat paket yang aktif (is_active = true)
-- Admin platform memiliki akses penuh kelola paket
-- ------------------------------------------------------------------------------
CREATE POLICY "packages_select_public"
  ON public.packages
  FOR SELECT
  USING (
    is_active = true OR
    public.is_platform_admin()
  );

CREATE POLICY "packages_modify_admin"
  ON public.packages
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 5. POLICIES: tenants
-- PENTING: Role anon TIDAK memiliki akses langsung ke tabel tenants!
-- Publik WAJIB mengakses profil tenant melalui view `public_tenants`.
-- Tabel tenants hanya bisa diakses oleh pemiliknya (owner) dan platform_admin.
-- ------------------------------------------------------------------------------
CREATE POLICY "tenants_select_owner_or_admin"
  ON public.tenants
  FOR SELECT
  USING (
    owner_id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  );

CREATE POLICY "tenants_insert_owner"
  ON public.tenants
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    owner_id = (SELECT auth.uid())
  );

CREATE POLICY "tenants_update_owner_or_admin"
  ON public.tenants
  FOR UPDATE
  USING (
    owner_id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    public.is_platform_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. POLICIES: transactions
-- Pemilik hanya bisa melihat riwayat transaksi tenant miliknya
-- Admin platform bisa melihat seluruh transaksi
-- Modifikasi transaksi HANYA dilakukan via backend service_role key
-- ------------------------------------------------------------------------------
CREATE POLICY "transactions_select_owner_or_admin"
  ON public.transactions
  FOR SELECT
  USING (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "transactions_admin_modify"
  ON public.transactions
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 7. POLICIES: categories
-- Publik bisa melihat kategori milik tenant yang aktif / trial
-- Pemilik memiliki akses penuh CRUD kategori miliknya sendiri
-- ------------------------------------------------------------------------------
CREATE POLICY "categories_select_public_or_owner"
  ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = categories.tenant_id AND status IN ('active', 'trial')
    ) OR
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "categories_owner_full_access"
  ON public.categories
  FOR ALL
  USING (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

-- ------------------------------------------------------------------------------
-- 8. POLICIES: menu_items
-- Publik bisa melihat menu milik tenant yang aktif / trial
-- Pemilik memiliki akses penuh CRUD menu usahanya sendiri
-- ------------------------------------------------------------------------------
CREATE POLICY "menu_items_select_public_or_owner"
  ON public.menu_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = menu_items.tenant_id AND status IN ('active', 'trial')
    ) OR
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "menu_items_owner_full_access"
  ON public.menu_items
  FOR ALL
  USING (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

-- ------------------------------------------------------------------------------
-- 9. POLICIES: orders & order_items
-- Direct INSERT dari anon diblokir demi keamanan (pembuatan order wajib via RPC).
-- Pemilik tenant dan admin platform dapat melihat & memperbarui status pesanan.
-- ------------------------------------------------------------------------------
CREATE POLICY "orders_select_owner_or_admin"
  ON public.orders
  FOR SELECT
  USING (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "orders_update_owner_or_admin"
  ON public.orders
  FOR UPDATE
  USING (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_tenant_owner(tenant_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "order_items_select_owner_or_admin"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND (
        public.is_tenant_owner(orders.tenant_id) OR
        public.is_platform_admin()
      )
    )
  );
