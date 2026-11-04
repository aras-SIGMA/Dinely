op# Laporan Pengerjaan Backend — Tahap 1: BE-01 & Shared Libs

**Tanggal**: 2 November 2026  
**Modul**: Payment Engine Midtrans (`api/midtrans/create.ts`) & Shared Utilities  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi (6/6 Unit Test Passed)  

---

## 1. Ringkasan Pekerjaan
Pada tahap ini, fondasi serverless backend dibangun bersamaan dengan implementasi endpoint pembuatan transaksi Midtrans Snap (BE-01):
1. **Shared Library (`api/_lib/`)**:
   - `api/_lib/supabase.ts`: Inisialisasi Supabase Client untuk role `anon` (validasi sesi pengguna) dan role `service_role` (eksekusi transaksi database terproteksi).
   - `api/_lib/auth.ts`: Middleware verifikasi JWT Bearer token dari header `Authorization` menggunakan Supabase Auth `getUser()`.
   - `api/_lib/http.ts`: Helper parsing body JSON (mendukung buffer stream maupun runtime parsed body Vercel) dan helper respon JSON standar.
2. **Endpoint BE-01 (`api/midtrans/create.ts`)**:
   - Validasi metode HTTP `POST` (menolak method lain dengan status `405`).
   - Autentikasi pemilik usaha (menolak token kosong/palsu dengan status `401`).
   - Validasi kepemilikan tenant (`owner_id = user.id`) dan pengecekan status penangguhan (`suspended`) dengan status `403`.
   - Validasi ketersediaan dan keaktifan paket langganan dari tabel `packages` dengan status `404`.
   - Kalkulasi nominal:
     - `billing_cycle = 'trial'`: Rp 49.000 (sesuai kesepakatan final).
     - `billing_cycle = 'monthly' | '6_months' | 'yearly'`: Mengikuti harga paket di database.
   - Pembuatan `order_id` unik dan deterministik (`RL-<SUBDOMAIN>-<TIME>-<HEX>`, panjang < 50 karakter).
   - Pemanggilan Midtrans Snap API Sandbox (`/snap/v1/transactions`) menggunakan Basic Auth server key via native `fetch`.
   - Penyimpanan riwayat transaksi awal ke tabel `transactions` dengan status `'pending'`.
3. **Dokumentasi Lingkungan (`.env.example`)**:
   - Pembuatan file referensi variabel lingkungan lengkap untuk frontend dan serverless backend.

---

## 2. Spesifikasi Kontrak API

* **Endpoint**: `POST /api/midtrans/create`
* **Header Wajib**:
  - `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`
  - `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "tenant_id": "c0a80123-0000-0000-0000-000000000001",
    "package_id": "p0a80123-0000-0000-0000-000000000001",
    "billing_cycle": "trial"
  }
  ```
* **Response 201 Created**:
  ```json
  {
    "token": "snap-token-midtrans",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "order_id": "RL-WARUNG-M1K2X-A9B2C3",
    "amount": 49000,
    "billing_cycle": "trial"
  }
  ```
* **Error Matrix**:
  - `400`: Body tidak lengkap atau `billing_cycle` tidak valid.
  - `401`: Token tidak disertakan atau sesi kedaluwarsa.
  - `403`: Tenant bukan milik akun login atau status `suspended`.
  - `404`: Tenant atau paket tidak ditemukan / non-aktif.
  - `405`: Method selain `POST`.
  - `500` / `502`: Kegagalan server internal / Midtrans Gateway Error.

---

## 3. Hasil Pengujian Otomatis

Pengujian dijalankan melalui script `api/_test_be01.ts`:
```
--- TEST SUITE: BE-01 (api/midtrans/create.ts) ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Header Authorization kosong ditolak 401
[PASS] TC-03: Bearer token kosong ditolak 401
[PASS] TC-04: Bearer token tidak valid ditolak 401
[PASS] TC-05: Field body tidak lengkap ditolak 400
[PASS] TC-06: billing_cycle tidak valid ditolak 400

Hasil: 6 Passed, 0 Failed
```

Verifikasi TypeScript & Build:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Berhasil dikompilasi tanpa error

---

## 4. Langkah Berikutnya
Melanjutkan ke **Tahap 2**: Implementasi `api/midtrans/webhook.ts` (BE-02) yang mencakup:
- Verifikasi signature hash SHA-512 dengan `MIDTRANS_SERVER_KEY`.
- Proteksi idempotensi untuk mencegah duplikasi aktivasi.
- Update status transaksi dan aktivasi tenant (`tenants.status = 'active'`, masa aktif +30 hari via `service_role`).
