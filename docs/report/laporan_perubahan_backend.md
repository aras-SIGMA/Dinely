# Laporan Perubahan Dokumentasi (Migrasi Cloudflare ke Cloudinary)

Dokumen ini mencatat seluruh perubahan teks dari **Cloudflare / Cloudflare R2** menjadi **Cloudinary** di dokumen spesifikasi produk dan analisis backend RestoLink.

---

## 1. `docs/product/00_README.md`
* **Baris 33 (Ringkasan Satu Paragraf)**:
  `Stack: Vite + Svelte + TypeScript (frontend), Supabase (DB, Auth, RLS), Cloudflare R2 (gambar), Midtrans (pembayaran), Vercel (hosting + wildcard subdomain), Gemini API (chatbot — hanya di landing page utama platform, bukan di website tenant).`
  ->
  `Stack: Vite + Svelte + TypeScript (frontend), Supabase (DB, Auth, RLS), Cloudinary (gambar), Midtrans (pembayaran), Vercel (hosting + wildcard subdomain), Gemini API (chatbot — hanya di landing page utama platform, bukan di website tenant).`

---

## 2. `docs/product/02_ARCHITECTURE.md`
* **Baris 15 (Tabel Stack Teknologi - Penyimpanan Gambar)**:
  `| Penyimpanan Gambar | **Cloudflare R2** (format WebP) | Logo usaha, foto menu — dikompresi sebelum upload untuk hemat storage |`
  ->
  `| Penyimpanan Gambar | **Cloudinary** (format WebP) | Logo usaha, foto menu — dikompresi sebelum upload untuk hemat storage |`

* **Baris 143 (Diagram Konteks Sistem)**:
  `│  Cloudflare R2  │        │    Midtrans     │  │ Website Publik    │`
  ->
  `│   Cloudinary    │        │    Midtrans     │  │ Website Publik    │`

* **Baris 159 (Checklist Keamanan & Isolasi Data)**:
  `- [ ] Upload gambar ke Cloudflare R2 dibatasi ukuran & tipe file, dan dikompresi ke WebP sebelum/pada saat upload.`
  ->
  `- [ ] Upload gambar ke Cloudinary dibatasi ukuran & tipe file, dan dikompresi ke WebP sebelum/pada saat upload.`

---

## 3. `docs/product/03_DATABASE_SCHEMA.md`
* **Baris 49 (Tabel `tenants` - Kolom `logo_url`)**:
  `| `logo_url` | `text` | Path/URL di Cloudflare R2 |`
  ->
  `| `logo_url` | `text` | Path/URL di Cloudinary |`

* **Baris 153 (Tabel `menu_items` - Kolom `image_url`)**:
  `| `image_url` | `text` | Cloudflare R2, format WebP |`
  ->
  `| `image_url` | `text` | Cloudinary, format WebP |`

---

## 4. `docs/product/04_USER_FLOWS.md`
* **Baris 18 (Alur 1: Alur Pemilik Usaha - Langkah 7)**:
  `7. Pemilik menambahkan kategori & menu beserta harga dan foto (diupload ke Cloudflare R2, dikompresi WebP).`
  ->
  `7. Pemilik menambahkan kategori & menu beserta harga dan foto (diupload ke Cloudinary, dikompresi WebP).`

* **Baris 84 (Alur 5: Alur Pengelolaan Menu - Langkah 3)**:
  `3. Dalam kategori, tambah menu: nama, deskripsi, harga, foto (upload → kompres WebP → simpan ke Cloudflare R2 → simpan URL di `menu_items.image_url`).`
  ->
  `3. Dalam kategori, tambah menu: nama, deskripsi, harga, foto (upload → kompres WebP → simpan ke Cloudinary → simpan URL di `menu_items.image_url`).`

---

## 5. `docs/product/05_FEATURE_SPEC.md`
* **Baris 67 (Modul D2: CRUD Menu - Acceptance Criteria)**:
  `- [ ] Upload foto dikompresi ke WebP sebelum disimpan ke Cloudflare R2.`
  ->
  `- [ ] Upload foto dikompresi ke WebP sebelum disimpan ke Cloudinary.`

---

## 6. `docs/laporan_backend_product.md`
* **Bagian 2 (Tech Stack dan Konvensi - Asset Storage)**:
  `* **Asset Storage**: Cloudflare R2 untuk penyimpanan logo usaha dan foto menu dalam format WebP yang dikompresi sebelum upload.`
  ->
  `* **Asset Storage**: Cloudinary untuk penyimpanan logo usaha dan foto menu dalam format WebP yang dikompresi sebelum upload.`

* **Bagian 4 (Daftar Fitur dan Endpoint Backend - Endpoint 3)**:
  `3. **Asset Upload Signer / Direct Storage Endpoint**`
  `   * *Method & Path*: TIDAK JELAS (Di 02_ARCHITECTURE.md Bagian 1 & 7 hanya disebut upload gambar WebP ke Cloudflare R2; endpoint signer / presigned URL belum dispesifikasikan).`
  `   * *Tujuan*: Menyediakan kredensial sementara / presigned PUT URL ke Cloudflare R2 agar client dapat mengunggah logo dan gambar menu secara aman tanpa membocorkan kredensial R2 ke frontend.`
  ->
  `3. **Asset Upload Signer / Direct Storage Endpoint**`
  `   * *Method & Path*: POST api/cloudinary/sign-upload.ts (Sesuai TIM_TASKS.md BE-03).`
  `   * *Tujuan*: Menyediakan signature berbatas waktu (timestamp) terotentikasi ke Cloudinary menggunakan CLOUDINARY_API_SECRET agar client dapat mengunggah logo dan gambar menu secara aman tanpa membocorkan secret key ke frontend.`

* **Bagian 7 (Informasi yang Kurang atau Ambigu - Poin 2)**:
  `2. **Spesifikasi Teknis Upload ke Cloudflare R2**:`
  `   * *Status*: TIDAK JELAS.`
  `   * *Detail*: Dokumen hanya menyebut gambar menu dikompresi ke WebP dan disimpan ke Cloudflare R2. Tidak ada endpoint, SDK, maupun skema presigned URL yang dijelaskan untuk mengizinkan upload dari browser secara aman ke bucket R2.`
  ->
  `2. **Spesifikasi Teknis Upload ke Cloudinary**:`
  `   * *Status*: Sudah jelas via endpoint signer api/cloudinary/sign-upload.ts (generate signature SHA-1 dengan timestamp dan CLOUDINARY_API_SECRET), lalu client melakukan direct POST multipart ke API Cloudinary.`

* **Bagian 8 (Pertanyaan Konfirmasi Sebelum Koding - Poin 3)**:
  `3. **Mekanisme Upload R2**: Bagaimana alur upload ke Cloudflare R2 yang disepakati? Apakah backend perlu membuat endpoint presigned PUT URL S3-compatible, atau ada mekanisme lain?`
  ->
  `3. **Mekanisme Upload Cloudinary**: Konfirmasi alur upload Cloudinary melalui backend signer (SHA-1 signature generator dengan timestamp) yang dipanggil oleh client sebelum POST multipart ke API Cloudinary.`

* **Bagian 9 (Usulan Urutan Pengerjaan Backend - Tahap 4)**:
  `4. **Tahap 4: Endpoint Media Storage Signer**`
  `   * Membangun endpoint signer / presigned URL generator untuk upload gambar menu dan logo ke Cloudflare R2 secara aman.`
  ->
  `4. **Tahap 4: Endpoint Media Storage Signer (Cloudinary)**`
  `   * Membangun endpoint signer (api/cloudinary/sign-upload.ts) untuk upload gambar menu dan logo ke Cloudinary secara aman.`
