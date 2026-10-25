-- ==============================================================================
-- RESTOLINK - 003_ORDER_RPC.SQL
-- Stored Procedure & RPC untuk Pemesanan Guest yang Aman
-- Menghitung total harga di server Postgres (mencegah manipulasi harga dari client)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI: create_guest_order
-- Menerima keranjang belanja dari pembeli tanpa akun, memverifikasi ketersediaan menu,
-- membaca harga asli dari database, membuat kode pesanan unik, dan menyimpan order.
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
SET search_path = public
AS $$
DECLARE
  v_tenant_record record;
  v_item record;
  v_menu_record record;
  v_total_amount numeric := 0;
  v_item_subtotal numeric := 0;
  v_order_id uuid;
  v_order_code text;
  v_code_exists boolean;
  v_attempts integer := 0;
  v_item_count integer;
  v_quantity integer;
  v_menu_id uuid;
BEGIN
  -- 1. Validasi keberadaan & status aktif tenant
  SELECT id, business_name, status INTO v_tenant_record
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usaha kuliner tidak ditemukan.';
  END IF;

  IF v_tenant_record.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Usaha kuliner ini sedang tidak menerima pesanan.';
  END IF;

  -- 2. Validasi data pembeli
  IF trim(coalesce(p_buyer_name, '')) = '' THEN
    RAISE EXCEPTION 'Nama pemesan wajib diisi.';
  END IF;

  -- 3. Validasi daftar item keranjang
  v_item_count := jsonb_array_length(p_items);
  IF v_item_count IS NULL OR v_item_count = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja tidak boleh kosong.';
  END IF;

  -- 4. Generate kode pesanan acak yang unik per tenant (Contoh: #AB102)
  LOOP
    v_attempts := v_attempts + 1;
    v_order_code := '#' || 
      chr(65 + floor(random() * 26)::int) || 
      chr(65 + floor(random() * 26)::int) || 
      lpad(floor(random() * 1000)::text, 3, '0');

    SELECT EXISTS (
      SELECT 1 FROM public.orders 
      WHERE tenant_id = p_tenant_id AND order_code = v_order_code
    ) INTO v_code_exists;

    IF NOT v_code_exists THEN
      EXIT;
    END IF;

    IF v_attempts > 50 THEN
      -- Fallback jika terjadi tabrakan kode yang sangat jarang
      v_order_code := '#' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
      EXIT;
    END IF;
  END LOOP;

  -- 5. Buat baris pesanan induk di tabel orders (status awal: 'baru')
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
    0
  ) RETURNING id INTO v_order_id;

  -- 6. Loop dan validasi tiap item menu langsung dari tabel menu_items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id uuid, quantity int)
  LOOP
    v_menu_id := v_item.menu_item_id;
    v_quantity := coalesce(v_item.quantity, 0);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Jumlah pesanan harus lebih besar dari 0.';
    END IF;

    -- Ambil data menu terverifikasi dari DB
    SELECT id, name, price, is_available INTO v_menu_record
    FROM public.menu_items
    WHERE id = v_menu_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu dengan ID % tidak ditemukan pada usaha ini.', v_menu_id;
    END IF;

    IF NOT v_menu_record.is_available THEN
      RAISE EXCEPTION 'Menu "%" saat ini sedang habis.', v_menu_record.name;
    END IF;

    -- Hitung subtotal berdasarkan harga asli database
    v_item_subtotal := v_menu_record.price * v_quantity;
    v_total_amount := v_total_amount + v_item_subtotal;

    -- Simpan snapshot nama & harga saat ini ke order_items
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      menu_item_name_snapshot,
      price_snapshot,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_menu_record.id,
      v_menu_record.name,
      v_menu_record.price,
      v_quantity,
      v_item_subtotal
    );
  END LOOP;

  -- 7. Update total_amount akhir pada pesanan induk
  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  -- 8. Return response sukses ke client
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total_amount', v_total_amount,
    'status', 'baru'
  );
END;
$$;

-- Berikan izin akses RPC create_guest_order ke anon (pembeli umum)
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, jsonb) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. FUNGSI: get_guest_order_status
-- Memungkinkan pembeli melihat status pesanannya menggunakan order_code
-- tanpa perlu login / registrasi akun
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_order_status(
  p_tenant_id uuid,
  p_order_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_items jsonb;
BEGIN
  SELECT id, order_code, buyer_name, status, total_amount, note, created_at
  INTO v_order
  FROM public.orders
  WHERE tenant_id = p_tenant_id AND upper(order_code) = upper(trim(p_order_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
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
    'status', v_order.status,
    'total_amount', v_order.total_amount,
    'note', v_order.note,
    'created_at', v_order.created_at,
    'items', v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_order_status(uuid, text) TO anon, authenticated, service_role;
