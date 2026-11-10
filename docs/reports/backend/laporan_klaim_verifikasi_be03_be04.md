# Laporan Gabungan Klaim Teknis & Bukti Verifikasi — BE-03 & BE-04

**Tanggal**: 7 November 2026  
**Modul**:
1. Cloudinary Upload Signer (`api/cloudinary/sign-upload.ts` — BE-03)
2. Chatbot AI Proxy (`api/gemini/chat.ts` — BE-04)  
**Penulis**: Backend Developer  
**Status**: Implementasi Selesai, Terverifikasi 34/34 Unit Test BE-03 & BE-04 (Total 70/70 Test Suite Backend PASS), Working Tree Lokal (Belum Push)

---

## 1. Bagian I: Klaim Teknis BE-03 (`api/cloudinary/sign-upload.ts`)

| No | Klaim Teknis | Lokasi Kode (`sign-upload.ts`) | Bukti Uji (`api/_test_be03.ts`) | Hasil Uji |
|:---|:---|:---|:---|:---:|
| **K-01** | **Method Guard**: Request selain `POST` (seperti `GET`, `PUT`, `DELETE`) ditolak dengan HTTP `405 Method Not Allowed`. | Baris 35–37 | **TC-01**: Method GET ditolak 405 | **PASS** |
| **K-02** | **Otentikasi Wajib**: Header `Authorization` kosong ditolak dengan HTTP `401 Unauthorized`. | Baris 50–58 (via `authenticateUser`) | **TC-02**: Header Authorization kosong ditolak 401 | **PASS** |
| **K-03** | **Format Token**: Bearer token kosong (`Bearer   `) ditolak dengan HTTP `401 Unauthorized`. | Baris 50–58 (via `authenticateUser`) | **TC-03**: Bearer token kosong ditolak 401 | **PASS** |
| **K-04** | **Integritas Sesi**: JWT token palsu / kedaluwarsa diverifikasi ke Supabase Auth dan ditolak HTTP `401 Unauthorized`. | Baris 50–58 (via `authenticateUser`) | **TC-04**: Bearer token tidak valid ditolak 401 | **PASS** |
| **K-05** | **Whitelist Kategori**: Nilai parameter `type` di luar whitelist (`'menu'` atau `'logo'`) ditolak dengan HTTP `400 Bad Request`. | Baris 67–72 | **TC-05**: Kategori upload type tidak valid ditolak 400 | **PASS** |
| **K-06** | **Anti-Path Traversal**: Parameter `folder` kustom yang mengandung sequence `..` ditolak dengan HTTP `400 Bad Request`. | Baris 75–82 | **TC-06**: Custom folder dengan `..` ditolak 400 | **PASS** |
| **K-07** | **Sanitasi Karakter Folder**: Parameter `folder` kustom dengan karakter terlarang / regex non-alphanumeric ditolak HTTP `400`. | Baris 75–82 | **TC-07**: Custom folder karakter ilegal ditolak 400 | **PASS** |
| **K-08** | **Guard Kredensial Server**: Jika salah satu dari `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, atau `CLOUDINARY_API_SECRET` tidak ada di server env, return HTTP `500`. | Baris 39–47 | **TC-08**: Kredensial server Cloudinary tidak lengkap return 500 | **PASS** |
| **K-09** | **Validasi Eksistensi Tenant**: `tenant_id` eksplisit yang tidak terdaftar di database `tenants` mengembalikan HTTP `404 Not Found`. | Baris 117–119 | **TC-09**: `tenant_id` eksplisit tidak ada return 404 | **PASS** |
| **K-10** | **Proteksi Akses Lintas Akun**: Akun non-admin yang mencoba membuat signature untuk `tenant_id` milik orang lain ditolak HTTP `403 Forbidden`. | Baris 121–125 | **TC-10**: `tenant_id` milik akun lain ditolak 403 | **PASS** |
| **K-11** | **Suspended Guard**: Tenant yang sedang ditangguhkan (`status === 'suspended'`) dilarang mengunggah media dan ditolak HTTP `403 Forbidden`. | Baris 127–131 & 150–154 | **TC-11**: Tenant suspended ditolak 403 | **PASS** |
| **K-12** | **Proteksi Akun Tanpa Tenant**: User dengan role `owner` yang belum memiliki tenant terdaftar ditolak HTTP `403 Forbidden`. | Baris 157–161 | **TC-12**: Akun tanpa tenant ditolak 403 | **PASS** |
| **K-13** | **Default Folder Menu**: Upload kategori `type: 'menu'` otomatis diarahkan ke `restolink/tenants/{tenant_id}/menus`. | Baris 186–191 | **TC-13**: Generate signature menu valid dengan folder menus | **PASS** |
| **K-14** | **Default Folder Logo**: Upload kategori `type: 'logo'` otomatis diarahkan ke `restolink/tenants/{tenant_id}/logos`. | Baris 186–191 | **TC-14**: Generate signature logo valid dengan folder logos | **PASS** |
| **K-15** | **Custom Folder Sandbox & Anti-IDOR**: Custom folder milik non-admin diwajibkan berada di bawah `restolink/tenants/{tenant_id}/`. Folder tenant lain ditolak HTTP `403`. | Baris 165–185 | **TC-15 & TC-19**: Custom folder tenant valid diakomodasi, folder tenant lain ditolak 403 | **PASS** |
| **K-16** | **Platform Admin Bypass**: Akun dengan `role: 'platform_admin'` diizinkan membuat signature untuk tenant mana pun tanpa batasan kepemilikan. | Baris 99, 121, 157 | **TC-16**: Platform admin diizinkan generate signature untuk tenant mana pun | **PASS** |
| **K-17** | **Standar Signing Cloudinary**: Parameter disortir secara alfabetis (`folder` sebelum `timestamp`) sebelum di-hash SHA-1 bersama `CLOUDINARY_API_SECRET`. | Baris 13–32 (`generateCloudinarySignature`) | **TC-17**: Parameter sorting alfabetis akurat sesuai spek Cloudinary | **PASS** |
| **K-18** | **Interoperabilitas Client**: Struktur response JSON `{ signature, timestamp, apiKey, cloudName, folder }` selaras 100% dengan `requestUploadSignature` di `src/lib/cloudinary-upload.ts`. | Baris 203–209 | **TC-18**: Kontrak respons kompatibel dengan client uploader | **PASS** |
| **K-19** | **Relative Folder Auto-Sandboxing**: Folder relatif dari owner otomatis dibungkus ke dalam namespace tenant pemohon (`restolink/tenants/{tenant_id}/{folder}`). | Baris 178–181 | **TC-20**: Relative custom folder otomatis di-sandbox | **PASS** |

---

## 2. Bagian II: Klaim Teknis BE-04 (`api/gemini/chat.ts`)

| No | Klaim Teknis | Lokasi Kode (`chat.ts`) | Bukti Uji (`api/_test_be04.ts`) | Hasil Uji |
|:---|:---|:---|:---|:---:|
| **K-20** | **Method Guard**: Request selain `POST` (seperti `GET`, `PUT`, `DELETE`) ditolak dengan HTTP `405 Method Not Allowed`. | Baris 137–139 | **TC-01**: Method GET ditolak 405 | **PASS** |
| **K-21** | **Validasi Field Message**: Request tanpa field `message` ditolak dengan HTTP `400 Bad Request`. | Baris 149–156 | **TC-02**: Body tanpa field message ditolak 400 | **PASS** |
| **K-22** | **Validasi Spasi Kosong**: Pesan yang hanya berisi spasi kosong (`   `) ditolak dengan HTTP `400 Bad Request`. | Baris 149–156 | **TC-03**: Pesan hanya spasi kosong ditolak 400 | **PASS** |
| **K-23** | **Batas Panjang Pesan**: Pesan yang melebihi 1000 karakter ditolak dengan HTTP `400 Bad Request` guna mencegah eksploitasi token. | Baris 158–163 | **TC-04**: Pesan melebihi 1000 karakter ditolak 400 | **PASS** |
| **K-24** | **Kredensial Server**: Ketiadaan variabel lingkungan `GEMINI_API_KEY` pada server mengembalikan HTTP `500 Internal Server Error`. | Baris 141–146 | **TC-05**: Missing GEMINI_API_KEY menghasilkan 500 | **PASS** |
| **K-25** | **Proxying ke Gemini API**: Request valid berhasil diteruskan ke Gemini API (`gemini-1.5-flash`) dan mengembalikan objek JSON `{ reply: string }`. | Baris 165–209 | **TC-06**: Request normal memproksi ke Gemini dan mengembalikan reply terstruktur | **PASS** |
| **K-26** | **Normalisasi Percakapan Multi-turn**: Riwayat pesan (`history`) dinormalisasi secara ketat agar urutan peran bergantian (`user` -> `model` -> `user`). | Baris 49–112 (`formatHistory`) | **TC-07**: History multi-turn terurut bergantian user -> model -> user | **PASS** |
| **K-27** | **Pencegahan Duplikasi Role User**: Jika riwayat pesan berakhir pada role `user`, item terakhir dibersihkan agar penggabungan pesan terkini tidak melanggar aturan Gemini. | Baris 107–109 (`formatHistory`) | **TC-08**: History berujung user dinormalisasi | **PASS** |
| **K-28** | **Fallback Kuota (HTTP 429)**: Jika API Gemini mengembalikan status 429 (kuota habis / rate limit), server merespons HTTP 200 dengan pesan fallback santun agar UI chat tetap aman. | Baris 178–183 | **TC-09**: Gemini 429 ditangani dengan respon fallback santun (200 OK) | **PASS** |
| **K-29** | **Fallback Error Server (HTTP 500)**: Jika API Gemini mengalami kegagalan internal (500), server merespons HTTP 200 dengan fallback generik. | Baris 185–194 | **TC-10**: Gemini 500 server error ditangani dengan fallback generik (200 OK) | **PASS** |
| **K-30** | **Resiliensi Jaringan (Network Exception)**: Gangguan soket jaringan atau timeout saat memanggil Gemini ditangani secara aman dengan fallback respons (HTTP 200). | Baris 210–218 | **TC-11**: Network exception / timeout ditangani aman dengan fallback | **PASS** |
| **K-31** | **Kandidat Kosong**: Respons Gemini tanpa kandidat teks ditangani aman dengan pesan fallback (HTTP 200). | Baris 200–205 | **TC-12**: Candidates respons Gemini kosong ditangani dengan fallback | **PASS** |
| **K-32** | **Cakupan Informasi System Prompt**: System prompt mencakup instruksi fitur menu digital subdomain, QR code meja, paket Mikro Rp 49.000, alur registrasi, dan penolakan sopan pertanyaan di luar topik. | Baris 17–41 (`DINELY_SYSTEM_PROMPT`) | **TC-13**: System prompt memuat seluruh informasi wajib & penolakan off-topic | **PASS** |
| **K-33** | **Anti-DoS Token Riwayat**: Teks pada tiap item riwayat (`history`) dibatasi maksimal 1000 karakter guna mencegah lonjakan memori dan token exhaustion. | Baris 84–86 (`formatHistory`) | **TC-14**: History item dipotong aman ke 1000 karakter | **PASS** |

---

## 3. Matriks Hasil Pengujian Otomatis (`npm run test:api`)

```
--- TEST SUITE: BE-01 (api/midtrans/create.ts) --- (6 Tests Passed)
--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) [HARDENED] --- (22 Tests Passed)
--- TEST SUITE: BE-03 (api/cloudinary/sign-upload.ts) --- (20 Tests Passed)
--- TEST SUITE: BE-04 (api/gemini/chat.ts) --- (14 Tests Passed)
--- TEST SUITE: BE-05 (Security Audit: Secret Key Protection) --- (8 Tests Passed)

TOTAL KESELURUHAN API TESTS: 70 PASSED, 0 FAILED
```

---

## 4. Hasil Pemeriksaan Integritas Sistem

- `npx tsc --noEmit` -> **0 Error**
- `npm run check` -> **0 Error, 0 Warning**
- `npm run build` -> **Sukses** (Vite production bundle compiled bersih)

---

## 5. Status Working Tree & Kontrak Git

- **File Terkonsolidasi**: `docs/reports/backend/laporan_klaim_verifikasi_be03_be04.md`
- **Aturan Git**: Perubahan tersimpan di working tree lokal dan **TIDAK di-push** ke GitHub remote tanpa perintah eksplisit pengguna.
