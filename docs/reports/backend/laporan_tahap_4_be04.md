# Laporan Pengerjaan Backend — Tahap 4: BE-04 (`api/gemini/chat.ts`)

**Tanggal**: 5 November 2026  
**Modul**: Chatbot AI Proxy (`api/gemini/chat.ts`)  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi (13/13 Unit Test BE-04 PASS, Total 59/59 API Test Passed)  
**Status Git**: Tersimpan di working tree lokal (TIDAK DIPUSH).

---

## 1. Deskripsi Fitur & Spesifikasi Teknis

Endpoint `api/gemini/chat.ts` adalah proxy backend serverless yang menghubungkan widget chatbot AI di Landing Page utama platform ke Google Gemini API (`gemini-1.5-flash`). Endpoint ini menjaga kerahasiaan `GEMINI_API_KEY` dari browser, menyuntikkan instruksi sistem (system instruction) restriktif, serta menangani error kuota/jaringan dengan respon fallback santun agar tampilan antarmuka chat tidak crash.

### Rincian Arsitektur & Keamanan:
1. **Method Guard**:
   - Hanya menerima `POST`. Method lain ditolak dengan HTTP `405 Method Not Allowed`.
2. **Validasi & Proteksi Anti-Abuse**:
   - `message` wajib diisi (string tidak kosong / bukan whitespace semata); jika kosong ditolak HTTP `400 Bad Request`.
   - Panjang `message` dibatasi maksimal 1000 karakter untuk mencegah eksploitasi konsumsi token; melebihi batas ditolak HTTP `400 Bad Request`.
3. **Guard Kredensial Server**:
   - Memastikan `GEMINI_API_KEY` tersedia di environment serverless. Jika tidak ada, mengembalikan HTTP `500`.
4. **Instruksi Sistem (System Prompt Restriktif)**:
   - AI diinstruksikan bertindak sebagai asisten resmi RestoLink dalam bahasa Indonesia.
   - Pengetahuan terfokus pada: profil platform, fitur menu digital berbasis subdomain, QR code meja, guest checkout, dashboard pemilik, paket Mikro Rp 49.000/bulan (trial 30 hari via Midtrans), dan panduan registrasi.
   - Penolakan Sopan: Pertanyaan di luar RestoLink ditolak secara sopan dan diarahkan kembali ke topik RestoLink.
5. **Format & Normalisasi Riwayat Pesan (History)**:
   - Mendukung riwayat percakapan multi-turn (maksimal 10 pesan terakhir).
   - Menormalisasi urutan percakapan secara ketat agar bergantian (`user` -> `model` -> `user`), memenuhi konvensi API Gemini.
   - Pesan terakhir dari history yang ber-role `user` otomatis dibersihkan agar penggabungan pesan pengguna saat ini tidak menghasilkan role ganda berurutan.
6. **Graceful Fallback Handling**:
   - HTTP 429 (Rate Limit / Quota Exceeded): Server membalas HTTP 200 dengan `{ reply: FALLBACK_REPLY_QUOTA, fallback: true }`.
   - Error 500 / Network Exception: Membalas HTTP 200 dengan `{ reply: FALLBACK_REPLY_GENERIC, fallback: true }`.
   - Menjamin ketersediaan layanan dan mencegah frontend mengalami error unhandled.

---

## 2. Matriks Pengujian Otomatis (`npm run test:api`)

```
--- TEST SUITE: BE-01 (api/midtrans/create.ts) --- (6 Tests Passed)
--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) [HARDENED] --- (22 Tests Passed)
--- TEST SUITE: BE-03 (api/cloudinary/sign-upload.ts) --- (18 Tests Passed)

--- TEST SUITE: BE-04 (api/gemini/chat.ts) ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Body tanpa field message ditolak 400
[PASS] TC-03: Pesan hanya spasi kosong ditolak 400
[PASS] TC-04: Pesan melebihi 1000 karakter ditolak 400
[PASS] TC-05: Missing GEMINI_API_KEY menghasilkan 500
[PASS] TC-06: Request normal berhasil memproksi ke Gemini dengan balasan reply terstruktur
[PASS] TC-07: History multi-turn terurut bergantian user -> model -> user
[PASS] TC-08: History berujung user dinormalisasi agar tidak melanggar aturan role Gemini
[PASS] TC-09: Gemini 429 (kuota habis) ditangani dengan respon fallback santun (200 OK)
[PASS] TC-10: Gemini 500 server error ditangani dengan fallback generik (200 OK)
[PASS] TC-11: Network exception / timeout ditangani aman dengan fallback
[PASS] TC-12: Candidates respons Gemini kosong ditangani dengan fallback
[PASS] TC-13: System prompt memuat informasi fitur, paket Mikro, alur daftar, dan aturan penolakan off-topic
Hasil: 13 Passed, 0 Failed

TOTAL KESELURUHAN API TESTS: 59 PASSED, 0 FAILED
```

Verifikasi Statis & Build:
- `npx tsc --noEmit`: 0 error
- `npm run check`: 0 error, 0 warning
- `npm run build`: Kompilasi Vite production sukses (0 error)

---

## 3. Panduan Pengujian Manual via `curl`

Jalankan dev server:
```bash
npx vercel dev
# Berjalan pada port 3000
```

1. Chat tanya fitur RestoLink:
   ```bash
   curl -X POST http://localhost:3000/api/gemini/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Berapa biaya langganan paket di RestoLink dan apakah ada uji coba?"
     }'
   ```
   Contoh respon:
   ```json
   {
     "reply": "Halo! RestoLink menyediakan Paket Mikro seharga Rp 49.000 per bulan..."
   }
   ```

2. Chat pertanyaan di luar topik (Off-Topic):
   ```bash
   curl -X POST http://localhost:3000/api/gemini/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Siapakah presiden pertama Amerika Serikat?"
     }'
   ```
   Contoh respon:
   ```json
   {
     "reply": "Maaf, saya adalah asisten virtual RestoLink dan hanya dapat membantu menjawab pertanyaan seputar platform RestoLink, fitur, paket harga, dan cara pendaftarannya..."
   }
   ```
