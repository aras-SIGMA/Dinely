-- ==============================================================================
-- RESTOLINK - 003_ORDER_RPC.SQL
-- Stored Procedure & RPC untuk Pemesanan Guest yang Aman
-- Menghitung total harga di server Postgres (mencegah manipulasi harga dari client)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI: create_guest_order
-- Menerima keranjang belanja dari pembeli tanpa akun, memverifikasi ketersediaan menu,
-- membaca harga asli dari database, membuat kode pesanan unik dengan retry anti-race,
-- dan menyimpan pesanan secara set-based bulk insert tanpa temp table.
-- ------------------------------------------------------------------------------
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
  v_order_id uuid;
  v_order_code text;
  v_item_count integer;
  v_unique_count integer := 0;
  v_matched_count integer := 0;
  v_has_invalid_qty boolean := false;
  v_inserted boolean := false;
  v_attempts integer := 0;
BEGIN
  -- 1. Validasi Input & Anti-DoS: Nama pembeli (2-100 karakter)
  IF length(trim(coalesce(p_buyer_name, ''))) < 2 OR length(trim(coalesce(p_buyer_name, ''))) > 100 THEN
    RAISE EXCEPTION 'Nama pemesan wajib diisi (antara 2 hingga 100 karakter).';
  END IF;

  -- 2. Validasi format p_items (harus array, 1-50 item)
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Format keranjang belanja tidak valid.';
  END IF;

  v_item_count := jsonb_array_length(p_items);
  IF v_item_count < 1 OR v_item_count > 50 THEN
    RAISE EXCEPTION 'Keranjang belanja harus berisi antara 1 hingga 50 menu.';
  END IF;

  -- 3. Validasi keberadaan & masa aktif tenant
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

  -- Periksa apakah masa trial atau langganan aktif sudah kedaluwarsa
  IF v_tenant_record.status = 'trial' AND v_tenant_record.trial_ends_at IS NOT NULL AND v_tenant_record.trial_ends_at <= now() THEN
    RAISE EXCEPTION 'Masa uji coba usaha kuliner ini telah berakhir.';
  END IF;

  IF v_tenant_record.status = 'active' AND v_tenant_record.subscription_ends_at IS NOT NULL AND v_tenant_record.subscription_ends_at <= now() THEN
    RAISE EXCEPTION 'Masa aktif langganan usaha kuliner ini telah berakhir.';
  END IF;

  -- 4. Parsing, agregasi (deduplikasi ID menu), validasi kuantitas, dan kalkulasi total harga via CTE murni
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
      bool_or(pi.quantity < 1 OR pi.quantity > 1000) AS has_invalid_qty
    FROM parsed_items pi
    LEFT JOIN public.menu_items m 
      ON m.id = pi.menu_item_id 
     AND m.tenant_id = p_tenant_id 
     AND m.is_available = true
  )
  SELECT unique_count, matched_count, calculated_total, coalesce(has_invalid_qty, false)
  INTO v_unique_count, v_matched_count, v_total_amount, v_has_invalid_qty
  FROM aggregated_check;

  IF v_unique_count = 0 THEN
    RAISE EXCEPTION 'Tidak ada item menu valid dalam keranjang belanja.';
  END IF;

  IF v_has_invalid_qty THEN
    RAISE EXCEPTION 'Jumlah pesanan per menu harus antara 1 hingga 1000.';
  END IF;

  IF v_matched_count < v_unique_count THEN
    RAISE EXCEPTION 'Satu atau lebih menu yang dipilih tidak ditemukan atau sedang habis.';
  END IF;

  -- 5. Insert ke tabel orders dengan penanganan race condition (unique_violation retry)
  FOR v_attempts IN 1..5 LOOP
    v_order_code := '#' || 
      chr(65 + floor(random() * 26)::int) || 
      chr(65 + floor(random() * 26)::int) || 
      lpad(floor(random() * 1000)::text, 3, '0');

    BEGIN
      INSERT INTO public.orders (
        tenant_id,
        order_code,
        buyer_name,
        buyer_contact,
        note,
        status,
        total_amount
      ) VALUES (
        p_tenant_id,
        v_order_code,
        trim(p_buyer_name),
        nullif(trim(coalesce(p_buyer_contact, '')), ''),
        nullif(trim(coalesce(p_note, '')), ''),
        'baru',
        v_total_amount
      ) RETURNING id INTO v_order_id;

      v_inserted := true;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Jika terjadi tabrakan kode pesanan acak, ulangi loop
      NULL;
    END;
  END LOOP;

  -- Fallback jika dalam 5 kali masih terjadi tabrakan kode
  IF NOT v_inserted THEN
    v_order_code := '#' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    INSERT INTO public.orders (
      tenant_id,
      order_code,
      buyer_name,
      buyer_contact,
      note,
      status,
      total_amount
    ) VALUES (
      p_tenant_id,
      v_order_code,
      trim(p_buyer_name),
      nullif(trim(coalesce(p_buyer_contact, '')), ''),
      nullif(trim(coalesce(p_note, '')), ''),
      'baru',
      v_total_amount
    ) RETURNING id INTO v_order_id;
  END IF;

  -- 6. Bulk insert rincian pesanan ke order_items (kolom subtotal GENERATED ALWAYS AS, tidak boleh dimasukkan)
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

  -- 7. Return response terstruktur
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total_amount', v_total_amount,
    'status', 'baru'
  );
END;
$$;

-- Hak akses eksplisit create_guest_order
REVOKE ALL ON FUNCTION public.create_guest_order(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, jsonb) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. FUNGSI: get_guest_order_status
-- Memungkinkan pembeli melihat status pesanannya menggunakan order_code
-- Dilengkapi perlindungan PII (masking nomor kontak pembeli)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_order_status(
  p_tenant_id uuid,
  p_order_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_items jsonb;
  v_masked_contact text := NULL;
BEGIN
  SELECT id, order_code, buyer_name, buyer_contact, status, total_amount, note, created_at
  INTO v_order
  FROM public.orders
  WHERE tenant_id = p_tenant_id AND upper(order_code) = upper(trim(p_order_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
  END IF;

  -- Masking nomor telepon pembeli jika ada (contoh: 0812****789)
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
    'items', v_items
  );
END;
$$;

-- Hak akses eksplisit get_guest_order_status
REVOKE ALL ON FUNCTION public.get_guest_order_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_status(uuid, text) TO anon, authenticated, service_role;
