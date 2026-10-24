# Notulen 01: Arsitektur, Struktur Folder & Mitigasi Risiko

Tanggal: 24 Oktober 2026
Status: Disetujui

---

## 1. Keputusan Arsitektur & Stack Teknis
* **Frontend Framework**: Svelte 5 (menggunakan Runes: `$state`, `$derived`).
* **Router**: `svelte-spa-router`.
* **Styling**: Hybrid Tailwind CSS v4 + Scoped CSS Svelte (`<style>`) + CSS Variables untuk dynamic theming website tenant.
* **Warna Tema Utama**: Oranye Kuliner (`#ea580c`) + Slate Netral. Warna aksen per tenant dikontrol dinamis via CSS variable.
* **Backend Serverless**: Vercel Serverless Functions (`api/` berbasis Node.js/TypeScript).
* **Database & Autentikasi**: Supabase Postgres + Supabase Auth (Anon key di browser, Service Role key di endpoint serverless).
* **Storage Gambar**: Cloudflare R2 via Presigned PUT URL (dengan fallback sementara Supabase Storage bila diperlukan).
* **Payment Gateway**: Midtrans (Snap API + webhook verification server-side).

---

## 2. Struktur Direktori Terpilih (Single Unified Structure)
Aplikasi dibangun dalam satu repositori terpadu yang memisahkan konteks eksekusi:

```
restolink/
├── docs/                               # Dokumentasi & Arsip
│   ├── product/                        # PRD, Architecture, DB Schema (00–05)
│   └── notulen/                        # Catatan keputusan teknis
├── api/                                # Backend Serverless (Vercel Node.js/TS)
│   ├── midtrans/
│   │   ├── create.ts                   # Endpoint buat token Snap
│   │   └── webhook.ts                  # Verifikasi SHA-512 & aktivasi tenant
│   ├── r2/
│   │   └── sign-upload.ts              # Presigned PUT URL Cloudflare R2
│   └── gemini/
│       └── chat.ts                     # Proxy Gemini API
├── supabase/                           # Database & SQL Engine
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # DDL tabel & enum
│   │   ├── 002_rls_policies.sql        # Policy isolasi data tenant
│   │   ├── 003_order_rpc.sql           # Stored procedure guest order
│   │   └── 004_triggers.sql            # Sync user auth -> profile
│   └── seed.sql                        # Katalog paket Mikro & data awal
├── src/                                # Frontend (Svelte 5 + Tailwind v4)
│   ├── main.ts                         # Entry point Vite
│   ├── App.svelte                      # Root Dispatcher (Cek Hostname Subdomain)
│   ├── app.css                         # Tailwind CSS & Variabel Tema
│   ├── apps/                           # 4 Modul Pengguna (Terisolasi)
│   │   ├── landing/                    # Public Platform (Beranda, Pricing, FAQ)
│   │   ├── dashboard/                  # Dashboard Pemilik Usaha (Kelola Menu, Pesanan)
│   │   ├── admin/                      # Dashboard Admin Platform (Audit, Override)
│   │   └── tenant-site/                # Website Menu Publik Tenant (Katalog, Checkout)
│   ├── components/ui/                  # Komponen Atomik Reusable
│   ├── lib/                            # Shared Utilities & Helpers (Resolver, Compressor, Auth)
│   ├── stores/                         # Global State (Svelte 5 Runes)
│   └── types/                          # Shared TypeScript Interfaces
├── public/                             # Asset statis publik
├── vercel.json                         # Konfigurasi rewrite SPA & wildcard subdomain
├── vite.config.ts                      # Config build & path alias (@/ -> src/)
├── tsconfig.json                       # Config TypeScript
└── package.json
```

---

## 3. Catatan Implementasi & Mitigasi Risiko Kritis
1. **Bundle Bloat Prevention (Lazy Loading)**:
   * Pada `App.svelte`, load modul `tenant-site`, `dashboard`, `admin`, dan `landing` secara asynchronous/dynamic import agar bundle browser terpisah rapi dan ringan di mobile.
2. **Shared Types TS Engine**:
   * Konfigurasi path alias `@/*` di `tsconfig.json` dan `vite.config.ts` agar interface database dapat diakses bersama oleh frontend (`src/`) dan serverless (`api/`).
3. **Webhook Cold Start & Idempotency**:
   * Endpoint `api/midtrans/webhook.ts` menggunakan native Node.js `crypto` tanpa dependency berat untuk mempercepat eksekusi cold start.
   * Cek status transaksi sebelum memproses event Midtrans untuk mencegah duplikasi aktivasi tenant jika webhook dikirim berulang kali.
4. **SPA 404 Rewrite**:
   * `vercel.json` dikonfigurasi sejak awal dengan rewrite rule `/(.*) -> /index.html` agar tidak memicu error 404 saat pengguna me-refresh halaman subdomain.
