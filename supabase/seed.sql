-- ==============================================================================
-- RESTOLINK - SEED DATA (DATA AWAL DATABASE & DEMO LOMBA GTNIC 2026)
-- ==============================================================================
-- Petunjuk Eksekusi:
-- 1. Pastikan migrasi skema tabel (001 s/d 008) sudah dijalankan.
-- 2. Jalankan query seed ini di Supabase SQL Editor atau via Supabase CLI:
--    supabase db reset
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. KATALOG PAKET LAYANAN (Tabel: packages)
-- ------------------------------------------------------------------------------
INSERT INTO public.packages (
  id,
  name,
  tier,
  price_monthly,
  price_6_months,
  price_yearly,
  trial_days,
  feature_flags,
  is_active
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'Mikro',
    'mikro',
    49000,
    269000,
    499000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": false, "table_management": false}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Kecil',
    'kecil',
    99000,
    549000,
    999000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": true, "promo": true}'::jsonb,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Menengah',
    'menengah',
    199000,
    1099000,
    1999000,
    30,
    '{"website": true, "menu_management": true, "basic_orders": true, "staff_accounts": true, "table_management": true, "kitchen_display": true, "inventory": true}'::jsonb,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  feature_flags = EXCLUDED.feature_flags,
  is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 2. AKUN PENGGUNA DEMO (auth.users & public.profiles)
-- ------------------------------------------------------------------------------
-- Akun 1: Platform Admin (admin@restolink.site / password123)
-- Akun 2: Tenant Owner (owner@dapur-nia.com / password123)
DO $$
DECLARE
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_owner_id uuid := 'b0000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert Platform Admin ke auth.users jika belum ada
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@restolink.site',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin RestoLink","phone":"081122334455"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Insert/Ensure Profile Admin
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (v_admin_id, 'Super Admin RestoLink', '081122334455', 'platform_admin')
  ON CONFLICT (id) DO UPDATE SET
    role = 'platform_admin',
    full_name = 'Super Admin RestoLink',
    phone = '081122334455';

  -- Insert Demo Tenant Owner ke auth.users jika belum ada
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_owner_id,
      'authenticated',
      'authenticated',
      'owner@dapur-nia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Ibu Nia Ramadhani","phone":"081234567890"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Insert/Ensure Profile Owner
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (v_owner_id, 'Ibu Nia Ramadhani', '081234567890', 'owner')
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    full_name = 'Ibu Nia Ramadhani',
    phone = '081234567890';
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. TENANT UTAMA DEMO (Tabel: tenants)
-- Usaha: Dapur Bu Nia (Subdomain: dapur-nia.restolink.site)
-- ------------------------------------------------------------------------------
INSERT INTO public.tenants (
  id,
  owner_id,
  business_name,
  subdomain,
  logo_url,
  description,
  contact_phone,
  contact_whatsapp,
  address,
  primary_color,
  status,
  current_package_id,
  trial_ends_at,
  subscription_ends_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Dapur Bu Nia',
  'dapur-nia',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
  'Spesialis masakan nusantara rumahan dengan bumbu rempah autentik warisan keluarga. Higienis, halal, dan lezat tanpa bahan pengawet.',
  '081234567890',
  '081234567890',
  'Jl. Margonda Raya No. 45, Beji, Kota Depok, Jawa Barat 16424',
  '#ea580c',
  'active',
  '00000000-0000-0000-0000-000000000001',
  NULL,
  now() + interval '30 days'
)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  subdomain = EXCLUDED.subdomain,
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  contact_phone = EXCLUDED.contact_phone,
  contact_whatsapp = EXCLUDED.contact_whatsapp,
  address = EXCLUDED.address,
  primary_color = EXCLUDED.primary_color,
  status = EXCLUDED.status,
  current_package_id = EXCLUDED.current_package_id,
  subscription_ends_at = EXCLUDED.subscription_ends_at;

-- ------------------------------------------------------------------------------
-- 4. KATEGORI MENU (Tabel: categories)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, tenant_id, name, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Makanan Utama', 1),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Camilan & Gorengan', 2),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Minuman Segar', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 5. DAFTAR MENU LENGKAP (Tabel: menu_items)
-- Foto kuliner resolusi tinggi via Unsplash CDN
-- ------------------------------------------------------------------------------
INSERT INTO public.menu_items (
  id,
  tenant_id,
  category_id,
  name,
  description,
  price,
  image_url,
  is_available,
  sort_order
) VALUES
  -- Kategori 1: Makanan Utama
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Nasi Bakar Cakalang Kemangi',
    'Nasi gurih berempah dibungkus daun pisang, diisi suwiran ikan cakalang asap rica dan wangi daun kemangi segar.',
    32000,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    true,
    1
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Ayam Bakar Madu Pedas Manis',
    'Paha/dada ayam pejantan empuk dengan marinasi madu hutan dan cabai rawit merah, dipanggang di atas arang kelapa.',
    28000,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
    true,
    2
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Bebek Goreng Serundeng Lengkuas',
    'Bebek muda gurih empuk tidak amis, bertabur serundeng lengkuas renyah disajikan bersama sambal korek khas Madura.',
    38000,
    'https://images.unsplash.com/photo-1514944298352-f472856f685c?auto=format&fit=crop&w=600&q=80',
    true,
    3
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Rawon Daging Sapi Khas Blitar',
    'Kuah hitam kluwek pekat dan harum rempah dengan potongan daging sapi sandung lamur empuk, taoge pendek, dan telur asin.',
    35000,
    'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=600&q=80',
    true,
    4
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Nasi Goreng Kampung Teri Medan',
    'Nasi goreng gaya rumahan dengan bumbu ulek terasi bakar, telur orak-arik, dan taburan renyah teri medan goreng.',
    25000,
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    true,
    5
  ),
  (
    'e0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Sop Iga Sapi Kuah Bening',
    'Iga sapi pilihan berkuah kaldu bening gurih segar kaya rempah pala dan cengkih, dilengkapi wortel dan kentang lembut.',
    45000,
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
    false, -- Menu dibuat tidak tersedia untuk demo visual stok habis
    6
  ),

  -- Kategori 2: Camilan & Gorengan
  (
    'e0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Tempe Mendoan Purwokerto (Isi 4)',
    'Tempe lembaran berbalut adonan tepung daun bawang renyah setengah matang, disajikan bersama cocolan kecap rawit pedas.',
    15000,
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    true,
    1
  ),
  (
    'e0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Tahu Bakso Goreng Khas Semarang',
    'Tahu pong isi adonan bakso sapi murni padat, digoreng garing di luar lembut kenyal di dalam.',
    18000,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    true,
    2
  ),
  (
    'e0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Pisang Goreng Wijen Madu',
    'Pisang raja manis balut adonan renyah bertabur biji wijen sangrai, disiram madu asli.',
    16000,
    'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=600&q=80',
    true,
    3
  ),

  -- Kategori 3: Minuman Segar
  (
    'e0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'Es Jeruk Kelapa Muda Murni',
    'Perasan jeruk pontianak manis segar berpadu kelapa muda kerok dan es kristal, pelepas dahaga sempurna.',
    12000,
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    true,
    1
  ),
  (
    'e0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'Es Teh Manis Melati Solo',
    'Seduhan teh melati wangi pekat khas Jawa Tengah, dingin menyegarkan dengan gula tebu asli.',
    6000,
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    true,
    2
  ),
  (
    'e0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'Kopi Susu Gula Aren Asli',
    'Espresso biji kopi robusta nusantara berpadu susu kental gurih dan manis lembut saus gula aren organik.',
    16000,
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    true,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available,
  sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 6. TRANSAKSI MIDTRANS LANGGANAN (Tabel: transactions)
-- ------------------------------------------------------------------------------
INSERT INTO public.transactions (
  id,
  tenant_id,
  package_id,
  billing_cycle,
  amount,
  midtrans_order_id,
  midtrans_transaction_id,
  status,
  settled_at,
  created_at
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'monthly',
  49000,
  'RESTOLINK-SUB-DEMO01',
  'trx-midtrans-sandbox-demo-01',
  'settlement',
  now() - interval '3 days',
  now() - interval '3 days'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  settled_at = EXCLUDED.settled_at;

-- ------------------------------------------------------------------------------
-- 7. PESANAN DEMO (Tabel: orders & order_items)
-- Menampilkan antrean lengkap di Dashboard Pemilik: baru, diproses, selesai, batal
-- ------------------------------------------------------------------------------

-- Order 1: Status Baru (Menunggu Dapur)
INSERT INTO public.orders (
  id,
  tenant_id,
  order_code,
  tracking_token,
  buyer_name,
  buyer_contact,
  note,
  status,
  total_amount,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  '#RL108',
  '11000000-0000-0000-0000-000000000001',
  'Budi Santoso',
  '081234567890',
  'Meja 04 • Sambal dipisah ya Bu, terima kasih',
  'baru',
  44000,
  now() - interval '10 minutes'
) ON CONFLICT (tenant_id, order_code) DO NOTHING;

INSERT INTO public.order_items (
  order_id,
  menu_item_id,
  menu_item_name_snapshot,
  price_snapshot,
  quantity
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Nasi Bakar Cakalang Kemangi', 32000, 1),
  ('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000011', 'Es Teh Manis Melati Solo', 6000, 2)
ON CONFLICT DO NOTHING;

-- Order 2: Status Diproses (Sedang Dimasak)
INSERT INTO public.orders (
  id,
  tenant_id,
  order_code,
  tracking_token,
  buyer_name,
  buyer_contact,
  note,
  status,
  total_amount,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  '#RL107',
  '11000000-0000-0000-0000-000000000002',
  'Siti Aisyah',
  '085712345678',
  'Takeaway • Bungkus daun pisang rapi',
  'diproses',
  56000,
  now() - interval '25 minutes'
) ON CONFLICT (tenant_id, order_code) DO NOTHING;

INSERT INTO public.order_items (
  order_id,
  menu_item_id,
  menu_item_name_snapshot,
  price_snapshot,
  quantity
) VALUES
  ('10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'Ayam Bakar Madu Pedas Manis', 28000, 2)
ON CONFLICT DO NOTHING;

-- Order 3: Status Selesai
INSERT INTO public.orders (
  id,
  tenant_id,
  order_code,
  tracking_token,
  buyer_name,
  buyer_contact,
  note,
  status,
  total_amount,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  '#RL106',
  '11000000-0000-0000-0000-000000000003',
  'Andi Pratama',
  '081987654321',
  'Makan di tempat meja 02',
  'selesai',
  70000,
  now() - interval '2 hours'
) ON CONFLICT (tenant_id, order_code) DO NOTHING;

INSERT INTO public.order_items (
  order_id,
  menu_item_id,
  menu_item_name_snapshot,
  price_snapshot,
  quantity
) VALUES
  ('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'Bebek Goreng Serundeng Lengkuas', 38000, 1),
  ('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000012', 'Kopi Susu Gula Aren Asli', 16000, 1),
  ('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000009', 'Pisang Goreng Wijen Madu', 16000, 1)
ON CONFLICT DO NOTHING;

-- Order 4: Status Dibatalkan
INSERT INTO public.orders (
  id,
  tenant_id,
  order_code,
  tracking_token,
  buyer_name,
  buyer_contact,
  note,
  status,
  total_amount,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  '#RL105',
  '11000000-0000-0000-0000-000000000004',
  'Fajar Hidayat',
  '081399887766',
  'Batal karena stok sop iga sedang habis',
  'dibatalkan',
  45000,
  now() - interval '5 hours'
) ON CONFLICT (tenant_id, order_code) DO NOTHING;

INSERT INTO public.order_items (
  order_id,
  menu_item_id,
  menu_item_name_snapshot,
  price_snapshot,
  quantity
) VALUES
  ('10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000006', 'Sop Iga Sapi Kuah Bening', 45000, 1)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. AUDIT LOG INITIAL PLATFORM (Tabel: admin_audit_logs)
-- ------------------------------------------------------------------------------
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  target_entity,
  target_id,
  details,
  created_at
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'seed_initialization',
    'tenants',
    'c0000000-0000-0000-0000-000000000001',
    '{"reason": "Inisialisasi tenant demo resmi juri GTNIC 2026: Dapur Bu Nia"}'::jsonb,
    now() - interval '3 days'
  )
ON CONFLICT DO NOTHING;
