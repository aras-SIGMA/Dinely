# Laporan Pengerjaan Backend — Tahap 2: BE-02 (`api/midtrans/webhook.ts`) [Hardened v4 — Penutupan Celah R1, E1, E2]

**Tanggal**: 4 November 2026  
**Modul**: Midtrans Payment Webhook (`api/midtrans/webhook.ts`)  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai, Teruji (22/22 Unit Test BE-02, Total 28/28 API Test Passed) & Ter-push ke Remote Origin  

---

## 1. Masalah & Solusi Arsitektur State

### A. R1 (Hilangnya Ekstensi Perpanjangan Secara Senyap)
- **Akar Masalah**: Retry notifikasi settlement untuk tenant aktif yang sudah punya `subscription_ends_at` sebelumnya melewati blok recovery karena kondisi recovery lama hanya mengecek `status !== 'active' || !subscription_ends_at`.
- **Solusi**: Menyimpan `_target_subscription_ends_at` dan `_extension_applied: false` pada kolom `raw_notification` tabel `transactions` di Langkah 1. Langkah 2 mengupdate tenant ke target, Langkah 3 menandai `_extension_applied: true`.

### B. E1 (Perlindungan Baris Transaksi Legacy dari Ekstensi Ganda)
- **Akar Masalah**: Jika transaksi masa lalu (sebelum implementasi metadata) menerima notifikasi duplikat/resend manual dari Midtrans, ketiadaan target membuat recovery menghitung ulang perpanjangan dari masa aktif saat itu, mengakibatkan penambahan hari ganda (misal 30 hari menjadi 60 hari).
- **Solusi**: Jika `_target_subscription_ends_at` tidak ada (`null`), recovery **hanya** memulihkan tenant jika tenant belum aktif (`isTenantInactive`). Jika tenant sudah aktif, recovery tidak menambah durasi dan langsung menandai `_extension_applied: true`.

### C. E2 (Proteksi Monotonik Non-Decreasing / Anti-Pemendekan Masa Aktif)
- **Akar Masalah**: Jika penandaan Langkah 3 tertunda/gagal dan tenant telah diperpanjang oleh transaksi lain ke durasi yang lebih jauh (misal 70 hari), retry transaksi lama (target 40 hari) berpotensi menimpa dan memendekkan masa aktif tenant kembali ke 40 hari jika kondisi `!isExtensionApplied` mengeksekusi penulisan tanpa syarat.
- **Solusi**: Update tanggal tenant dibatasi secara ketat hanya jika `isTenantInactive || isEndsAtBehindTarget` (`currentEndsAt < targetEndsAt`). Jika tenant sudah berada di atau melampaui target, tanggal tenant tidak disentuh, dan transaksi langsung ditandai `_extension_applied: true`.
- **Error Checking**: Pengecekan error database ditambahkan pada pembaruan status transaksi di Langkah 3 maupun pada penandaan recovery, memastikan respon 500 memicu retry hingga database konsisten.

---

## 2. Cakupan Penanganan Error & Batasan Operasional
1. **Error Propagation**:
   - Error pembacaan tenant di recovery (`tenantCheckErr`) -> HTTP `500`.
   - Error update tenant di recovery (`recoveryErr`) -> HTTP `500`.
   - Error penandaan transaksi di Langkah 3 (`markSuccessError`) & recovery (`markErr`) -> HTTP `500`.
2. **Suspended Guard**:
   - Tenant dengan `status === 'suspended'` dilindungi dari aktivasi di kedua jalur (settlement utama dan recovery).
3. **Batasan Operasional**:
   - Transaksi settlement yang masuk pada masa tenant `suspended` dicatat sebagai settlement; penyesuaian masa aktif saat admin meng-unsuspend dilakukan secara manual melalui modul Admin Platform.
   - Event refund dan chargeback berada di luar cakupan MVP.

---

## 3. Matriks Hasil Pengujian Otomatis (`npm run test:api`)

```
--- TEST SUITE: BE-01 (api/midtrans/create.ts) ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Header Authorization kosong ditolak 401
[PASS] TC-03: Bearer token kosong ditolak 401
[PASS] TC-04: Bearer token tidak valid ditolak 401
[PASS] TC-05: Field body tidak lengkap ditolak 400
[PASS] TC-06: billing_cycle tidak valid ditolak 400
Hasil: 6 Passed, 0 Failed

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
[PASS] TC-13: Anti-Double Extension terbukti (Attempt 1 gagal 500, retry 200, total durasi tepat 30 hari)
[PASS] TC-14: Kegagalan DB pada recovery guard menghasilkan 500 (memicu retry Midtrans)
[PASS] TC-15: Suspended tenant tetap suspended saat pembayaran settlement masuk
[PASS] TC-16a: Attempt 1 gagal update tenant menghasilkan HTTP 500
[PASS] TC-16b: Retry memulihkan perpanjangan secara presisi (+10 hari sisa + 30 hari = 40 hari, bukan 10 hari)
[PASS] TC-16c: Retry duplikat lanjutan tidak menambah durasi ganda (tetap tepat 40 hari)
[PASS] TC-17: Error select tenant di blok recovery menghasilkan HTTP 500
[PASS] TC-18: Suspended tenant pada jalur recovery tetap berstatus suspended
[PASS] TC-19: Transaksi legacy tanpa metadata tidak menggandakan masa aktif tenant aktif (E1 fix)
[PASS] TC-20: Retry transaksi tertunda tidak memendekkan masa aktif yang sudah lebih maju (E2 fix)
Hasil: 22 Passed, 0 Failed
```

Verifikasi Tambahan:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Kompilasi Vite production sukses (0 error)
