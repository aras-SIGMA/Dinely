-- ==============================================================================
-- DINELY - 001_INITIAL_SCHEMA.SQL
-- DDL Tabel Utama, ENUMs, Relasi, Constraint, Index, dan Public View
-- ==============================================================================

-- 1. ENUM TYPES
CREATE TYPE public.user_role AS ENUM (
  'owner',
  'platform_admin'
);

CREATE TYPE public.tenant_status AS ENUM (
  'pending',
  'active',
  'trial',
  'suspended',
  'expired'
);

CREATE TYPE public.package_tier AS ENUM (
  'mikro',
  'kecil',
  'menengah'
);

CREATE TYPE public.order_status AS ENUM (
  'baru',
  'diproses',
  'selesai',
  'dibatalkan'
);

CREATE TYPE public.billing_cycle AS ENUM (
  'trial',
  'monthly',
  '6_months',
  'yearly'
);

CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'settlement',
  'capture',
  'deny',
  'cancel',
  'expire',
  'failure'
);

-- ------------------------------------------------------------------------------
-- 2. TABEL: profiles
-- Ekstensi profil dari auth.users Supabase
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role public.user_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. TABEL: packages
-- Katalog paket langganan (Mikro untuk MVP Lomba; Kecil & Menengah untuk lanjutan)
-- ------------------------------------------------------------------------------
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier public.package_tier NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_6_months numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  trial_days integer NOT NULL DEFAULT 30,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. TABEL: tenants
-- Usaha kuliner UMKM terdaftar (1 baris = 1 tenant/subdomain)
-- ------------------------------------------------------------------------------
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  subdomain text NOT NULL UNIQUE,
  logo_url text,
  description text,
  contact_phone text,
  contact_whatsapp text,
  address text,
  primary_color text NOT NULL DEFAULT '#ea580c',
  status public.tenant_status NOT NULL DEFAULT 'pending',
  current_package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Format subdomain: huruf kecil, angka, dan dash, 3-63 karakter, tidak diawali/diakhiri dash
  CONSTRAINT check_subdomain_format CHECK (
    subdomain ~ '^[a-z0-9-]+$' AND
    length(subdomain) >= 3 AND
    length(subdomain) <= 63 AND
    subdomain NOT LIKE '-%' AND
    subdomain NOT LIKE '%-'
  ),

  -- Blacklist subdomain terlarang (reserved subdomains)
  CONSTRAINT check_subdomain_reserved CHECK (
    subdomain NOT IN (
      'www', 'app', 'api', 'admin', 'auth', 'dashboard', 'cdn',
      'mail', 'support', 'billing', 'static', 'status', 'assets', 'docs'
    )
  )
);

-- ------------------------------------------------------------------------------
-- 5. TABEL: transactions
-- Pencatatan pembayaran paket langganan via Midtrans
-- ------------------------------------------------------------------------------
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  midtrans_order_id text NOT NULL UNIQUE,
  midtrans_transaction_id text,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  raw_notification jsonb,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. TABEL: categories
-- Kategori menu per tenant (misal: "Makanan Utama", "Minuman Segar")
-- ------------------------------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Composite unique agar bisa dijadikan referensi composite foreign key
  CONSTRAINT uq_categories_id_tenant UNIQUE (id, tenant_id)
);

-- ------------------------------------------------------------------------------
-- 7. TABEL: menu_items
-- Daftar produk kuliner per kategori
-- ------------------------------------------------------------------------------
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Kunci category_id dan tenant_id sekaligus agar menu tidak bisa salah tenant
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id, tenant_id)
    REFERENCES public.categories(id, tenant_id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 8. TABEL: orders
-- Pesanan pelanggan (Guest Checkout tanpa perlu registrasi akun)
-- ------------------------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_code text NOT NULL,
  tracking_token uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_name text NOT NULL,
  buyer_contact text,
  note text,
  status public.order_status NOT NULL DEFAULT 'baru',
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Kode pesanan unik per-tenant (misal: #AB123)
  CONSTRAINT uq_tenant_order_code UNIQUE (tenant_id, order_code)
);

-- ------------------------------------------------------------------------------
-- 9. TABEL: order_items
-- Rincian item pesanan dengan snapshot harga & nama menu saat dipesan.
-- subtotal adalah GENERATED ALWAYS AS (price_snapshot * quantity) STORED
-- ------------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name_snapshot text NOT NULL,
  price_snapshot numeric NOT NULL CHECK (price_snapshot >= 0),
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
  subtotal numeric GENERATED ALWAYS AS (price_snapshot * quantity) STORED
);

-- ------------------------------------------------------------------------------
-- 10. DATABASE VIEW: public_tenants
-- Hanya menampilkan kolom publik untuk tenant berstatus aktif/trial dan belum expired
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_tenants AS
SELECT 
  id,
  business_name,
  subdomain,
  logo_url,
  description,
  contact_phone,
  contact_whatsapp,
  address,
  primary_color,
  status
FROM public.tenants
WHERE (status = 'active' AND (subscription_ends_at IS NULL OR subscription_ends_at > now()))
   OR (status = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at > now()));

-- Berikan hak baca view ke role publik (anon) dan authenticated
GRANT SELECT ON public.public_tenants TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 11. INDEXES UNTUK PERFORMA
-- ------------------------------------------------------------------------------
CREATE INDEX idx_tenants_subdomain ON public.tenants (subdomain);
CREATE INDEX idx_tenants_owner_id ON public.tenants (owner_id);
CREATE INDEX idx_transactions_tenant ON public.transactions (tenant_id);
CREATE INDEX idx_transactions_midtrans_order ON public.transactions (midtrans_order_id);
CREATE INDEX idx_categories_tenant_sort ON public.categories (tenant_id, sort_order);
CREATE INDEX idx_menu_items_tenant_cat ON public.menu_items (tenant_id, category_id, sort_order);
CREATE INDEX idx_menu_items_tenant_avail ON public.menu_items (tenant_id, is_available, sort_order);
CREATE INDEX idx_orders_tenant_status_created ON public.orders (tenant_id, status, created_at DESC);
CREATE INDEX idx_orders_tracking_token ON public.orders (tracking_token);
CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
