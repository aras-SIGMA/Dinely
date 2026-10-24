# RestoLink — Dokumen Konteks Produk (untuk AI Coding Assistant)

Folder ini berisi seluruh konteks produk **RestoLink**, platform website & pengelolaan pesanan terpusat untuk UMKM kuliner, yang diturunkan dari *Proposal Lomba GTNIC 2026 (Tim Kepiting Purba)*.

Dokumen ini dipecah menjadi beberapa file agar setiap AI assistant (atau developer) yang mengerjakan modul tertentu bisa membaca bagian yang relevan tanpa harus memuat seluruh konteks sekaligus.

## Urutan Baca yang Disarankan

| # | File | Isi | Kapan dibaca |
|---|------|-----|---------------|
| 1 | `01_PRD.md` | Masalah, tujuan, scope, daftar requirement (FR/NFR) | **Selalu baca pertama** — ini sumber kebenaran utama (source of truth) untuk *apa* yang dibangun |
| 2 | `02_ARCHITECTURE.md` | Stack teknis, struktur proyek, arsitektur multi-tenant, resolusi subdomain | Sebelum menulis kode apa pun, atau saat setup proyek |
| 3 | `03_DATABASE_SCHEMA.md` | Skema tabel Supabase, relasi, RLS policy | Sebelum membuat migrasi database atau query |
| 4 | `04_USER_FLOWS.md` | Alur langkah-demi-langkah tiap peran pengguna + edge case | Saat membangun halaman/fitur yang melibatkan alur multi-step (registrasi, pembayaran, pemesanan) |
| 5 | `05_FEATURE_SPEC.md` | Rincian fitur per modul, per paket, dengan acceptance criteria | Saat mengimplementasikan fitur spesifik, untuk tahu "selesai" itu seperti apa |

## Cara Pakai dengan AI Assistant

Jika kamu memakai Claude Code / Cursor / alat sejenis, cara paling efektif:

- Taruh seluruh isi folder ini di root repo, misalnya di `docs/product/`.
- Saat memulai sesi baru, minta AI membaca `01_PRD.md` + file yang relevan dengan task saat itu (jangan selalu semua file, supaya hemat konteks).
- Jika AI butuh detail tabel → arahkan ke `03_DATABASE_SCHEMA.md`.
- Jika AI bikin halaman pembayaran/registrasi/pemesanan → arahkan ke `04_USER_FLOWS.md`.
- Jika AI ragu suatu fitur masuk MVP lomba atau bukan → cek `05_FEATURE_SPEC.md` kolom "Paket/Tahap".

## Status Dokumen

Dokumen ini adalah **turunan interpretatif** dari proposal lomba (yang sifatnya naratif/akademis) menjadi format PRD teknis yang lebih actionable. Beberapa detail (nama kolom tabel, endpoint, state machine status pesanan, dsb.) **belum ada di proposal asli dan ditambahkan sebagai asumsi desain yang masuk akal** berdasarkan requirement yang disebutkan — bagian-bagian ini ditandai dengan catatan `(Asumsi desain)` agar mudah dikenali dan divalidasi ulang oleh tim sebelum dikerjakan.

## Ringkasan Satu Paragraf

RestoLink adalah platform web **multi-tenant** yang memungkinkan UMKM kuliner (skala mikro/kecil/menengah) memiliki website menu digital sendiri (via subdomain) tanpa perlu membangun website sendiri, sekaligus mengelola menu, harga, ketersediaan, dan pesanan dari satu dashboard. Versi untuk lomba (MVP) mencakup: registrasi pemilik → pemilihan paket → pembayaran via Midtrans → aktivasi tenant & subdomain → pengelolaan kategori/menu → website publik tenant → alur pemesanan sederhana → dashboard admin platform. Stack: Vite + Svelte + TypeScript (frontend), Supabase (DB, Auth, RLS), Cloudflare R2 (gambar), Midtrans (pembayaran), Vercel (hosting + wildcard subdomain), Gemini API (chatbot — hanya di landing page utama platform, bukan di website tenant).
