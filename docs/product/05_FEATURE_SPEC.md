# Feature Spec — RestoLink

> Setiap fitur diberi label **[MVP Lomba]** atau **[Lanjutan]** sesuai `01_PRD.md` bag. 5. Kerjakan **[MVP Lomba]** dulu secara penuh sebelum menyentuh fitur **[Lanjutan]** — tapi desain skema/arsitektur tetap mempertimbangkan fitur lanjutan (NFR-08) seperti sudah dibahas di `02_ARCHITECTURE.md` dan `03_DATABASE_SCHEMA.md`.

---

## A. Landing Page Platform `[MVP Lomba]`

### A1. Halaman Pemasaran (beranda, fitur, harga)
- Multi-halaman dengan URL terpisah (routing berbasis Svelte).
- **AC**: setiap halaman (beranda/fitur/harga/pendaftaran) punya URL unik dan bisa diakses langsung (direct link), bukan hanya via navigasi internal.

### A2. Chatbot AI (Gemini API)
- Hanya muncul di landing page utama platform.
- Menjawab pertanyaan calon pengguna tentang: fitur RestoLink, paket layanan, proses pendaftaran, cara kerja platform.
- **Eksplisit TIDAK tersedia** di website publik tenant, dan **bukan** add-on tenant.
- **AC**:
  - [ ] Chatbot widget hanya render di route landing page, tidak pernah render di dashboard atau tenant-site.
  - [ ] Chatbot bisa menjawab minimal 3 kategori pertanyaan: fitur, paket/harga, cara daftar.
  - [ ] Ada fallback response yang sopan bila pertanyaan di luar topik RestoLink.

---

## B. Registrasi & Autentikasi `[MVP Lomba]`

### B1. Registrasi Pemilik Usaha
- **AC**:
  - [ ] Form mengumpulkan: email/password (atau metode Supabase Auth lain), nama pemilik, nama usaha, subdomain yang diinginkan.
  - [ ] Validasi subdomain real-time (unique, format valid, bukan reserved word).
  - [ ] Setelah submit, baris `profiles` + `tenants` (`status: pending`) terbuat.

### B2. Login (Pemilik Usaha & Admin Platform)
- **AC**:
  - [ ] Pemilik login → diarahkan ke Dashboard Pemilik.
  - [ ] Admin login → diarahkan ke Dashboard Admin Platform.
  - [ ] Salah role/akses → ditolak dengan pesan jelas (bukan silent fail).

---

## C. Pemilihan Paket & Pembayaran `[MVP Lomba — Paket Mikro saja]`

### C1. Halaman Pilihan Paket
- **AC**: Paket Mikro ditampilkan dengan harga & fitur yang jelas, trial 30 hari disebutkan eksplisit. *(Paket Kecil & Menengah boleh ditampilkan sebagai "segera hadir" di UI meski belum fungsional — sesuai roadmap.)*

### C2. Pembayaran via Midtrans
- **AC**:
  - [ ] Transaksi dibuat di server (bukan langsung dari client ke Midtrans).
  - [ ] Server memvalidasi webhook Midtrans sebelum mengaktifkan apa pun (lihat `02_ARCHITECTURE.md` bag. 5 — **ini acceptance criteria paling kritis di seluruh sistem**).
  - [ ] Skenario sukses, pending, dan gagal semuanya diuji di sandbox Midtrans sebelum demo.
  - [ ] Idempotent: notifikasi Midtrans yang datang dua kali tidak mengaktifkan tenant dua kali atau menyebabkan error.

### C3. Aktivasi Tenant & Subdomain
- **AC**:
  - [ ] `tenants.status` berubah dari `pending` → `active`/`trial` hanya setelah C2 tervalidasi.
  - [ ] Setelah aktif, subdomain tenant langsung bisa diakses publik (tanpa perlu redeploy).

---

## D. Pengelolaan Kategori & Menu `[MVP Lomba]`

### D1. CRUD Kategori
- **AC**: Pemilik bisa tambah/ubah/hapus kategori; urutan tampil bisa diatur.

### D2. CRUD Menu
- **AC**:
  - [ ] Field: nama, deskripsi, harga, foto, kategori, status ketersediaan.
  - [ ] Upload foto dikompresi ke WebP sebelum disimpan ke Cloudinary.
  - [ ] Toggle ketersediaan (`is_available`) langsung memengaruhi tampilan di website publik.
  - [ ] Hanya pemilik tenant terkait yang bisa CRUD menu tenant tersebut (verifikasi RLS, bukan hanya UI guard).

---

## E. Website Publik Tenant (Satu Template) `[MVP Lomba]`

### E1. Resolusi Subdomain
- Lihat `02_ARCHITECTURE.md` bag. 4 untuk logika lengkap.
- **AC**: lihat checklist UAT di `04_USER_FLOWS.md` bag. 7.

### E2. Tampilan Menu Publik
- **AC**:
  - [ ] Menampilkan profil usaha (nama, logo, deskripsi, kontak).
  - [ ] Menampilkan kategori & menu dengan harga & status ketersediaan.
  - [ ] Responsif di mobile & desktop (NFR-04).
  - [ ] Hanya menampilkan data tenant berstatus `active`/`trial`.

---

## F. Pemesanan Sederhana `[MVP Lomba]`

### F1. Buat Pesanan (Pembeli, tanpa akun)
- **AC**:
  - [ ] Pembeli bisa pilih menu + jumlah + catatan, isi nama (wajib) dan kontak (opsional).
  - [ ] Validasi ketersediaan menu ulang di server saat submit (lihat `04_USER_FLOWS.md` bag. 2 edge case).
  - [ ] Setelah submit, pembeli menerima `order_code` sebagai bukti/pelacakan.

### F2. Kelola Pesanan (Pemilik)
- **AC**:
  - [ ] Dashboard menampilkan daftar pesanan masuk real-time/near-real-time, difilter per status.
  - [ ] Pemilik bisa update status: `baru → diproses → selesai` (minimal 3 status, sesuai FR-09).
  - [ ] Riwayat pesanan tetap menampilkan nama & harga menu *seperti saat pesanan dibuat*, meski menu itu kemudian diubah/dihapus (pakai snapshot, lihat `03_DATABASE_SCHEMA.md` bag. 10).

---

## G. Dashboard Admin Platform `[MVP Lomba]`

### G1. Monitoring Pendaftaran & Pembayaran
- **AC**: Admin bisa lihat daftar tenant, status masing-masing (`pending/active/trial/suspended/expired`), dan riwayat transaksi.

### G2. Bantuan Aktivasi
- **AC**: Admin bisa melihat detail transaksi bermasalah dan (dengan audit trail) melakukan override status bila diperlukan untuk membantu pemilik yang mengalami kendala teknis.

---

## H. Fitur Staff UMKM `[Lanjutan — di luar MVP lomba]`

- Melihat pesanan sesuai akses dari pemilik.
- Memperbarui status pesanan.
- Melihat menu & promo yang berlaku.
- Role turunan: Koki, Pelayan, Pengelola Stok — masing-masing dengan tampilan & akses sendiri.
- **Catatan desain**: skema `staff_members` sudah disiapkan di `03_DATABASE_SCHEMA.md` bag. 11 agar fitur ini bisa ditambahkan tanpa mengubah struktur inti (NFR-08).

---

## I. Add-on Tenant `[Lanjutan — di luar MVP lomba]`

| Add-on | Deskripsi Singkat |
|--------|---------------------|
| Custom Domain | Tenant bisa pakai domain sendiri, bukan hanya subdomain platform |
| Laporan Lanjutan | Analytics penjualan/pesanan lebih dalam |
| Multi-Cabang | Satu akun pemilik mengelola beberapa lokasi/cabang |
| Promo & Voucher | Diskon/kode promo untuk pembeli |
| Notifikasi WhatsApp | Notifikasi pesanan masuk/status via WhatsApp |

- Add-on dibeli terpisah dari paket utama, bisa dikombinasikan bebas.
- **Chatbot AI bukan bagian dari add-on ini** — sudah final diputuskan sebagai fitur platform-level only (lihat `perubahan_yang_diterapkan` di proposal asli).

---

## J. Fitur Operasional Menengah `[Lanjutan — di luar MVP lomba]`

- Pengelolaan meja (table management).
- Koordinasi dapur (kitchen display / status masak).
- Pengelolaan stok/inventori detail.
- Laporan operasional lanjutan untuk skala Menengah.

---

## K. Matriks Fitur × Paket (Ringkasan)

| Fitur | Mikro | Kecil (lanjutan) | Menengah (lanjutan) |
|-------|:---:|:---:|:---:|
| Website publik (1 template) | ✅ | ✅ | ✅ |
| Dashboard profil/menu | ✅ | ✅ | ✅ |
| Pemesanan sederhana | ✅ | ✅ | ✅ |
| Akses Staff | ❌ | ✅ | ✅ |
| Promo dasar | ❌ | ✅ | ✅ |
| Peran Koki/Pelayan/Stok | ❌ | ❌ | ✅ |
| Pengelolaan meja | ❌ | ❌ | ✅ |
| Laporan lanjutan | ❌ | ❌ | ✅ |
| Multi-cabang | ❌ (add-on) | ❌ (add-on) | ❌ (add-on) |
| Custom domain | ❌ (add-on) | ❌ (add-on) | ❌ (add-on) |

> Implementasikan sebagai `feature_flags` (jsonb) di tabel `packages` (lihat `03_DATABASE_SCHEMA.md` bag. 4) agar feature-gating (FR-11) bisa dicek secara konsisten di seluruh dashboard tanpa hardcode per-fitur.

---

## L. Dokumen Terkait

- Requirement sumber → `01_PRD.md`
- Implementasi teknis fitur → `02_ARCHITECTURE.md`
- Tabel yang dipakai tiap fitur → `03_DATABASE_SCHEMA.md`
- Alur step-by-step tiap fitur → `04_USER_FLOWS.md`
