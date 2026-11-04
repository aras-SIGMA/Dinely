# Laporan Pengerjaan Backend — Tahap 2: BE-02 (`api/midtrans/webhook.ts`) [Hardened]

**Tanggal**: 4 November 2026  
**Modul**: Midtrans Payment Webhook (`api/midtrans/webhook.ts`)  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi (12/12 Unit Test Passed)  

---

## 1. Ringkasan Pekerjaan & Penyempurnaan Keamanan
Endpoint `api/midtrans/webhook.ts` telah diimplementasikan dan melalui hardening keamanan tingkat lanjut untuk menjamin integritas aktivasi tenant dan data billing:
1. **Verifikasi Keaslian Signature (SHA-512)**:
   - Menghitung hash SHA-512: `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`.
   - Perbandingan konstan waktu menggunakan `crypto.timingSafeEqual` untuk mencegah *timing attack*.
   - Menolak signature tidak sah dengan HTTP `403 Forbidden` sebelum menyentuh database.
2. **Validasi Kesesuaian Nominal (`gross_amount` vs `transactions.amount`)**:
   - Memastikan `gross_amount` di notifikasi cocok secara numerik dengan `amount` tagihan di database.
   - Mengembalikan HTTP `400 Bad Request` jika terjadi anomali/selisih nominal.
3. **Pembalikan Urutan Update & Mitigasi Partial Failure (Atomisitas Aplikasi)**:
   - *Urutan Baru*: Tabel `tenants` diaktifkan terlebih dahulu (`status = 'active'`, `subscription_ends_at`, `current_package_id`), baru kemudian status `transactions` diubah menjadi `'settlement'`.
   - *Recovery Guard*: Pada blok pengecekan idempotensi (`tx.status === 'settlement'`), sistem memverifikasi apakah tenant terkait sudah berstatus `active` dan memiliki masa aktif. Jika sebelumnya terjadi kegagalan parsial pada update tenant, proses aktivasi tenant dipulihkan secara otomatis saat retry notifikasi berikutnya.
4. **Perhitungan Durasi Berbasis Billing Cycle & Akumulatif**:
   - Menggunakan helper `calculateSubscriptionExtension(existingEndsAt, billingCycle)`.
   - Jika tenant sudah aktif dan masih memiliki sisa hari (`subscription_ends_at > now()`), durasi paket baru ditambahkan dari sisa masa aktif tersebut (tidak menghanguskan sisa hari pelanggan).
   - Menyesuaikan penambahan hari sesuai `billing_cycle`:
     - `trial` / `monthly`: +30 hari
     - `6_months`: +180 hari
     - `yearly`: +365 hari
5. **Finalisasi Fraud Status & Penanganan Error Lengkap**:
   - Event `capture` dengan `fraud_status: 'deny'` difinalkan secara eksplisit menjadi status transaksi `'deny'` (bukan dibiarkan berstatus `pending`).
   - Penanganan error database diterapkan di seluruh cabang (termasuk cabang `pending` dan cabang pembatalan/kegagalan).
   - *Catatan Batasan*: Mekanisme webhook untuk `refund` / `chargeback` ditandai di luar cakupan MVP.

---

## 2. Spesifikasi Kontrak Webhook

* **Endpoint**: `POST /api/midtrans/webhook`
* **Header**: `Content-Type: application/json`
* **Payload Request**:
  ```json
  {
    "order_id": "RL-WARUNG-M1K2X-A9B2C3",
    "status_code": "200",
    "gross_amount": "49000.00",
    "signature_key": "<SHA512_HASH>",
    "transaction_status": "settlement",
    "transaction_id": "midtrans-tx-001"
  }
  ```
* **Response 200 OK (Settlement)**:
  ```json
  {
    "status": "ok",
    "message": "Pembayaran berhasil diverifikasi. Tenant berhasil diaktifkan.",
    "order_id": "RL-WARUNG-M1K2X-A9B2C3"
  }
  ```
* **Response 200 OK (Idempotent Duplicate / Recovered)**:
  ```json
  {
    "status": "ok",
    "message": "Transaksi sudah diselesaikan sebelumnya (idempotent).",
    "order_id": "RL-WARUNG-M1K2X-A9B2C3"
  }
  ```
* **Error Matrix**:
  - `400`: Payload tidak lengkap atau nominal `gross_amount` tidak sesuai.
  - `403`: Verifikasi signature SHA-512 gagal.
  - `404`: `order_id` tidak terdaftar di database.
  - `405`: HTTP method selain `POST`.
  - `500`: Kegagalan server / database update.

---

## 3. Hasil Pengujian Otomatis

Script pengujian resmi didaftarkan di `package.json` (`npm run test:api`) dan mengeksekusi `api/_test_be02.ts`:
```
--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) [HARDENED] ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Payload tidak lengkap ditolak 400
[PASS] TC-03: Signature palsu ditolak 403
[PASS] TC-04: Transaksi tidak ditemukan mengembalikan 404
[PASS] TC-05: Asersi ketat valid settlement (delta 30 hari, settled_at, midtrans_tx_id, trial=null)
[PASS] TC-06: Webhook settlement duplikat ditangani secara idempotent (200 OK)
[PASS] TC-07: Webhook expire mengubah transaksi jadi expire dan tenant tetap pending
[PASS] TC-08: Partial failure recovery berhasil mengaktifkan tenant pada retry
[PASS] TC-09: capture + fraud_status deny difinalkan ke status deny
[PASS] TC-10: Perpanjangan mengakumulasi sisa hari aktif (10 hari sisa + 30 hari = 40 hari)
[PASS] TC-11: Selisih nominal gross_amount vs tx.amount ditolak 400
[PASS] TC-12: Error DB pada cabang pending ditangani dengan 500

Hasil: 12 Passed, 0 Failed
```

Verifikasi TypeScript & Build:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Kompilasi vite client berhasil

---

## 4. Cara Uji Manual via `curl`

> **Catatan Runtime**: Endpoint di folder `api/` dieksekusi melalui runtime Vercel Serverless. Pada lingkungan lokal, jalankan perintah `npx vercel dev` (default port `3000`), bukan port Vite `5173`.

1. Hitung signature SHA-512 di terminal (PowerShell):
   ```powershell
   $orderId = "RL-WARUNG-M1K2X-A9B2C3"
   $statusCode = "200"
   $grossAmount = "49000.00"
   $serverKey = "SB-Mid-server-your-key"
   $raw = "$orderId$statusCode$grossAmount$serverKey"
   $hasher = [System.Security.Cryptography.SHA512]::Create()
   $signature = [System.BitConverter]::ToString($hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($raw))).Replace("-","").ToLower()
   Write-Output $signature
   ```
2. Kirim payload webhook ke serverless dev environment:
   ```bash
   curl -X POST http://localhost:3000/api/midtrans/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "RL-WARUNG-M1K2X-A9B2C3",
       "status_code": "200",
       "gross_amount": "49000.00",
       "signature_key": "'$signature'",
       "transaction_status": "settlement",
       "transaction_id": "midtrans-tx-001"
     }'
   ```
3. Uji Idempotensi: Kirim ulang perintah di atas. Sistem merespons `200 OK` dengan pesan idempotent tanpa memodifikasi durasi masa aktif tenant.
