-- ==============================================================================
-- DINELY - 007_ORDER_SECURITY_HARDENING.SQL
-- 1. Proteksi State Machine DB (Kunci pesanan selesai/batal dari manipulasi)
-- 2. Anti-Spam Throttling & Anti-DoS Payload Cap pada create_guest_order
-- 3. Kolom tracking_token & Anti-Enumeration Scraping pada get_guest_order_status
-- ==============================================================================

-- 1. TAMBAH KOLOM TRACKING TOKEN (Kunci otorisasi pelacakan receipt)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders (tracking_token);

-- 2. HARDENING TRIGGER: STATE MACHINE TRANSITION & IMMUTABILITY
CREATE OR REPLACE FUNCTION public.protect_order_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Bypass untuk superadmin / service_role
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claim.role', true), ''),
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        ) = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  -- Proteksi data historis order
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR
     OLD.order_code IS DISTINCT FROM NEW.order_code OR
     OLD.tracking_token IS DISTINCT FROM NEW.tracking_token OR
     OLD.buyer_name IS DISTINCT FROM NEW.buyer_name OR
     OLD.buyer_contact IS DISTINCT FROM NEW.buyer_contact OR
     OLD.note IS DISTINCT FROM NEW.note OR
     OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    RAISE EXCEPTION 'Rincian pesanan bersifat permanen. Hanya status yang dapat diperbarui.';
  END IF;

  -- Kunci status terminal: pesanan selesai atau dibatalkan dilarang diubah kembali
  IF OLD.status IN ('selesai', 'dibatalkan') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Pesanan berstatus "%" bersifat final dan tidak dapat diubah kembali.', OLD.status;
  END IF;

  -- Validasi alur transisi sah
  IF OLD.status = 'baru' AND NEW.status NOT IN ('baru', 'diproses', 'dibatalkan') THEN
    RAISE EXCEPTION 'Transisi status dari "%" ke "%" tidak diizinkan.', OLD.status, NEW.status;
  END IF;

  IF OLD.status = 'diproses' AND NEW.status NOT IN ('diproses', 'selesai', 'dibatalkan') THEN
    RAISE EXCEPTION 'Transisi status dari "%" ke "%" tidak diizinkan.', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. HARDENING RPC: create_guest_order (THROTTLING, SIZE CAP, TRACKING TOKEN)
CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_tenant_id uuid,
  p_buyer_name text,
  p_buyer_contact text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_record record;
  v_total_amount numeric := 0;
  v_total_quantity integer := 0;
  v_order_id uuid;
  v_order_code text;
  v_tracking_token uuid := gen_random_uuid();
  v_item_count integer;
  v_unique_count integer := 0;
  v_matched_count integer := 0;
  v_has_invalid_qty boolean := false;
  v_inserted boolean := false;
  v_attempts integer := 0;
  v_recent_tenant_orders integer := 0;
  v_recent_contact_orders integer := 0;
  v_clean_contact text;
  v_clean_note text;
BEGIN
  -- Validasi panjang input (Anti-DoS Payload Bloat)
  IF length(trim(coalesce(p_buyer_name, ''))) < 2 OR length(trim(coalesce(p_buyer_name, ''))) > 100 THEN
    RAISE EXCEPTION 'Nama pemesan wajib diisi (antara 2 hingga 100 karakter).';
  END IF;

  v_clean_contact := nullif(trim(coalesce(p_buyer_contact, '')), '');
  IF v_clean_contact IS NOT NULL AND length(v_clean_contact) > 30 THEN
    RAISE EXCEPTION 'Nomor kontak pemesan maksimal 30 karakter.';
  END IF;

  v_clean_note := nullif(trim(coalesce(p_note, '')), '');
  IF v_clean_note IS NOT NULL AND length(v_clean_note) > 500 THEN
    RAISE EXCEPTION 'Catatan pesanan maksimal 500 karakter.';
  END IF;

  -- Anti-Spam Throttling: Maksimal 20 pesanan per menit per tenant
  SELECT count(*) INTO v_recent_tenant_orders
  FROM public.orders
  WHERE tenant_id = p_tenant_id AND created_at > (now() - interval '1 minute');

  IF v_recent_tenant_orders >= 20 THEN
    RAISE EXCEPTION 'Toko sedang menerima banyak pesanan. Silakan tunggu 1 menit lalu coba kembali.';
  END IF;

  -- Anti-Spam Throttling: Maksimal 3 pesanan baru per kontak dalam 10 menit
  IF v_clean_contact IS NOT NULL THEN
    SELECT count(*) INTO v_recent_contact_orders
    FROM public.orders
    WHERE tenant_id = p_tenant_id 
      AND buyer_contact = v_clean_contact 
      AND status = 'baru'
      AND created_at > (now() - interval '10 minutes');

    IF v_recent_contact_orders >= 3 THEN
      RAISE EXCEPTION 'Maksimal 3 pesanan aktif menunggu konfirmasi untuk nomor kontak ini.';
    END IF;
  END IF;

  -- Validasi array menu
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Format keranjang belanja tidak valid.';
  END IF;

  v_item_count := jsonb_array_length(p_items);
  IF v_item_count < 1 OR v_item_count > 50 THEN
    RAISE EXCEPTION 'Keranjang belanja harus berisi antara 1 hingga 50 menu.';
  END IF;

  -- Validasi tenant & status aktif
  SELECT id, business_name, status, trial_ends_at, subscription_ends_at 
  INTO v_tenant_record
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usaha kuliner tidak ditemukan.';
  END IF;

  IF v_tenant_record.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Usaha kuliner ini sedang tidak menerima pesanan.';
  END IF;

  IF v_tenant_record.status = 'trial' AND v_tenant_record.trial_ends_at IS NOT NULL AND v_tenant_record.trial_ends_at <= now() THEN
    RAISE EXCEPTION 'Masa uji coba usaha kuliner ini telah berakhir.';
  END IF;

  IF v_tenant_record.status = 'active' AND v_tenant_record.subscription_ends_at IS NOT NULL AND v_tenant_record.subscription_ends_at <= now() THEN
    RAISE EXCEPTION 'Masa aktif langganan usaha kuliner ini telah berakhir.';
  END IF;

  -- Validasi item & batas kuantitas 99
  WITH parsed_items AS (
    SELECT 
      (elem->>'menu_item_id')::uuid AS menu_item_id,
      SUM((elem->>'quantity')::int)::int AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    WHERE (elem->>'menu_item_id') IS NOT NULL
    GROUP BY (elem->>'menu_item_id')::uuid
  ),
  aggregated_check AS (
    SELECT 
      count(pi.menu_item_id) AS unique_count,
      count(m.id) AS matched_count,
      coalesce(sum(m.price * pi.quantity), 0) AS calculated_total,
      coalesce(sum(pi.quantity), 0)::int AS total_quantity,
      bool_or(pi.quantity < 1 OR pi.quantity > 99) AS has_invalid_qty
    FROM parsed_items pi
    LEFT JOIN public.menu_items m 
      ON m.id = pi.menu_item_id 
     AND m.tenant_id = p_tenant_id 
     AND m.is_available = true
  )
  SELECT unique_count, matched_count, calculated_total, total_quantity, coalesce(has_invalid_qty, false)
  INTO v_unique_count, v_matched_count, v_total_amount, v_total_quantity, v_has_invalid_qty
  FROM aggregated_check;

  IF v_unique_count = 0 THEN
    RAISE EXCEPTION 'Tidak ada item menu valid dalam keranjang belanja.';
  END IF;

  IF v_has_invalid_qty THEN
    RAISE EXCEPTION 'Jumlah pesanan per menu harus antara 1 hingga 99.';
  END IF;

  IF v_total_quantity > 99 THEN
    RAISE EXCEPTION 'Total kuantitas pesanan maksimal 99 item dalam sekali pemesanan.';
  END IF;

  IF v_matched_count < v_unique_count THEN
    RAISE EXCEPTION 'Satu atau lebih menu yang dipilih tidak ditemukan atau sedang habis.';
  END IF;

  -- Insert orders dengan tracking_token
  FOR v_attempts IN 1..5 LOOP
    v_order_code := '#' || 
      chr(65 + floor(random() * 26)::int) || 
      chr(65 + floor(random() * 26)::int) || 
      lpad(floor(random() * 1000)::text, 3, '0');

    BEGIN
      INSERT INTO public.orders (
        tenant_id,
        order_code,
        tracking_token,
        buyer_name,
        buyer_contact,
        note,
        status,
        total_amount
      ) VALUES (
        p_tenant_id,
        v_order_code,
        v_tracking_token,
        trim(p_buyer_name),
        v_clean_contact,
        v_clean_note,
        'baru',
        v_total_amount
      ) RETURNING id INTO v_order_id;

      v_inserted := true;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;

  IF NOT v_inserted THEN
    v_order_code := '#' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    INSERT INTO public.orders (
      tenant_id,
      order_code,
      tracking_token,
      buyer_name,
      buyer_contact,
      note,
      status,
      total_amount
    ) VALUES (
      p_tenant_id,
      v_order_code,
      v_tracking_token,
      trim(p_buyer_name),
      v_clean_contact,
      v_clean_note,
      'baru',
      v_total_amount
    ) RETURNING id INTO v_order_id;
  END IF;

  -- Insert rincian order_items
  INSERT INTO public.order_items (
    order_id,
    menu_item_id,
    menu_item_name_snapshot,
    price_snapshot,
    quantity
  )
  SELECT 
    v_order_id,
    m.id,
    m.name,
    m.price,
    pi.quantity
  FROM (
    SELECT 
      (elem->>'menu_item_id')::uuid AS menu_item_id,
      SUM((elem->>'quantity')::int)::int AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    WHERE (elem->>'menu_item_id') IS NOT NULL
    GROUP BY (elem->>'menu_item_id')::uuid
  ) pi
  JOIN public.menu_items m 
    ON m.id = pi.menu_item_id 
   AND m.tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'tracking_token', v_tracking_token,
    'total_amount', v_total_amount,
    'status', 'baru'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, jsonb) TO anon, authenticated, service_role;

-- 4. HARDENING RPC: get_guest_order_status (ANTI-ENUMERATION TOKEN CHECK)
DROP FUNCTION IF EXISTS public.get_guest_order_status(uuid, text);

CREATE OR REPLACE FUNCTION public.get_guest_order_status(
  p_tenant_id uuid,
  p_order_code text,
  p_tracking_token uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_items jsonb := '[]'::jsonb;
  v_masked_contact text := NULL;
  v_is_authorized boolean := false;
BEGIN
  SELECT id, order_code, tracking_token, buyer_name, buyer_contact, status, total_amount, note, created_at
  INTO v_order
  FROM public.orders
  WHERE tenant_id = p_tenant_id AND upper(order_code) = upper(trim(p_order_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
  END IF;

  -- Verifikasi token pembeli atau role pemilik/admin
  IF (p_tracking_token IS NOT NULL AND p_tracking_token = v_order.tracking_token)
     OR public.is_tenant_owner(p_tenant_id)
     OR public.is_platform_admin() THEN
    v_is_authorized := true;
  END IF;

  -- Jika token salah/tanpa token: sembunyikan semua PII (nama, telepon, catatan, rincian menu)
  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_code', v_order.order_code,
      'status', v_order.status,
      'total_amount', v_order.total_amount,
      'created_at', v_order.created_at,
      'is_masked_view', true
    );
  END IF;

  -- Masking kontak untuk pemegang token yang sah
  IF v_order.buyer_contact IS NOT NULL THEN
    IF length(v_order.buyer_contact) >= 7 THEN
      v_masked_contact := substring(v_order.buyer_contact from 1 for 4) || '****' || substring(v_order.buyer_contact from length(v_order.buyer_contact) - 2);
    ELSE
      v_masked_contact := '****';
    END IF;
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'name', menu_item_name_snapshot,
      'price', price_snapshot,
      'quantity', quantity,
      'subtotal', subtotal
    )
  ), '[]'::jsonb)
  INTO v_items
  FROM public.order_items
  WHERE order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'buyer_name', v_order.buyer_name,
    'buyer_contact_masked', v_masked_contact,
    'status', v_order.status,
    'total_amount', v_order.total_amount,
    'note', v_order.note,
    'created_at', v_order.created_at,
    'items', v_items,
    'is_masked_view', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_guest_order_status(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_status(uuid, text, uuid) TO anon, authenticated, service_role;
