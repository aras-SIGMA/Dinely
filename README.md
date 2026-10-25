# RestoLink

> Platform web multi-tenant untuk UMKM kuliner: website menu digital mandiri per-tenant via subdomain dinamis, dashboard pengelolaan terpusat, dan alur pemesanan sederhana.

---

## 🚀 Panduan Memulai (Setup untuk Anggota Tim)

Setelah melakukan `git clone`, ikuti langkah berikut agar proyek berjalan tanpa error di komputer lokal:

### 1. Prasyarat
* **Node.js**: Versi 20.x atau 22.x LTS ([Download Node.js](https://nodejs.org/))
* **Git**

### 2. Instalasi Package / Dependencies
Folder `node_modules` tidak disertakan di Git. Jalankan perintah ini di root folder proyek:

```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:

* **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
* **Linux / Mac / Git Bash**:
  ```bash
  cp .env.example .env
  ```

Buka file `.env` dan isi kredensial proyek (tanyakan nilai kredensial Supabase/Midtrans/R2 ke lead/koordinator tim).

### 4. Menjalankan Aplikasi (Development)
```bash
npm run dev
```
Buka browser di [http://localhost:5173](http://localhost:5173).

Untuk menguji website tenant secara lokal di browser, akses melalui subdomain localhost:
* [http://dapur-nia.localhost:5173](http://dapur-nia.localhost:5173)

### 5. Script Penting Lainnya
* `npm run check` : Memeriksa error tipe data TypeScript dan Svelte tanpa build.
* `npm run build` : Mengompilasi aplikasi untuk mode produksi.

---

## 📂 Struktur & Pembagian Kode

Proyek ini menggunakan arsitektur **Single Unified Repo** yang memisahkan Frontend dan Backend:

```
restolink/
├── docs/                      # Dokumentasi PRD, arsitektur, & notulen keputusan
│   ├── product/               # PRD, user flows, database schema, & feature spec
│   └── notulen/               # Catatan keputusan teknis tim
│
├── src/                       # FRONTEND (Svelte 5 + Tailwind v4 + sv-router)
│   ├── apps/
│   │   ├── landing/           # Website publik RestoLink (Beranda, Fitur, Harga)
│   │   ├── dashboard/         # Dashboard Pemilik Usaha (Kelola Menu, Pesanan)
│   │   ├── admin/             # Dashboard Admin Platform (Audit, Override)
│   │   └── tenant-site/       # Website Menu Publik Tenant (Katalog, Checkout)
│   ├── components/ui/         # Komponen UI atomik (Button, Input, Modal, Badge)
│   ├── lib/                   # Shared utilities (Tenant resolver, Supabase client, Auth)
│   ├── stores/                # State management Svelte 5 (Auth, Cart, Orders)
│   └── types/                 # Shared TypeScript interfaces
│
├── api/                       # BACKEND (Vercel Serverless Functions / Node.js)
│   ├── midtrans/              # Endpoint create transaction & webhook validator
│   ├── r2/                    # Presigned PUT URL generator Cloudflare R2
│   └── gemini/                # Proxy AI chatbot landing page
│
├── supabase/                  # DATABASE POSTGRES & KEAMANAN
│   ├── migrations/            # File SQL skema tabel, RLS policies, & RPC
│   └── seed.sql               # Data katalog paket & akun admin perdana
│
└── vercel.json                # Konfigurasi SPA rewrite & wildcard subdomain
```

---

## 🌿 Aturan Git Workflow Tim

Agar kolaborasi tim rapi dan tidak terjadi konflik kode (*merge conflict*), patuhi aturan branch berikut:

1. **`main`**:
   * Khusus rilis stabil produksi.
   * **DILARANG** melakukan commit langsung ke `main`.
2. **`develop`**:
   * Branch integrasi utama. Semua pengerjaan fitur digabung ke sini.
3. **`feature/<nama-fitur>`**:
   * Setiap anggota tim yang mengerjakan tugas baru **wajib** membuat branch baru dari `develop`.
   * Contoh penamaan branch:
     * `feature/database-schema-and-rls`
     * `feature/subdomain-resolver`
     * `feature/auth-and-registration`
     * `feature/midtrans-payment`
     * `feature/menu-and-r2-upload`
     * `feature/tenant-site-and-order`
     * `feature/order-management`
     * `feature/admin-and-landing`

### Alur Pengerjaan Fitur Baru:
```bash
# 1. Pastikan branch develop lokal adalah yang terbaru
git checkout develop
git pull origin develop

# 2. Buat branch baru untuk fitur yang dikerjakan
git checkout -b feature/nama-fitur-kamu

# 3. Kerjakan kode, lalu simpan perubahan
git add .
git commit -m "feat: deskripsi singkat perubahan yang dibuat"

# 4. Push branch fitur ke GitHub
git push -u origin feature/nama-fitur-kamu

# 5. Buat Pull Request (PR) ke branch develop di GitHub untuk di-review
```

---

## 📖 Dokumentasi Lengkap
* `docs/MILESTONES.md` : **Roadmap & Checklist Milestone Tim (M0–M9)**.
* `docs/product/01_PRD.md` : Scope MVP Lomba vs Fitur Lanjutan.
* `docs/product/02_ARCHITECTURE.md` : Arsitektur teknis, resolusi subdomain, & alur keamanan pembayaran.
* `docs/product/03_DATABASE_SCHEMA.md` : Skema tabel Postgres & pola Row Level Security (RLS).
* `docs/product/04_USER_FLOWS.md` : Alur langkah demi langkah tiap peran & checklist UAT.
* `docs/product/05_FEATURE_SPEC.md` : Kriteria penerimaan (*acceptance criteria*) tiap modul.
