# Laporan Pengerjaan Backend — Tahap 2: BE-02 (`api/midtrans/webhook.ts`)

**Tanggal**: 4 November 2026  
**Modul**: Midtrans Payment Webhook (`api/midtrans/webhook.ts`)  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi (7/7 Unit Test Passed)  

---

## 1. Ringkasan Pekerjaan
Pada tahap ini, endpoint penerima notifikasi webhook Midtrans (BE-02) diimplementasikan sebagai titik paling kritis aktivasi paket dan tenant:
1. **Verifikasi Keaslian Notifikasi (Signature SHA-512)**:
   - Menghitung hash SHA-512 dari kombinasi: `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`.
   - Menggunakan `crypto.timingSafeEqual` untuk mencegah serangan timing attack.
   - Menolak signature tidak sah dengan HTTP `403 Forbidden`.
2. **Idempotency Protection**:
   - Mengecek status transaksi di database.
   - Jika transaksi telah berstatus `settlement` atau `capture`, sistem langsung merespons HTTP `200 OK` tanpa memproses ulang aktivasi atau memodifikasi masa aktif tenant.
3. **Aktivasi Tenant Otomatis**:
   - Jika `transaction_status` bernilai `settlement` (atau `capture` dengan `fraud_status: 'accept'`):
     - Memperbarui `transactions.status = 'settlement'`, mengisi `settled_at`, `midtrans_transaction_id`, dan menyimpan `raw_notification`.
     - Mengubah `tenants.status = 'active'`, menyetel `current_package_id`, dan mengatur masa aktif `subscription_ends_at = now() + 30 hari`.
4. **Penanganan Kegagalan & Pembatalan Transaksi**:
   - Jika `transaction_status` bernilai `deny`, `cancel`, `expire`, atau `failure`:
     - Memperbarui status transaksi sesuai event dan menyimpan raw payload.
     - Status tenant tidak diaktifkan (tetap `pending`).

---

## 2. Spesifikasi Kontrak Webhook

* **Endpoint**: `POST /api/midtrans/webhook`
* **Header**: `Content-Type: application/json`
* **Payload Request (Contoh Settlement)**:
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
* **Response 200 OK (Idempotent Duplicate)**:
  ```json
  {
    "status": "ok",
    "message": "Transaksi sudah diselesaikan sebelumnya (idempotent).",
    "order_id": "RL-WARUNG-M1K2X-A9B2C3"
  }
  ```
* **Error Matrix**:
  - `400`: Payload tidak lengkap.
  - `403`: Verifikasi signature SHA-512 gagal.
  - `404`: `order_id` tidak terdaftar di database.
  - `405`: HTTP method selain `POST`.
  - `500`: Kegagalan server / database update.

---

## 3. Hasil Pengujian Otomatis

Pengujian dijalankan melalui script `api/_test_be02.ts`:
```
--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Payload tidak lengkap ditolak 400
[PASS] TC-03: Signature palsu ditolak 403
[PASS] TC-04: Transaksi tidak ditemukan mengembalikan 404
[PASS] TC-05: Valid settlement webhook mengaktifkan tenant dan status transaksi settlement
[PASS] TC-06: Webhook settlement duplikat ditangani secara idempotent (200 OK)
[PASS] TC-07: Webhook expire mengubah transaksi jadi expire dan tenant tetap pending

Hasil: 7 Passed, 0 Failed
```

Verifikasi TypeScript & Build:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Kompilasi vite client berhasil

---

## 4. Langkah Berikutnya
Melanjutkan ke **Tahap 3**: Implementasi `api/cloudinary/sign-upload.ts` (BE-03) untuk autentikasi dan pembuatan signature upload gambar menu / logo usaha.
