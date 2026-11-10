# Dokumentasi & Laporan Teknis Backend Dinely

Direktori ini memuat dokumentasi arsitektur, laporan pengujian per tahap, matriks klaim verifikasi teknis, serta panduan reproduksi pengujian manual (*curl*) untuk seluruh modul serverless API backend Dinely.

---

## 1. Indeks Dokumen

### A. Dokumen Desain & Fondasi Arsitektur
- **[`laporan_backend_product.md`](./laporan_backend_product.md)**: Analisis kebutuhan backend berdasarkan PRD dan dokumen arsitektur produk (`docs/product/`). Menjelaskan batas tanggung jawab, konvensi multi-tenant, dan desain skema database.

### B. Laporan Teknis Per Tahap (Termasuk Panduan `curl` Manual)
- **[`laporan_tahap_1_be01.md`](./laporan_tahap_1_be01.md)**: Tahap 1 — Integrasi Midtrans Snap API (`api/midtrans/create.ts`), validasi otentikasi JWT Bearer, dan kalkulasi nominal paket.
- **[`laporan_tahap_2_be02.md`](./laporan_tahap_2_be02.md)**: Tahap 2 — Webhook Midtrans (`api/midtrans/webhook.ts`), state lock, mitigasi idempotensi, dan resolusi edge cases R1, E1, E2.
- **[`laporan_tahap_3_be03.md`](./laporan_tahap_3_be03.md)**: Tahap 3 — Generator signature upload Cloudinary (`api/cloudinary/sign-upload.ts`), sanitasi path traversal, isolasi tenant sandboxing, dan proteksi anti-IDOR.
- **[`laporan_tahap_4_be04.md`](./laporan_tahap_4_be04.md)**: Tahap 4 — Chatbot AI Proxy (`api/gemini/chat.ts`), restriksi system prompt Dinely, normalisasi multi-turn, batas token anti-abuse, dan fallback santun kuota/jaringan.
- **[`laporan_tahap_5_be05.md`](./laporan_tahap_5_be05.md)**: Tahap 5 — Audit keamanan backend (BE-05) terhadap pencegahan kebocoran seluruh secret key (`SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`) ke bundle frontend.

### C. Dokumen Rekapitulasi & Matriks Klaim Terkonsolidasi
- **[`laporan_rekap_implementasi_dan_perbaikan_be01_be02.md`](./laporan_rekap_implementasi_dan_perbaikan_be01_be02.md)**: Ringkasan eksekutif konsolidasi implementasi, hardening, dan kronologi mitigasi edge cases H1–E2 modul pembayaran.
- **[`laporan_klaim_verifikasi_be03_be04.md`](./laporan_klaim_verifikasi_be03_be04.md)**: Matriks klaim teknis K-01 s/d K-33 yang memetakan klaim fungsional ke baris kode aktual dan unit test otomatis.

### D. Arsip Historis
- **[`archive/laporan_migrasi_cloudinary.md`](./archive/laporan_migrasi_cloudinary.md)**: Catatan riwayat penggantian teks spesifikasi produk saat migrasi dari Cloudflare R2 ke Cloudinary.

---

## 2. Cara Menjalankan Seluruh Automated Test Suite

```bash
# Menjalankan 70/70 API Unit & Security Audit Tests:
npm run test:api

# Memeriksa tipe TypeScript:
npx tsc --noEmit

# Memeriksa sintaks Svelte:
npm run check

# Memverifikasi bundle Vite production:
npm run build
```
