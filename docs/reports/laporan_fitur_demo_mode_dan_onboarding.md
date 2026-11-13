# Laporan Fitur: Mode Demo, Onboarding Pemilik Baru, dan Penonaktifan OTP Sementara

> Status: **Selesai** · Branch: `feature/demo-mode-and-onboarding` · Basis: `feature/reports-and-analytics` (`06392f9`) · Jenis: penambahan pra-lomba

---

## 1. Latar Belakang

Tiga kebutuhan muncul menjelang penjurian:

1. **Juri tidak bisa mencoba produk tanpa menyiapkan akun.** Registrasi + verifikasi OTP + pembayaran Midtrans sandbox memakan waktu dan bergantung pada kredensial pihak ketiga. Di panggung lomba, jaringan dan kuota menjadi risiko.
2. **Pemilik baru tidak tahu harus mulai dari mana.** Dashboard memiliki enam menu; tanpa panduan singkat, pemilik pertama kali membuka halaman Ringkasan lalu berhenti.
3. **OTP memperlambat pengujian internal.** Setiap login saat pengujian membutuhkan kode email, sementara perubahan-perubahan pra-rilis masih sering.

Solusinya bukan melonggarkan keamanan produksi, melainkan **memisahkan jalur demo dari jalur nyata**.

---

## 2. Keputusan Desain

### 2.1 Demo = sandbox lokal, bukan akun Supabase bersama

| Opsi | Alasan Ditolak |
|------|----------------|
| Akun demo Supabase nyata | Kredensial ikut ke bundle; multi-juri saling menimpa data; RLS terpaksa dilonggarkan; kuota Gemini/Midtrans terpakai |
| Data demo di memori saja | Refresh menghapus perubahan; demo tidak terasa "hidup" |
| **Fixture + `localStorage`** | Tidak menyentuh server, tahan refresh, bisa direset manual, tanpa kredensial |

Mode demo berjalan sebagai **sesi bayangan**: `authStore` dihidrasi dari fixture, dan setiap modul I/O memeriksa `isDemoMode()` sebelum menyentuh jaringan.

### 2.2 Cakupan mode demo

| Termasuk | Dikecualikan |
|----------|--------------|
| Dashboard pemilik (`/dashboard/*`) | Panel admin (`/admin/*`) |
| Website tenant (`?tenant=demo`) | Chatbot AI platform |
| Laporan & Analitik | Webhook Midtrans |
| Checkout tamu | Unggah Cloudinary sungguhan |

### 2.3 Pembayaran demo dinyatakan berhasil

Tombol bayar pada mode demo tidak menampilkan pesan "tidak tersedia" — itu memutus alur presentasi. Sebagai gantinya, transaksi disimulasikan berhasil setelah jeda singkat, status langganan berubah menjadi aktif 31 hari, dan riwayat pembayaran berisi satu baris `DEMO-PAID`. Tidak ada permintaan ke Midtrans.

### 2.4 Reset manual, bukan otomatis

Data demo **tidak** dihapus saat keluar. Juri dapat melanjutkan sesi yang sama; tombol "Reset Data Demo" di banner mengembalikan fixture awal kapan pun dibutuhkan.

### 2.5 Onboarding sekali per akun

Tutorial lima langkah ditampilkan sekali, lalu ditandai di `localStorage` dengan kunci `restolink_onboarding_seen_<profileId>`. Satu akun tidak akan melihatnya lagi; akun lain tetap mendapatkannya. Mode demo sengaja **melewati** tutorial agar presentasi tidak terhalang modal.

### 2.6 OTP dinonaktifkan lewat sakelar konfigurasi

`OTP_LOGIN_ENABLED = false` di `src/lib/config.ts`. Saat `false`, login langsung memuat profil dan tenant tanpa meminta kode. **Wajib disetel kembali ke `true` sebelum rilis produksi** — ini bukan penghapusan fitur, hanya gerbang sementara.

---

## 3. Arsitektur Implementasi

```
src/lib/demo/fixtures.ts      -> data contoh deterministik + generator pesanan 30 hari
src/lib/demo/store.ts         -> state mutable, persist localStorage, reset
src/lib/demo/mode.ts          -> isDemoMode / enterDemo / exitDemo
src/components/ui/OnboardingTour.svelte  -> tutorial 5 langkah
src/components/ui/DemoEntryButton.svelte -> tombol "Coba Mode Demo"
```

### 3.1 `fixtures.ts`

- Tenant `demo` (Dapur Bu Nia), 6 kategori, 14 menu (1 sengaja habis).
- Generator pesanan memakai fungsi `seeded()` berbasis sinus sehingga **stabil antar reload** selama rentang tanggalnya sama.
- Menghasilkan 81 pesanan pada 30 hari terakhir dengan komposisi: 53 `selesai`, 10 `baru`, 8 `diproses`, 10 `dibatalkan`. Pesanan batal sengaja ada agar kedua tab laporan menunjukkan angka berbeda.
- Jam operasional 07:00–21:00 WIB dengan puncak siang dan malam; durasi penyelesaian 12–45 menit.

### 3.2 `store.ts`

State yang dipersist: pesanan, kategori, menu, paket, dan status langganan. Kunci `restolink_demo_state_v1`. Bila data lokal rusak, state dibangun ulang dari fixture tanpa melempar error. Mutasi tersedia untuk status pesanan, ketersediaan menu, CRUD menu/kategori, pesanan baru dari website tenant, dan aktivasi langganan.

### 3.3 `mode.ts`

`isDemoMode()` benar bila flag `restolink_demo_active` ada, atau query `?demo=1`, atau `?tenant=demo`. Membuka `?demo=1` **mempersist** flag agar mode bertahan setelah pengalihan guard ke `/dashboard`; `?tenant=demo` tidak dipersist supaya pengunjung biasa tidak bisa masuk dashboard demo.

### 3.4 Titik intersepsi

| Modul | Perilaku mode demo |
|-------|--------------------|
| `auth.svelte.ts` | `init` menghidrasi fixture; `refreshTenant` menghitung ulang tanggal langganan lokal |
| `orders.svelte.ts` | Baca dari store; ubah status tanpa Supabase; polling dinonaktifkan |
| `tenant.svelte.ts` | `fetchTenant('demo')` mengembalikan `demoPublicTenant` |
| `subscription.svelte.ts` | Paket dari fixture; checkout selalu berhasil |
| `reports-data.ts` | Menyaring pesanan sandbox sesuai rentang |
| `tenant-menu.ts` | Katalog publik dari store |
| `guest-order.ts` | Pesanan tamu masuk ke store; pelacakan status lokal |
| `cloudinary-upload.ts` | Mengembalikan placeholder SVG inline, `bytes: 0` |
| `MenuManagement.svelte` | CRUD menu/kategori ke store |
| `Profile.svelte` | Perubahan hanya di state sesi (ditandai `ponytail:`) |
| `Subscription.svelte` | Riwayat transaksi mengikuti status langganan sandbox |

---

## 4. Verifikasi Runtime

Diuji langsung di browser (`npm run dev`, port 5174):

| Skenario | Hasil |
|----------|-------|
| `/masuk?demo=1` → dashboard | Banner demo tampil, metrik 13/14 menu, 6 kategori |
| `/dashboard/laporan` tab Pendapatan (30 hari) | Omzet Rp 3.137.000 dari 53 pesanan selesai, rata-rata Rp 59.189 |
| Tab Aktivitas Pesanan | 81 pesanan masuk, 71 aktif, pembatalan 12,3%, jam tersibuk 12:00 |
| `?tenant=demo` | Katalog 13 menu, 6 kategori, checkout tamu sampai kode `#DN-2081` |
| Pesanan baru muncul di dashboard | Ya, status `baru` → `diproses` berhasil |
| Bayar langganan demo | Toast "Pembayaran berhasil", status jadi aktif 31 hari, riwayat `DEMO-PAID` |
| Muat ulang halaman langganan | Status aktif tetap tersimpan |
| Reset Data Demo | Kembali ke trial 7 hari dan `DEMO-TRIAL` |

Pemeriksaan statis dan mandiri:

```
npm run check       -> 0 error, 0 warning
npm run test:demo   -> 10 pemeriksaan lulus
npm run test:reports-> seluruh pemeriksaan lulus
npm run build       -> sukses
```

---

## 5. Batasan dan Tindak Lanjut

- **Perubahan profil demo tidak ikut ter-reset** karena hanya disimpan di state sesi; sambungkan ke `demoStore` bila perilaku itu diinginkan.
- **Foto unggahan demo berupa placeholder**, bukan hasil kompresi asli, agar `localStorage` tidak cepat penuh.
- **Pesanan demo yang dibuat tamu memakai `Date.now()`**, sehingga dua pesanan pada milidetik yang sama secara teori bisa bertabrakan ID. Tidak material untuk demo.
- **OTP harus diaktifkan kembali** sebelum rilis produksi.
- Mode demo hanya untuk web pemilik dan website tenant; panel admin tetap memerlukan akun sungguhan.
