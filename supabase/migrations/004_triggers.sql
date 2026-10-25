-- ==============================================================================
-- RESTOLINK - 004_TRIGGERS.SQL
-- Otomasi Database: Sinkronisasi Akun Auth, Proteksi Role, & Updated_At
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
SET search_path = public
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
SET search_path = public
AS $$
BEGIN
  -- Jika kolom role berubah
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Hanya izinkan jika user yang menjalankan adalah platform_admin atau service_role
    IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'Hak akses (role) hanya dapat diubah oleh Administrator Platform.';
    END IF;
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
-- 3. TRIGGER: set_updated_at
-- Otomatis memperbarui kolom updated_at saat data baris diubah
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
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
