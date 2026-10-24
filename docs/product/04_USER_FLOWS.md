# User Flows — RestoLink

> Mengacu ke tabel di `03_DATABASE_SCHEMA.md` dan arsitektur di `02_ARCHITECTURE.md`. Status/enum yang disebut di sini konsisten dengan skema database.

---

## 1. Alur Pemilik Usaha: Registrasi → Aktivasi Website

1. Pemilik membuka landing page RestoLink, menjelajahi fitur & paket.
2. Pemilik memilih paket (Mikro / Kecil / Menengah) **sebelum** mendaftar.
3. Pemilik mengisi formulir registrasi akun + data usaha, termasuk nama subdomain yang diinginkan.
   - Sistem harus validasi real-time: subdomain belum dipakai tenant lain, format valid, bukan reserved word (lihat `03_DATABASE_SCHEMA.md` bag. 3).
   - Buat baris di `profiles` (via Supabase Auth sign up) dan `tenants` dengan `status = 'pending'`.
4. Pemilik menyelesaikan pembayaran trial/paket melalui Midtrans.
   - Buat baris `transactions` dengan `status = 'pending'`.
5. **(Server-side, async)** Midtrans mengirim notifikasi → server validasi → update `transactions.status` dan `tenants.status` menjadi `active`/`trial` (lihat `02_ARCHITECTURE.md` bag. 5 untuk detail keamanan).
6. Setelah pembayaran terverifikasi, website & fitur paket diaktifkan — subdomain tenant mulai bisa diakses publik.
7. Pemilik menambahkan kategori & menu beserta harga dan foto (diupload ke Cloudflare R2, dikompresi WebP).
8. Pemilik membagikan alamat website (`{subdomain}.restolink.site`) ke pelanggan.
9. Pemilik melihat pesanan masuk & memperbarui statusnya.
10. Pemilik memperbarui menu, harga, dan ketersediaan saat diperlukan — perubahan harus langsung tercermin di website publik (NFR-07).

### Edge case yang wajib ditangani
- Subdomain yang diinginkan sudah dipakai → tampilkan alternatif/minta input ulang sebelum lanjut ke pembayaran.
- Pembayaran gagal/expired → `tenants.status` tetap `pending`, beri opsi coba bayar ulang, jangan buat tenant baru duplikat.
- Pembayaran pending terlalu lama → tampilkan status "menunggu konfirmasi" di dashboard, jangan biarkan pemilik stuck tanpa info.
- Pemilik menutup browser sebelum notifikasi webhook diterima → saat login berikutnya, dashboard harus bisa menampilkan status transaksi terkini (bukan hanya cache lokal).

---

## 2. Alur Pembeli: Kunjungi Website → Pesan

1. Pembeli membuka website usaha (`{subdomain}.restolink.site`).
2. Sistem resolve tenant via subdomain (lihat `02_ARCHITECTURE.md` bag. 4) — tampilkan skeleton loading selama proses ini.
3. Pembeli melihat profil & menu (dikelompokkan per kategori).
4. Pembeli memeriksa harga & ketersediaan (menu dengan `is_available = false` ditandai jelas, idealnya tidak bisa ditambah ke keranjang).
5. Pembeli memilih menu & jumlah, menambahkan catatan pesanan (opsional).
6. Pembeli mengirim pesanan — mengisi `buyer_name` (wajib) dan `buyer_contact` (opsional, untuk dihubungi balik).
   - Sistem membuat baris `orders` (`status = 'baru'`) + `order_items` dengan snapshot nama & harga menu saat itu.
7. Pembeli menerima informasi pesanan (`order_code`) dan, bila tersedia, dapat memantau statusnya (mis. lewat halaman status dengan `order_code`, tanpa perlu login).

### Edge case
- Tenant tidak ditemukan / status tidak aktif → halaman "usaha tidak ditemukan", **jangan** fallback ke data tenant lain mana pun.
- Menu yang dipilih pembeli jadi `is_available = false` di antara waktu pembeli membuka halaman dan saat submit pesanan → validasi ulang ketersediaan di server sebelum `INSERT orders`, tolak item yang sudah tidak tersedia.
- Pesanan dengan keranjang kosong → tolak di validasi form sebelum submit.

---

## 3. Alur Admin Platform

1. Admin login ke Dashboard Admin Platform (role `platform_admin`).
2. Admin melihat daftar pendaftaran & status pembayaran lintas tenant.
3. Admin memeriksa informasi usaha tertentu bila diperlukan (mis. investigasi komplain).
4. Admin memastikan tenant & paket aktif sesuai status pembayaran yang sah.
5. Admin membantu menangani masalah aktivasi atau akun — mis. tenant yang pembayarannya sukses di Midtrans tapi webhook gagal diproses (manual override status, dengan audit log).

### Catatan desain
- Semua aksi Admin yang mengubah `tenants.status` atau `transactions.status` secara manual sebaiknya dicatat (audit trail) — tidak eksplisit diminta proposal, tapi disarankan untuk akuntabilitas, mengingat Admin punya akses lintas-tenant yang luas.

---

## 4. Alur Pembayaran & Aktivasi Website (Detail Teknis)

Ini elaborasi dari `02_ARCHITECTURE.md` bag. 5, ditulis sebagai step pengguna + sistem:

| Langkah | Aktor | Aksi |
|---------|-------|------|
| 1 | Pemilik | Memilih paket (di halaman pricing/registrasi) |
| 2 | Sistem (server) | Membuat baris `transactions` (`status: pending`), meminta Snap token/redirect URL ke Midtrans |
| 3 | Pemilik | Diarahkan ke halaman pembayaran Midtrans, menyelesaikan pembayaran |
| 4 | Midtrans | Memproses pembayaran, lalu mengirim **notifikasi webhook** ke endpoint server RestoLink |
| 5 | Sistem (server) | Validasi signature notifikasi, cocokkan `midtrans_order_id`, update `transactions.status` sesuai status resmi Midtrans |
| 6 | Sistem (server) | Jika `settlement`/`capture` → update `tenants.status = 'active'` (atau `'trial'` bila trial), set `current_package_id` |
| 7 | Pemilik | Melihat website aktif & bisa mulai isi menu |

Status yang wajib ditangani di UI pemilik: **sukses**, **pending/menunggu**, **gagal/kedaluwarsa**. Jangan biarkan UI stuck di satu status tanpa penjelasan.

---

## 5. Alur Pengelolaan Menu (Pemilik)

1. Pemilik buka Dashboard → menu "Kategori & Menu".
2. Tambah kategori baru (nama, urutan tampil).
3. Dalam kategori, tambah menu: nama, deskripsi, harga, foto (upload → kompres WebP → simpan ke Cloudflare R2 → simpan URL di `menu_items.image_url`).
4. Toggle ketersediaan menu (`is_available`) — perubahan ini harus **langsung** terlihat di website publik tanpa perlu refresh manual yang rumit (pertimbangkan Supabase Realtime subscription atau polling ringan di tenant-site untuk FR-07/NFR-07).
5. Edit/hapus kategori atau menu — hapus kategori yang masih punya menu di dalamnya perlu konfirmasi/aturan cascade yang jelas (mis. tidak boleh hapus kategori berisi menu tanpa memindah/menghapus menunya dulu).

---

## 6. Alur Pengelolaan Pesanan (Pemilik)

1. Pemilik buka Dashboard → menu "Pesanan".
2. Lihat daftar pesanan masuk, terurut dari terbaru, dengan filter status (`baru` / `diproses` / `selesai` / `dibatalkan`).
3. Buka detail satu pesanan → lihat item, jumlah, catatan, info kontak pembeli (bila ada).
4. Update status pesanan sesuai progres dapur: `baru → diproses → selesai`.
5. (Opsional) tandai `dibatalkan` dengan alasan, bila pesanan tidak bisa diproses.

---

## 7. Checklist UAT (diturunkan dari metrik keberhasilan di `01_PRD.md` bag. 9)

Gunakan sebagai skenario uji sebelum demo lomba:

- [ ] Pemilik baru bisa daftar → bayar trial → menu tampil di subdomain-nya **tanpa bantuan teknis**.
- [ ] Pemilik mengubah harga/ketersediaan menu → perubahan tampil di website publik dalam waktu wajar.
- [ ] Pembeli bisa menemukan menu, harga, dan kontak usaha hanya dari membuka subdomain, tanpa instruksi tambahan.
- [ ] Pesanan yang dikirim pembeli muncul di dashboard pemilik, dan statusnya bisa diubah.
- [ ] Mencoba mengakses data tenant A memakai sesi/akun tenant B **harus gagal** (verifikasi RLS).
- [ ] Simulasi pembayaran gagal/pending di sandbox Midtrans tidak mengaktifkan tenant.
- [ ] Mengakses subdomain yang tidak terdaftar menampilkan halaman "usaha tidak ditemukan", bukan error mentah atau data tenant lain.

---

## 8. Dokumen Terkait

- Requirement sumber alur ini → `01_PRD.md`
- Detail keamanan resolusi subdomain & webhook → `02_ARCHITECTURE.md`
- Struktur tabel yang disebut di atas → `03_DATABASE_SCHEMA.md`
- Acceptance criteria per fitur → `05_FEATURE_SPEC.md`
