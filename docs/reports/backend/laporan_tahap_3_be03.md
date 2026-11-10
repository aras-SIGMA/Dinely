# Laporan Pengerjaan Backend — Tahap 3: BE-03 (`api/cloudinary/sign-upload.ts`)

**Tanggal**: 5 November 2026  
**Modul**: Cloudinary Upload Signer (`api/cloudinary/sign-upload.ts`)  
**Branch**: `feature/backend-api-services`  
**Status**: Selesai & Terverifikasi (20/20 Unit Test BE-03 PASS, Total 70/70 API Test Passed)  
**Status Git**: Tersimpan di working tree lokal (TIDAK DIPUSH).

---

## 1. Deskripsi Fitur & Spesifikasi Teknis

Endpoint `api/cloudinary/sign-upload.ts` berfungsi untuk menghasilkan *presigned upload signature* menggunakan `CLOUDINARY_API_SECRET` di sisi backend serverless. Ini memungkinkan browser / client frontend (`src/lib/cloudinary-upload.ts`) mengunggah logo usaha dan gambar menu langsung ke Cloudinary API tanpa mengekspos API secret ke client-side bundle.

### Rincian Arsitektur & Keamanan:
1. **Otentikasi Pengguna**:
   - Memeriksa header `Authorization: Bearer <token>`.
   - Token divalidasi ke Supabase Auth via `authenticateUser` (`api/_lib/auth.ts`).
2. **Otorisasi & Proteksi Tenant**:
   - Jika `tenant_id` dikirimkan, diverifikasi apakah user adalah pemilik sah (`tenant.owner_id === user.id`) atau `platform_admin`.
   - Jika `tenant_id` tidak dikirimkan, sistem otomatis mengambil tenant milik akun tersebut.
   - Tenant dengan `status === 'suspended'` ditolak dengan HTTP `403 Forbidden`.
   - Akun tanpa tenant dan bukan `platform_admin` ditolak dengan HTTP `403 Forbidden`.
3. **Validasi Kategori & Sanitasi Folder**:
   - Kategori `type` dibatasi pada whitelist: `'menu'` atau `'logo'` (default: `'menu'`).
   - Custom folder disanitasi ketat dari path traversal (`..`) dan karakter berbahaya.
   - Folder default diisolasi per tenant:
     - Menu: `restolink/tenants/{tenant_id}/menus`
     - Logo: `restolink/tenants/{tenant_id}/logos`
4. **Algoritma Signing Kriptografis (SHA-1)**:
   - Parameter disortir secara alfabetis (`folder` sebelum `timestamp`).
   - String dibentuk sesuai spesifikasi Cloudinary: `folder=${folder}&timestamp=${timestamp}${apiSecret}`.
   - Dihash menggunakan SHA-1 hex digest (`node:crypto`).
5. **Keselarasan Kontrak Response**:
   - Format respons `200 OK`:
     ```json
     {
       "signature": "string_sha1_hash",
       "timestamp": 1730764800,
       "apiKey": "123456789012345",
       "cloudName": "restolink-cloud",
       "folder": "restolink/tenants/{tenant_id}/menus"
     }
     ```
   - 100% kompatibel dengan fungsi client `requestUploadSignature` (`src/lib/cloudinary-upload.ts`).

---

## 2. Matriks Pengujian Otomatis (`npm run test:api`)

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
[PASS] TC-01 s/d TC-20 (Total 22 Tests)
Hasil: 22 Passed, 0 Failed

--- TEST SUITE: BE-03 (api/cloudinary/sign-upload.ts) ---
[PASS] TC-01: Method GET ditolak 405
[PASS] TC-02: Header Authorization kosong ditolak 401
[PASS] TC-03: Bearer token kosong ditolak 401
[PASS] TC-04: Bearer token tidak valid ditolak 401
[PASS] TC-05: Kategori upload type tidak valid ditolak 400
[PASS] TC-06: Custom folder dengan path traversal (..) ditolak 400
[PASS] TC-07: Custom folder dengan karakter ilegal ditolak 400
[PASS] TC-08: Kredensial server Cloudinary belum lengkap mengembalikan 500
[PASS] TC-09: tenant_id eksplisit tidak ditemukan mengembalikan 404
[PASS] TC-10: tenant_id milik orang lain ditolak 403
[PASS] TC-11: Tenant suspended ditolak 403
[PASS] TC-12: Akun tanpa tenant dan bukan admin ditolak 403
[PASS] TC-13: Generate signature menu valid dengan SHA-1 akurat dan default tenant folder
[PASS] TC-14: Generate signature logo valid dengan folder logos yang benar
[PASS] TC-15: Custom folder valid diintegrasikan ke signature SHA-1
[PASS] TC-16: Platform admin diizinkan generate signature untuk tenant mana pun
[PASS] TC-17: Generator signature mengurutkan parameter alfabetis sesuai spesifikasi Cloudinary
[PASS] TC-18: Kontrak respons JSON 100% kompatibel dengan requestUploadSignature client
[PASS] TC-19: Custom folder menyeberang ke tenant lain ditolak 403 Forbidden (Anti-IDOR)
[PASS] TC-20: Relative custom folder otomatis di-sandbox ke dalam namespace tenant pemohon
Hasil: 20 Passed, 0 Failed

Total Keseluruhan API Tests: 70 Passed, 0 Failed
```

Pemeriksaan Tambahan:
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

Kirim request dengan JWT token login pemilik usaha:
```bash
curl -X POST http://localhost:3000/api/cloudinary/sign-upload \
  -H "Authorization: Bearer <SUPABASE_USER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "menu"
  }'
```

Contoh respon `200 OK`:
```json
{
  "signature": "a1b2c3d4e5f6...",
  "timestamp": 1730764800,
  "apiKey": "your-api-key",
  "cloudName": "your-cloud-name",
  "folder": "restolink/tenants/tenant-uuid-1/menus"
}
```
