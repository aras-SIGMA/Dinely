-- ==============================================================================
-- RESTOLINK - 004_TRIGGERS.SQL
-- Otomasi Database: Sinkronisasi Akun Auth, Proteksi Role, Billing, & Updated_At
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TRIGGER: on_auth_user_created
-- Otomatis membuat baris di public.profiles saat user mendaftar di Supabase Auth
-- Default role selalu 'owner' (mencegah eskalasi role dari form pendaftaran)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
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
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. TRIGGER: protect_profile_role
-- Mencegah user biasa mengubah kolom role miliknya sendiri menjadi platform_admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Bypass untuk superadmin/service_role/postgres
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claim.role', true), ''),
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        ) = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  -- Jika kolom role diubah oleh user biasa
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Hak akses (role) hanya dapat diubah oleh Administrator Platform.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;

CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- 3. TRIGGER: protect_tenant_billing_fields
-- Mencegah owner resto melakukan mass-assignment pada status, paket, dan kepemilikan
-- Kolom-kolom ini HANYA dapat diubah oleh service_role (webhook Midtrans) atau platform_admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_tenant_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Bypass untuk superadmin/service_role/postgres
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claim.role', true), ''),
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        ) = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  -- Jika dijalankan oleh owner biasa, blokir perubahan kolom sensitif
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id OR
     OLD.status IS DISTINCT FROM NEW.status OR
     OLD.current_package_id IS DISTINCT FROM NEW.current_package_id OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at OR
     OLD.subscription_ends_at IS DISTINCT FROM NEW.subscription_ends_at THEN
    RAISE EXCEPTION 'Kolom status, paket langganan, dan kepemilikan tenant hanya dapat diubah oleh sistem pembayaran atau Administrator Platform.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_tenant_billing ON public.tenants;

CREATE TRIGGER tr_protect_tenant_billing
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_tenant_billing_fields();

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: protect_order_immutable_fields
-- Mencegah perubahan data historis pesanan (nama, total amount, item, kode pesanan).
-- Pemilik hanya diizinkan memperbarui kolom status dan updated_at.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_order_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Bypass untuk superadmin/service_role/postgres
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claim.role', true), ''),
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        ) = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  -- Jika dijalankan oleh owner biasa, rincian pesanan bersifat permanen
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR
     OLD.order_code IS DISTINCT FROM NEW.order_code OR
     OLD.buyer_name IS DISTINCT FROM NEW.buyer_name OR
     OLD.buyer_contact IS DISTINCT FROM NEW.buyer_contact OR
     OLD.note IS DISTINCT FROM NEW.note OR
     OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    RAISE EXCEPTION 'Rincian pesanan bersifat permanen. Hanya status pesanan yang dapat diperbarui.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_order_immutable ON public.orders;

CREATE TRIGGER tr_protect_order_immutable
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_immutable_fields();

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: set_updated_at
-- Otomatis memperbarui kolom updated_at saat data baris diubah
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_tenants_updated_at ON public.tenants;
CREATE TRIGGER tr_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER tr_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
