# Arsitektur Teknis — Dinely

> Baca `01_PRD.md` dulu untuk konteks produk. Dokumen ini fokus ke *bagaimana* sistem dibangun.

---

## 1. Stack Teknologi

| Lapisan | Teknologi | Fungsi |
|---------|-----------|--------|
| Build tool & Frontend | **Vite + Svelte + TypeScript**, routing berbasis Svelte | Landing page, dashboard (SPA), website publik tenant |
| Database & Backend | **Supabase** (Postgres) | Data relasional, business logic via RPC/Edge Functions bila perlu |
| Autentikasi | **Supabase Auth** | Registrasi & login Pemilik Usaha dan Admin Platform |
| Isolasi Data | **Supabase Row Level Security (RLS)** | Memastikan satu tenant tidak bisa akses data tenant lain |
| Penyimpanan Gambar | **Cloudinary** (format WebP) | Logo usaha, foto menu — dikompresi sebelum upload untuk hemat storage |
| Payment Gateway | **Midtrans** | Pembayaran paket langganan (bukan pembayaran pesanan pembeli) |
| Hosting & Domain | **Vercel** (dengan wildcard subdomain) | Deployment aplikasi + routing `*.dinely.site` |
| Chatbot AI | **Google Gemini API** | Hanya di landing page utama platform |

> Catatan penting: frontend **tidak memakai server-side rendering** (bukan Next.js dsb.), sehingga resolusi tenant berdasarkan subdomain dilakukan **di sisi klien saat runtime** — lihat Bagian 4.

---

## 2. Struktur Proyek (Tiga Bagian dalam Satu Vite Project)

Proposal menyebutkan platform terdiri dari **tiga bagian** yang dibangun dalam satu proyek Vite:

### 2.1 Landing Page Utama Platform
- Halaman pemasaran Dinely: beranda, fitur, harga, pendaftaran.
- Pakai routing berbasis Svelte → **setiap halaman punya URL/rute sendiri** seperti website multi-halaman biasa (bukan SPA tunggal).
- Alasan: agar mesin pencari bisa mengindeks tiap halaman secara terpisah (SEO untuk marketing).
- Satu-satunya tempat chatbot AI (Gemini) muncul.

### 2.2 Dashboard Pengelolaan (Pemilik Usaha & Admin Platform)
- **Single Page Application (SPA)** dengan rute terproteksi (protected routes).
- Butuh autentikasi (Supabase Auth) — redirect ke login bila belum authenticated.
- Dua varian dashboard dengan akses berbeda:
  - Dashboard Pemilik Usaha (scoped ke tenant miliknya, dibatasi RLS)
  - Dashboard Admin Platform (akses lintas-tenant, role khusus)

### 2.3 Website Publik Tenant
- Halaman menu digital tiap usaha, diakses lewat subdomain masing-masing (`{slug}.dinely.site`).
- **Diselesaikan secara runtime di client** berdasarkan subdomain yang diakses (lihat Bagian 4) — bukan hasil build terpisah per tenant.
- Satu kode frontend yang sama melayani **semua** tenant.

```
dinely/                      (satu Vite project)
├── apps / src/
│   ├── landing/                 # 2.1 — multi-page marketing site
│   ├── dashboard/                # 2.2 — SPA, protected routes
│   └── tenant-site/              # 2.3 — resolved by subdomain at runtime
├── lib/
│   ├── supabase-client.ts
│   ├── tenant-resolver.ts        # logic resolusi subdomain (lihat bag. 4)
│   └── midtrans.ts
└── ...
```

> *(Struktur folder di atas adalah asumsi desain berdasarkan requirement proposal, bukan struktur literal dari dokumen asli — sesuaikan dengan konvensi tim.)*

---

## 3. Mengapa Tiga Bagian dalam Satu Proyek?

Karena satu aplikasi front-end yang sama bisa melayani seluruh tenant tanpa perlu dikompilasi ulang untuk tiap usaha. Trade-off yang perlu dipahami tim:

- **Kelebihan**: deployment & maintenance sangat efisien — perbaikan bug sekali deploy, berlaku untuk semua tenant.
- **Trade-off yang disadari sejak awal (disebutkan eksplisit di proposal)**: konten halaman tenant dirender di sisi klien (client-side rendering), sehingga mesin pencari membaca halaman lebih lambat dibanding pendekatan server-side rendering. Ini **diterima secara sadar** untuk versi awal karena prioritas produk adalah kemudahan pengelolaan menu & pemesanan, bukan optimasi SEO per-tenant. Landing page utama tetap SEO-friendly karena pakai routing multi-halaman.

---

## 4. Resolusi Tenant Berdasarkan Subdomain (Client-Side)

Ini adalah bagian arsitektur paling kritis dan unik dari Dinely — implementasikan persis sesuai alur berikut:

```
1. Aplikasi dimuat di browser pembeli, mis. URL = https://dapur-nia.dinely.site
2. Baca hostname dari browser: window.location.hostname
   → "dapur-nia.dinely.site"
3. Ekstrak bagian subdomain sebagai slug tenant:
   → slug = "dapur-nia"
4. Query ke Supabase: cari baris pada tabel `tenants`
   WHERE subdomain = slug
   (sertakan join/kategori & menu terkait)
5. Selama data belum diterima → tampilkan skeleton/loading state
   (JANGAN tampilkan halaman kosong)
6. Jika slug TIDAK ditemukan di tabel tenants,
   ATAU status tenant tidak aktif:
   → tampilkan halaman "usaha tidak ditemukan"
   (JANGAN fallback ke data tenant lain)
7. Data & akses tetap dibatasi RLS di Supabase:
   klien hanya bisa membaca data milik tenant sesuai subdomain yang diminta
```

### Catatan implementasi penting

- **Domain wildcard** (`*.dinely.site`) dikonfigurasi di level proyek Vercel, terlepas dari framework frontend yang dipakai.
- Resolusi ini **tidak bisa** mengandalkan middleware server (seperti di Next.js) karena arsitektur ini murni client-rendered via Vite — jangan desain solusi yang butuh server-side middleware untuk membaca subdomain.
- RLS di Supabase adalah **garis pertahanan terakhir** — jangan andalkan filter di frontend saja sebagai satu-satunya proteksi data antar-tenant. Bahkan jika ada bug di `tenant-resolver.ts`, query ke Supabase harus tetap gagal/kosong untuk data yang bukan milik tenant yang diminta.
- Untuk lingkungan development lokal, siapkan strategi testing subdomain (mis. `*.localhost` atau `/etc/hosts` mapping) karena `window.location.hostname` tidak akan berupa subdomain asli saat development biasa.

---

## 5. Alur Pembayaran & Aktivasi (Arsitektur Keamanan)

Prinsip yang **wajib** dipegang: **aktivasi tenant/paket hanya boleh terjadi dari hasil validasi server terhadap notifikasi Midtrans — tidak boleh dari redirect browser.**

```
[Client] Pemilik pilih paket
      → [Server] buat transaksi Midtrans, simpan status "pending"
      → [Midtrans] proses pembayaran (Snap/redirect, sesuai metode)
      → [Midtrans] kirim webhook/notifikasi ke endpoint server Dinely
      → [Server] validasi signature & status notifikasi dari Midtrans
      → [Server] jika valid & status settlement/capture → update transaksi
         → aktifkan paket & tenant di database
      → [Client] polling atau subscribe status transaksi untuk menampilkan
         hasil (sukses/pending/gagal) ke pemilik
```

- Endpoint penerima webhook Midtrans **harus** di sisi server (Supabase Edge Function atau API route terpisah) — tidak bisa dilakukan murni di client karena butuh memverifikasi signature dengan server key Midtrans yang rahasia.
- Halaman "pembayaran berhasil" di browser hanya UI feedback, **bukan** pemicu aktivasi.
- Skenario yang wajib ditangani: sukses, pending, gagal/expired, dan notifikasi datang lebih dari sekali (idempotency).

---

## 6. Diagram Konteks Sistem (Tekstual)

```
                    ┌──────────────────────┐
                    │   Landing Page (SEO)   │ ← calon Pemilik Usaha
                    │  + Chatbot AI (Gemini) │
                    └───────────┬────────────┘
                                │ daftar / pilih paket
                                ▼
┌───────────────┐      ┌──────────────────┐       ┌───────────────┐
│ Admin Platform │◄────►│   Supabase (DB,   │◄─────►│ Dashboard SPA │
│   Dashboard    │      │  Auth, RLS, RPC)  │       │ (Pemilik Usaha)│
└───────────────┘      └─────────┬─────────┘       └───────┬────────┘
                                  │                          │ kelola menu/pesanan
                     ┌────────────┴────────────┐             │
                     │                         │             ▼
             ┌───────▼───────┐        ┌────────▼───────┐  ┌──────────────────┐
             │   Cloudinary    │        │    Midtrans     │  │ Website Publik    │
             │ (gambar menu,  │        │ (pembayaran     │  │ Tenant (subdomain)│
             │  logo — WebP)  │        │  paket, webhook)│  │ ← Pembeli         │
             └────────────────┘        └─────────────────┘  └──────────────────┘

Semua di-deploy & di-route lewat Vercel (termasuk wildcard subdomain).
```

---

## 7. Keamanan & Isolasi Data — Checklist Arsitektural

- [ ] Setiap tabel yang menyimpan data milik tenant **wajib** punya kolom `tenant_id` dan RLS policy yang memfilter berdasarkan `auth.uid()` → kepemilikan tenant.
- [ ] Query dari website publik tenant (anon/public role) hanya boleh `SELECT` data tenant **aktif**, dan hanya kolom yang memang untuk publik (jangan expose data internal seperti kontak admin, catatan biaya, dsb.).
- [ ] Webhook Midtrans divalidasi signature-nya di server sebelum dipercaya.
- [ ] Role Admin Platform punya policy RLS terpisah yang eksplisit mengizinkan akses lintas-tenant — jangan pakai service role key di client manapun.
- [ ] Upload gambar ke Cloudinary dibatasi ukuran & tipe file, dan dikompresi ke WebP sebelum/pada saat upload.

---

## 8. Dokumen Terkait

- Requirement produk → `01_PRD.md`
- Skema tabel detail → `03_DATABASE_SCHEMA.md`
- Alur yang memakai arsitektur ini → `04_USER_FLOWS.md`
