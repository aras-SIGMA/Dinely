# Laporan Perbaikan Keamanan: Hardening INSERT Tenant & Sanitasi Input Registrasi

**Tanggal:** 2026-11-09
**Branch:** `feature/ui-ux-enhancements`
**Kategori:** Security & Hardening (OWASP A01 Broken Access Control, A04 Insecure Design)
**Severity:** 1 Critical, 1 Low
**Status:** Selesai — verified (`npm run check` 0 error, `npm run test:api` 86/86 pass)

---

## 1. Ringkasan Eksekutif

Audit keamanan terhadap kode alur registrasi + Email OTP yang baru ditambahkan menemukan satu kelemahan kritis berupa **billing bypass** (eskalasi hak istimewa / fraud) dan satu kelemahan rendah berupa **input bloat** pada metadata registrasi. Keduanya telah diperbaiki di level database (defense utama) dan dilapisi validasi di level klien (defense-in-depth).

---

## 2. Metodologi

Dilakukan threat modeling (STRIDE) terhadap trust boundary baru: `supabase.auth.signUp()` → `raw_user_meta_data` → trigger `handle_new_user()` → tabel `profiles` & `tenants`.

Tahapan:
1. Memetakan trust boundary: form registrasi → Supabase Auth → metadata → DB trigger → RLS.
2. Menginventarisasi aset: status langganan tenant, `subscription_ends_at`, `trial_ends_at`, `current_package_id` (aset komersial).
3. Menjalankan STRIDE tiap boundary.
4. Memverifikasi implementasi aktual pada file migrasi `001`–`010` dan store frontend.

---

## 3. Temuan Masalah

### 3.1 CRITICAL — Billing Bypass via Direct INSERT Tenant

**Lokasi:**
- `supabase/migrations/002_rls_policies.sql:111-117` — policy `tenants_insert_owner`
- `supabase/migrations/004_triggers.sql:116-119` — trigger `tr_protect_tenant_billing` (hanya `BEFORE UPDATE`)

**Bagaimana masalah bisa terjadi:**

Policy RLS untuk INSERT tenant hanya memvalidasi kepemilikan baris:

```sql
CREATE POLICY "tenants_insert_owner"
  ON public.tenants
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    owner_id = (SELECT auth.uid())
  );
```

Policy ini **tidak membatasi nilai kolom** apa pun. Sementara proteksi kolom sensitif (`status`, `current_package_id`, `trial_ends_at`, `subscription_ends_at`) hanya dipasang sebagai trigger `BEFORE UPDATE`, bukan `BEFORE INSERT`.

Akibatnya, setiap pengguna yang sudah terverifikasi (punya `auth.uid()`) dapat langsung memanggil dari browser:

```js
supabase.from('tenants').insert({
  owner_id: myId,
  business_name: 'x',
  subdomain: 'x',
  status: 'active',
  subscription_ends_at: '2099-01-01T00:00:00Z'
});
```

→ Tenant langsung berstatus `active` dengan masa langganan abadi **tanpa melakukan pembayaran**. Ini adalah elevation of privilege + potensi kerugian finansial (fraud). Jalur ini persis beririsan dengan logika provisi tenant yang disentuh alur OTP baru (`ensureTenantExists` di `src/stores/auth.svelte.ts:156-166`, dan trigger `010`).

**Dampak:** Kerugian pendapatan langsung; bypass seluruh model monetisasi.

---

### 3.2 LOW — Input Bloat pada Metadata Registrasi

**Lokasi:** `supabase/migrations/010_tenant_on_signup_trigger.sql:26-40` dan `004_triggers.sql:21-29`

**Bagaimana masalah bisa terjadi:**

Trigger `handle_new_user()` menyalin `phone`, `full_name`, dan `business_name` dari `raw_user_meta_data` tanpa pembatasan panjang:

```sql
coalesce(new.raw_user_meta_data->>'full_name', ''),
new.raw_user_meta_data->>'phone',
```

`raw_user_meta_data` sepenuhnya dikontrol klien dan tak dibatasi panjangnya. Penyerang dapat mengirim string raksasa (mis. ratusan KB per request) untuk menumpuk penyimpanan atau membebani serialisasi DB (denial of service ringan).

Validasi hanya ada di klien (`Register.svelte`), yang **bukan** batas keamanan (client-side validation dapat dilewati).

**Dampak:** Penyalahgunaan penyimpanan / beban DB ringan. Bukan eskalasi.

---

## 4. Cara Perbaikan

### 4.1 Fix Critical — Trigger `BEFORE INSERT` pada `tenants`

File baru: `supabase/migrations/011_tenant_insert_hardening.sql`

Menambahkan fungsi + trigger `BEFORE INSERT` yang memaksa nilai aman untuk pemanggil non-privileged:

```sql
CREATE OR REPLACE FUNCTION public.protect_tenant_insert_billing_fields()
RETURNS trigger ... AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role')
     OR ... = 'service_role'
     OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  NEW.status := 'pending';
  NEW.current_package_id := NULL;
  NEW.trial_ends_at := NULL;
  NEW.subscription_ends_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_protect_tenant_insert_billing ON public.tenants
  BEFORE INSERT FOR EACH ROW
  EXECUTE FUNCTION public.protect_tenant_insert_billing_fields();
```

Bypass untuk `service_role` (webhook Midtrans) dan `platform_admin` (superadmin) dipertahankan agar aktivasi langganan tetap berfungsi.

### 4.2 Fix Low — Sanitasi Panjang pada `handle_new_user()`

Masih di `011`, fungsi `handle_new_user()` diperbarui dengan pembatasan panjang:

```sql
v_full_name := substring(trim(coalesce(new.raw_user_meta_data->>'full_name','')) from 1 for 100);
v_phone := nullif(substring(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[^0-9+]','','g') from 1 for 20), '');
v_business_name := substring(trim(coalesce(new.raw_user_meta_data->>'business_name','')) from 1 for 100);
```

Sanitasi juga membersihkan karakter non-numerik dari `phone`.

### 4.3 Fix Defense-in-Depth — Layer Klien

- `src/stores/auth.svelte.ts` (`signUp`): validasi panjang `fullName` (≤100), `phone` (≤20), `businessName` (≤100) sebelum request.
- `src/apps/landing/routes/Register.svelte`: atribut `maxlength` pada input `fullName` (100), `phone` (20), `businessName` (100).

---

## 5. File yang Diubah

| File | Aksi | Ringkasan |
|---|---|---|
| `supabase/migrations/011_tenant_insert_hardening.sql` | **Baru** | Trigger `BEFORE INSERT` tenants + sanitasi `handle_new_user()` |
| `src/stores/auth.svelte.ts` | Edit | Validasi panjang input pada `signUp` |
| `src/apps/landing/routes/Register.svelte` | Edit | `maxlength` pada input form registrasi |
| `docs/reports/laporan_perbaikan_keamanan_tenant_insert.md` | **Baru** | Laporan ini |

### File yang Berpotensi Terpengaruh (Verifikasi Regresi)

| File | Keterkaitan | Status |
|---|---|---|
| `api/midtrans/webhook.ts` | Mengubah `status`/`subscription_ends_at` tenant | Aman — bypass `service_role` |
| `src/stores/admin.svelte.ts`, `src/apps/admin/routes/Tenants.svelte` | Superadmin override status/expiry | Aman — bypass `is_platform_admin()` |
| `src/apps/landing/routes/Register.svelte` | Alur OTP memicu `handle_new_user()` | Aman — tetap `ON CONFLICT DO NOTHING` |
| `api/_test_be01..05.ts` | Suite API backend | 86/86 pass |

---

## 6. Hasil Akhir

- `npm run check`: **0 error, 0 warning**
- `npm run test:api`: **86 Passed, 0 Failed** (BE-01: 21, BE-02: 22, BE-03: 20, BE-04: 15, BE-05: 8)
- Celah billing bypass tertutup: INSERT tenant oleh user biasa kini selalu `status='pending'` dengan kolom billing `NULL`.
- Celah input bloat tertutup di level DB (sumber) + dilapisi validasi klien.

---

## 7. Catatan Penerapan (Deployment)

Migrasi `011_tenant_insert_hardening.sql` **wajib dijalankan** di Supabase SQL Editor / `supabase db push` agar perbaikan database aktif. Tanpa itu, hanya lapisan klien yang aktif (tidak cukup menutup celah critical).

## 8. Rekomendasi Lanjutan (Opsional)

- Pertimbangkan mengganti policy `tenants_insert_owner` agar lebih eksplisit, atau memindahkan seluruh penciptaan tenant hanya ke trigger/`SECURITY DEFINER` (menghapus jalur INSERT dari klien sepenuhnya).
- Tambahkan rate limiting pada endpoint `signup` di sisi Supabase Auth bila tersedia.
