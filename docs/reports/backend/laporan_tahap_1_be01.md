op# Laporan Pengerjaan Backend — Tahap 1: BE-01 & Shared Libs

**Tanggal**: 2 November 2026 (Updated: 8 November 2026 - Hardened v2)  
**Modul**: Payment Engine Midtrans (`api/midtrans/create.ts`) & Shared Utilities  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi Hardened v3 (21/21 Unit Test Passed)  

---

## 1. Ringkasan Pekerjaan
Pada tahap ini, fondasi serverless backend dibangun bersamaan dengan implementasi endpoint pembuatan transaksi Midtrans Snap (BE-01) dengan proteksi menyeluruh:
1. **Shared Library (`api/_lib/`)**:
   - `api/_lib/supabase.ts`: Inisialisasi Supabase Client untuk role `anon` (validasi sesi pengguna) dan role `service_role` (eksekusi transaksi database terproteksi).
   - `api/_lib/auth.ts`: Middleware verifikasi JWT Bearer token dari header `Authorization` menggunakan Supabase Auth `getUser()`.
   - `api/_lib/http.ts`: Helper parsing body JSON (mendukung buffer stream maupun runtime parsed body Vercel) dan helper respon JSON standar.
2. **Endpoint BE-01 (`api/midtrans/create.ts`) [Hardened v3]**:
   - Validasi metode HTTP `POST` (menolak method lain dengan status `405`).
   - Autentikasi pemilik usaha (menolak token kosong/palsu dengan status `401`).
   - Validasi format UUID untuk `tenant_id` dan `package_id` mencegah exception DB (status `400`).
   - Validasi kepemilikan tenant (`owner_id = user.id`) dan pengecekan status penangguhan (`suspended`) dengan status `403`.
   - Validasi ketersediaan dan keaktifan paket langganan dari tabel `packages` dengan status `404`.
   - **Anti-Price Manipulation**: Membatasi `billing_cycle = 'trial'` hanya berlaku untuk paket tier `mikro` (status `400`).
   - **Anti-Trial Abuse**: Memverifikasi riwayat transaksi di database; menolak siklus `trial` jika tenant pernah menyelesaikan transaksi trial sebelumnya (status `400`).
   - **Pending Throttling Guard**: Membatasi maksimal 3 transaksi `pending` aktif dalam 1 jam per tenant untuk mencegah DoS / kuota Snap flooding (status `429`).
   - Kalkulasi nominal:
     - `billing_cycle = 'trial'`: Rp 49.000 (sesuai kesepakatan final).
     - `billing_cycle = 'monthly' | '6_months' | 'yearly'`: Mengikuti harga paket di database.
     - Penolakan nominal paket <= 0 atau NaN (status `400`).
   - **Atomic Reservation**: Pencatatan awal record transaksi `pending` ke tabel `transactions` sebelum pemanggilan Midtrans Snap API.
   - **Resilience & Sanitasi**:
     - Sanitasi nama buyer max 50 karakter dan nomor kontak hanya angka/plus max 19 digit selaras dengan spesifikasi Midtrans.
     - Timeout proteksi `AbortSignal.timeout(10000)` (10 detik) menangani upstream hang dengan status `504 Gateway Timeout`.
     - Rollback status transaksi ke `'failure'` jika panggilan Midtrans Snap gagal atau timeout (status `502` / `504`).
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
    "package_id": "b0a80123-0000-0000-0000-000000000001",
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
  - `400`: Body tidak lengkap, format UUID `tenant_id`/`package_id` salah, `billing_cycle` tidak valid, paket non-mikro memilih trial, tenant sudah pernah trial, atau nominal invalid.
  - `401`: Token tidak disertakan atau sesi kedaluwarsa.
  - `403`: Tenant bukan milik akun login atau status `suspended`.
  - `404`: Tenant atau paket tidak ditemukan / non-aktif.
  - `405`: Method selain `POST`.
  - `429`: Terlalu banyak transaksi pending aktif (maksimal 3 per jam).
  - `500`: Kegagalan server internal / konfigurasi database / missing `MIDTRANS_SERVER_KEY`.
  - `502`: Midtrans Upstream Gateway Error / jaringan upstream terputus.
  - `504`: Midtrans Upstream Gateway Timeout (eksekusi > 10 detik).

---

## 3. Hasil Pengujian Otomatis

Pengujian dijalankan melalui script `api/_test_be01.ts`:
```
--- TEST SUITE: BE-01 (api/midtrans/create.ts) [HARDENED] ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Header Authorization kosong ditolak 401
[PASS] TC-03: Bearer token kosong ditolak 401
[PASS] TC-04: Bearer token tidak valid ditolak 401
[PASS] TC-05: Field body tidak lengkap ditolak 400
[PASS] TC-06: billing_cycle tidak valid ditolak 400
[PASS] TC-07: Format UUID tidak valid ditolak 400
[PASS] TC-08: Tenant tidak ditemukan ditolak 404
[PASS] TC-09: Tenant bukan milik user login ditolak 403
[PASS] TC-10: Tenant status suspended ditolak 403
[PASS] TC-11: Paket tidak aktif ditolak 404
[PASS] TC-12: Paket nominal <= 0 ditolak 400
[PASS] TC-13: MIDTRANS_SERVER_KEY kosong ditolak 500
[PASS] TC-14: Database error ditangani 500
[PASS] TC-15: Database insert error ditangani 500
[PASS] TC-16: Midtrans API upstream error ditangani 502 & transaksi di-rollback ke failure
[PASS] TC-17: Midtrans API timeout ditangani 504 & transaksi di-rollback ke failure
[PASS] TC-18: Happy path 201 Created: Snap Token terbit dan transaksi pending tersimpan di DB
[PASS] TC-19: Paket non-Mikro ditolak untuk siklus trial (Anti-Price Manipulation)
[PASS] TC-20: Tenant yang pernah settlement trial ditolak trial berulang (Anti-Trial Abuse)
[PASS] TC-21: Throttling batas maksimal 3 transaksi pending aktif menghasilkan HTTP 429

Hasil: 21 Passed, 0 Failed
```

Verifikasi TypeScript & Build:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Berhasil dikompilasi tanpa error (dist/ verified)
- `npm run test:api`: 85/85 Passed across BE-01 s/d BE-05

---

## 4. Langkah Berikutnya
Melanjutkan ke **Tahap 2**: Implementasi `api/midtrans/webhook.ts` (BE-02) yang mencakup:
- Verifikasi signature hash SHA-512 dengan `MIDTRANS_SERVER_KEY`.
- Proteksi idempotensi untuk mencegah duplikasi aktivasi.
- Update status transaksi dan aktivasi tenant (`tenants.status = 'active'`, masa aktif +30 hari via `service_role`).
