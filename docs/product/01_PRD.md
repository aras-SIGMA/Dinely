# Product Requirements Document (PRD) — Dinely

> Sumber: *Proposal Lomba GTNIC 2026 — Perancangan dan Pembuatan Platform Dinely Berbasis Web*, Tim Kepiting Purba, SMK Taruna Bhakti.
> Dokumen ini adalah turunan teknis dari proposal tersebut, ditulis agar bisa langsung dipakai sebagai konteks pengembangan.

---

## 1. Ringkasan Produk

**Dinely** adalah platform web multi-tenant yang menjadi "pusat kendali tunggal" bagi UMKM kuliner (kedai makan, kafe kecil, katering rumahan, dsb.) untuk:

1. Memiliki **website menu digital sendiri** (via subdomain, misal `dapur-nia.dinely.site`) tanpa perlu membangun website dari nol.
2. Mengelola **profil usaha, kategori, menu, harga, dan ketersediaan** dari satu dashboard.
3. Menerima dan mencatat **pesanan** secara terstruktur (tidak lagi tercecer di WhatsApp/nota kertas).
4. Membayar **langganan paket** secara digital dan otomatis teraktivasi.

Platform ini melayani banyak usaha (tenant) dari **satu basis kode aplikasi** — bukan satu instance per usaha.

---

## 2. Latar Belakang & Masalah

### 2.1 Konteks

UMKM kuliner Indonesia melayani pesanan dari banyak kanal sekaligus (medsos, WhatsApp, buku menu meja, nota kertas) tanpa sistem yang saling terhubung. Berdasarkan data yang dikutip proposal:

- 95,17% pelaku usaha menggunakan aplikasi perpesanan untuk berdagang daring.
- 60–70% masih mengandalkan pencatatan manual (buku kas/nota kertas).
- Ketiadaan sistem terpadu → tingkat **galat pesanan dan stok hingga 10%**.
- **45% pesan masuk** hanya berisi pertanyaan berulang soal harga/ketersediaan menu.
- Keterlambatan membalas pesan **5–30 menit** saat jam sibuk bisa menghilangkan hingga **72% potensi penjualan**.

### 2.2 Masalah Inti yang Diselesaikan

| # | Masalah | Dampak |
|---|---------|--------|
| M1 | Perubahan menu/harga harus diperbarui di banyak media sekaligus | Informasi tidak konsisten, boros waktu pemilik |
| M2 | UMKM mikro sulit membuat & merawat website sendiri (biaya/waktu/skill) | Tidak punya kanal digital mandiri |
| M3 | Pesanan dari berbagai kanal sulit dicatat & dilacak statusnya seragam | Pesanan tercecer, galat tinggi |
| M4 | Usaha yang lebih besar butuh pembagian peran (dapur, pelayan, stok) | Koordinasi operasional tidak terstruktur |
| M5 | Pemilik sulit memantau kondisi menu/pesanan/aktivitas dari satu tempat | Tidak ada visibilitas terpusat |

---

## 3. Tujuan Sistem

1. Memudahkan UMKM kuliner memiliki website usaha tanpa membangun sendiri.
2. Menyediakan satu tempat untuk memperbarui profil, menu, harga, dan ketersediaan produk.
3. Membantu pelanggan memperoleh informasi usaha & menu terbaru dengan mudah.
4. Membantu pemilik mencatat dan memantau pesanan secara lebih teratur.
5. Mendukung pembagian akses bagi staf ketika usaha membutuhkannya *(pengembangan lanjutan, di luar MVP lomba)*.
6. Menyediakan fitur yang dapat berkembang mengikuti kompleksitas operasional usaha (lewat sistem paket bertingkat).

### 3.1 Non-Tujuan (Eksplisit Disebutkan dalam Proposal)

- Sistem **tidak menjamin peningkatan penjualan**. Keberhasilan diukur dari: kemudahan update informasi, keteraturan pencatatan pesanan, kemudahan pemantauan usaha — bukan metrik penjualan.

---

## 4. Target Pengguna & Peran (Roles)

Sistem memiliki **4 jenis pengguna**:

### 4.1 Admin Platform
Mengelola layanan secara keseluruhan: data pengguna & usaha, paket, status pembayaran, serta membantu penanganan masalah aktivasi website/akun. **Satu Admin Platform mengelola seluruh tenant**, bukan per-tenant.

### 4.2 Pemilik Usaha (Tenant Owner)
Pelaku UMKM kuliner yang: mendaftar → mengisi info usaha → memilih paket → membayar langganan. Mengelola profil, kategori, menu, harga, ketersediaan, tampilan dasar website, dan pesanan. Pada paket yang mendukung, juga bisa mengelola staf & hak aksesnya *(lanjutan)*.

### 4.3 Staff UMKM *(Pengembangan Lanjutan — di luar scope MVP lomba)*
Membantu operasional sesuai akses yang diberikan pemilik (lihat pesanan, update status pesanan, lihat menu/promo). Role lanjutan di masa depan: Koki, Pelayan, Pengelola Stok — masing-masing dengan tampilan & akses sesuai tanggung jawab.

### 4.4 Pembeli (Buyer / Guest)
Mengunjungi website tenant untuk melihat profil, menu, harga, ketersediaan. Bisa membuat pesanan bila fitur pemesanan aktif. **Tidak wajib punya akun** — proposal tidak menyebutkan Pembeli melakukan registrasi/login, sehingga alur pemesanan untuk versi lomba diasumsikan berbasis guest checkout *(Asumsi desain — validasi ulang bila tim ingin menambah akun pembeli)*.

### 4.5 Segmentasi Berdasarkan Skala Usaha

> Catatan dari proposal: ini adalah **segmentasi kebutuhan produk**, bukan klasifikasi hukum UMKM.

| Skala | Contoh | Masalah Utama | Fokus Solusi |
|-------|--------|----------------|----------------|
| Mikro | Dapur Nia (kue rumahan) | Pemilik kerja sendirian; info menu & pesanan tersebar; waktu terbatas | Website menu + pengelolaan sederhana |
| Kecil | Kedai Ayam Bakar | Dibantu beberapa staf; menu/promo/pesanan perlu dikelola bersama | Dashboard pesanan + akses Staff |
| Menengah | Rumah Makan Sari Rasa | Ada pemilik, pelayan, koki, petugas stok; koordinasi pesanan-meja-dapur-stok rumit | Alur operasional + akses berbasis peran |

---

## 5. Scope

### 5.1 Dalam Scope — Versi Lomba (MVP)

Proposal secara eksplisit mencakup hal-hal berikut untuk versi lomba:

- Registrasi pemilik usaha
- Pengisian profil usaha
- Paket dasar (paket **Mikro**)
- Pembayaran via **Midtrans**
- Aktivasi tenant
- Subdomain platform (mis. `namausaha.dinely.site`)
- **Satu** template website publik tenant
- Pengelolaan kategori dan menu
- Dashboard Pemilik Usaha
- Alur pemesanan sederhana (oleh Pembeli)
- Chatbot AI — **hanya** di landing page utama platform (Gemini API)
- Dashboard Admin Platform (lihat pendaftaran, usaha, paket, status pembayaran)

### 5.2 Di Luar Scope — Pengembangan Lanjutan (bukan untuk versi lomba)

- Role operasional khusus: Koki, Pelayan, Pengelola Stok
- Pengelolaan Staff & hak akses granular
- Pengelolaan meja (table management)
- Inventori/stok detail
- Multi-cabang
- Laporan lanjutan (analytics)
- Aplikasi mobile (Android/iOS) — sistem murni web
- Custom domain milik sendiri (versi awal hanya subdomain platform)
- Pilihan template website lebih dari satu
- Pembayaran pesanan pembeli ke usaha lewat platform (Midtrans di versi awal **hanya** untuk pembayaran langganan paket, bukan transaksi pesanan pembeli)
- Promosi & pemasaran
- Pengiriman pesanan (delivery/logistics)
- Pembukuan/akuntansi lengkap
- Pengadaan bahan baku
- Integrasi marketplace atau mesin kasir eksternal
- Chatbot AI di website tenant (chatbot hanya untuk landing page utama platform, bukan add-on tenant)

---

## 6. Functional Requirements (FR)

| ID | Requirement |
|----|-------------|
| FR-01 | Sistem menyediakan registrasi & login untuk Pemilik Usaha dan Admin Platform |
| FR-02 | Pemilik dapat mengisi dan mengubah profil usaha (nama, logo, foto, kontak, deskripsi) |
| FR-03 | Sistem menyediakan pilihan paket dan membuat transaksi pembayaran melalui Midtrans |
| FR-04 | Sistem memvalidasi notifikasi pembayaran dari Midtrans **di server** sebelum mengaktifkan paket & tenant (tidak boleh hanya mengandalkan redirect "pembayaran berhasil" di browser) |
| FR-05 | Sistem membuat website usaha pada subdomain platform setelah aktivasi |
| FR-06 | Pemilik dapat menambah, mengubah, menghapus kategori dan menu (termasuk harga, deskripsi, foto, status ketersediaan) |
| FR-07 | Sistem menampilkan profil, menu, harga, dan kontak usaha pada website publik tenant yang responsif |
| FR-08 | Sistem mendukung pemesanan sederhana oleh Pembeli, dan pesanan tercatat di dashboard Pemilik |
| FR-09 | Pemilik dapat memperbarui status pesanan (baru → diproses → selesai) |
| FR-10 | Admin Platform dapat melihat pendaftaran, usaha, paket, dan status pembayaran |
| FR-11 | Sistem membatasi fitur yang dapat diakses sesuai paket aktif tenant |
| FR-12 | Sistem menyediakan uji coba gratis 30 hari pada paket yang dipilih, lalu opsi perpanjangan bulanan/6 bulanan/tahunan |
| FR-13 | Sistem menyediakan chatbot AI (Gemini API) **hanya** di landing page utama platform untuk menjawab pertanyaan calon pengguna tentang fitur, paket, dan pendaftaran |
| FR-14 | Sistem menyediakan add-on fitur tambahan yang dapat dibeli terpisah di luar paket (Custom Domain, Laporan Lanjutan, Multi-Cabang, Promo & Voucher, Notifikasi WhatsApp) — *(lanjutan setelah MVP lomba, lihat 05_FEATURE_SPEC.md)* |

## 7. Non-Functional Requirements (NFR)

| ID | Requirement |
|----|-------------|
| NFR-01 | Antarmuka mudah dipahami tanpa pelatihan teknis yang rumit |
| NFR-02 | Data setiap tenant terpisah & terlindungi lewat autentikasi + Row Level Security (RLS) — satu tenant **tidak boleh** bisa membaca/mengubah data tenant lain |
| NFR-03 | Aktivasi paket hanya terjadi berdasarkan transaksi yang sudah divalidasi di server, bukan di client |
| NFR-04 | Website publik & dashboard harus responsif (desktop & mobile) |
| NFR-05 | Performa website cepat & stabil |
| NFR-06 | Sistem berjalan baik pada browser modern umum |
| NFR-07 | Perubahan data di dashboard harus konsisten tercermin di website publik (idealnya real-time atau near-real-time) |
| NFR-08 | Arsitektur dirancang agar fitur baru bisa ditambahkan bertahap tanpa mengubah struktur utama (extensible by design — penting karena roadmap paket Kecil/Menengah) |

---

## 8. Model Bisnis — Paket Layanan

Dinely menggunakan model **paket bertingkat + add-on terpisah**:

| Paket | Sasaran | Fokus Fitur (contoh) | Status di Versi Lomba |
|-------|---------|------------------------|-------------------------|
| **Mikro** | Usaha dikelola sendiri oleh pemilik | Profil, menu, kontak, pemesanan dasar | ✅ Diimplementasikan |
| **Kecil** | Usaha dengan beberapa staf | Semua fitur Mikro + pesanan lebih lengkap + akses Staff + promo | ⏳ Lanjutan |
| **Menengah** | Usaha dengan peran operasional terpisah | Semua fitur Kecil + meja + dapur + stok + laporan | ⏳ Lanjutan |

- **Trial**: 30 hari gratis di awal, untuk semua paket.
- **Perpanjangan**: bulanan / 6 bulanan / tahunan (harga makin hemat untuk periode lebih panjang — detail harga belum final, menunggu validasi pasar).
- **Add-on** (dibeli terpisah dari paket, dapat dikombinasikan bebas): Custom Domain, Laporan Lanjutan, Multi-Cabang, Promo & Voucher, Notifikasi WhatsApp.
- Chatbot AI **bukan** add-on tenant — ini fitur platform-level yang hanya ada di landing page utama.

---

## 9. Metrik Keberhasilan (Evaluasi)

Proposal mendefinisikan keberhasilan lewat pertanyaan evaluasi kualitatif, bukan metrik penjualan:

1. Apakah pemilik bisa menyiapkan website tanpa bantuan teknis intensif?
2. Apakah pemilik bisa memperbarui menu & harga dengan mudah?
3. Apakah pelanggan bisa menemukan info menu & kontak dengan mudah?
4. Apakah pesanan tercatat & statusnya bisa dikelola?
5. Apakah data satu usaha terlindungi dari usaha lain?

Disarankan dijadikan acceptance test / UAT checklist sebelum demo lomba.

---

## 10. Dokumen Terkait

- Arsitektur teknis & resolusi subdomain → `02_ARCHITECTURE.md`
- Skema database → `03_DATABASE_SCHEMA.md`
- Alur pengguna detail → `04_USER_FLOWS.md`
- Spesifikasi fitur per paket + acceptance criteria → `05_FEATURE_SPEC.md`
