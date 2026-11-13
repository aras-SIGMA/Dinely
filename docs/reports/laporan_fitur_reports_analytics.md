# Laporan Fitur: Reports & Analytics Omzet

> Status: **Selesai** · Branch: `feature/reports-and-analytics` · Jenis: penambahan fitur pasca-MVP lomba

---

## 1. Latar Belakang

Sebelum fitur ini, dashboard pemilik hanya menampilkan jumlah pesanan per status dan katalog menu. Tidak ada satu pun angka uang. Pemilik tidak bisa menjawab pertanyaan dasar: *"minggu ini saya dapat berapa?"* dan *"menu apa yang paling menguntungkan?"*.

Data mentahnya sudah tersedia sejak MVP (`orders.total_amount`, `orders.status`, `orders.created_at`, `order_items.menu_item_name_snapshot`, `quantity`, `subtotal`), sehingga fitur ini **tidak memerlukan migrasi database maupun endpoint backend baru**.

---

## 2. Keputusan Desain: Dua Laporan, Bukan Satu

Permintaan awal adalah satu laporan omzet. Namun satu angka tunggal menimbulkan ambiguitas: apakah pesanan yang masih diproses atau dibatalkan termasuk pendapatan?

Solusi yang diambil: **dua laporan dengan basis data berbeda**, karena keduanya menjawab pertanyaan yang berbeda.

| Laporan | Basis Data | Pertanyaan yang Dijawab |
|---------|-----------|--------------------------|
| **Pendapatan** | Hanya pesanan `selesai` | Berapa uang yang benar-benar masuk? |
| **Aktivitas Pesanan** | Seluruh pesanan (termasuk `dibatalkan`) | Seberapa ramai operasional dan di mana pesanan bocor? |

Angka keduanya **sengaja tidak identik**. Selisihnya adalah pesanan yang masuk tetapi tidak tuntas — justru itulah nilai diagnostiknya.

---

## 3. Arsitektur Implementasi

Pemisahan tegas antara logika murni dan lapisan I/O, agar perhitungan dapat diverifikasi tanpa menyentuh Supabase.

```
src/lib/reports.ts         -> agregasi murni, tanpa dependensi jaringan
src/lib/reports-data.ts    -> satu fungsi fetch (Supabase)
src/lib/reports.selftest.ts-> 20 pemeriksaan mandiri berbasis assert
src/apps/dashboard/routes/Reports.svelte -> UI tab + grafik + ekspor CSV
```

### 3.1 `src/lib/reports.ts`

Fungsi publik:

| Fungsi | Kegunaan |
|--------|----------|
| `resolveRange(mode, start, end)` | Menyusun rentang 7/30/90 hari atau kustom menjadi batas ISO + kunci tanggal Jakarta |
| `toDateKey(value)` | Kunci tanggal `YYYY-MM-DD` menurut `Asia/Jakarta` |
| `toJakartaHour(value)` | Jam 0–23 menurut `Asia/Jakarta` |
| `dateKeysBetween(start, end)` | Daftar kunci tanggal berurutan, inklusif |
| `computeRevenueReport(orders, range)` | Agregasi omzet, rata-rata nilai pesanan, tren harian, 5 menu terlaris |
| `computeActivityReport(orders, range)` | Agregasi total pesanan, distribusi status, tingkat pembatalan, volume harian, jam sibuk, rata-rata durasi penyelesaian |
| `buildCombinedCsv(revenue, activity, range)` | Satu berkas CSV memuat kedua laporan |

### 3.2 `src/lib/reports-data.ts`

`fetchReportOrders(tenantId, range, limit = 2000)` mengambil pesanan beserta `order_items` dalam satu query, dibatasi `gte(created_at)` / `lte(created_at)` dan `limit` baris.

**Batasan**: agregasi dilakukan di klien. Cukup untuk volume UMKM. Bila satu tenant menembus puluhan ribu pesanan per rentang, pindahkan agregasi ke RPC Postgres.

### 3.3 `src/apps/dashboard/routes/Reports.svelte`

Rute baru `/dashboard/laporan`, ditambahkan ke `src/routes/platform.ts` dan navigasi `DashboardLayout.svelte`.

Komponen UI:

- Pemilih rentang: 7 Hari, 30 Hari, 90 Hari, Kustom (dua input `date`).
- Tab `role="tablist"`: **Pendapatan** | **Aktivitas Pesanan**.
- Grafik batang tanpa library chart — `div` dengan tinggi proporsional terhadap nilai maksimum.
- Kartu ringkasan, daftar menu terlaris, distribusi status, histogram jam sibuk.
- Tombol unduh CSV (satu berkas gabungan).
- Skeleton loading, kondisi galat dengan tombol coba lagi, kondisi kosong informatif.
- Semua tombol dan input memenuhi target sentuh minimum 44px.

---

## 4. Detail Perhitungan

### 4.1 Laporan Pendapatan

```
omzet_total          = sigma(total_amount) dari pesanan berstatus 'selesai'
pesanan_selesai      = count(pesanan 'selesai')
rata_rata_pesanan    = round(omzet_total / pesanan_selesai)
menu_terlaris        = top 5 menu diurutkan berdasarkan subtotal, lalu kuantitas
```

Pesanan `baru`, `diproses`, dan `dibatalkan` **tidak** menyumbang omzet.

### 4.2 Laporan Aktivitas Pesanan

```
total_pesanan        = count(seluruh pesanan pada rentang)
pesanan_aktif        = total_pesanan - count(status 'dibatalkan')
tingkat_pembatalan   = (count('dibatalkan') / total_pesanan) * 100
jam_sibuk            = jam dengan jumlah pesanan terbanyak (null bila tidak ada)
rata_rata_durasi     = round(mean(updated_at - created_at)) untuk pesanan 'selesai'
```

**Catatan akurasi**: `updated_at` dipakai sebagai proksi waktu selesai karena skema belum memiliki kolom `completed_at`. Nilainya adalah sentuhan terakhir pada baris pesanan, sehingga bisa sedikit lebih lama dari waktu pesanan benar-benar disajikan. Bila akurasi durasi menjadi penting, tambahkan kolom `completed_at` yang diisi saat status berubah menjadi `selesai`.

### 4.3 Zona Waktu

Seluruh pengelompokan tanggal dan jam memakai `Intl.DateTimeFormat` dengan `timeZone: 'Asia/Jakarta'`, bukan `Date.getDate()` atau `Date.getHours()` yang bergantung pada zona perangkat. Pemilik yang membuka dashboard dari luar WIB tetap melihat angka yang sama dengan rekapitulasi harian mereka.

### 4.4 Format CSV

Satu berkas gabungan, UTF-8 dengan BOM (`\uFEFF`) agar karakter Indonesia terbaca benar di Excel.

```
laporan,kelompok,label,nilai,satuan
```

Nilai `laporan`: `Info`, `Pendapatan`, `Aktivitas`.
Nilai `kelompok`: `Rentang`, `Ringkasan`, `Harian`, `Menu Terlaris`, `Jam Sibuk`.

---

## 5. Verifikasi

`npx tsx src/lib/reports.selftest.ts` — 20 pemeriksaan:

| # | Yang diperiksa |
|---|----------------|
| 1–2 | Omzet hanya menghitung pesanan `selesai` |
| 3 | Rata-rata nilai pesanan selesai |
| 4–5 | Menu terlaris mengabaikan pesanan dibatalkan |
| 6–7 | Total pesanan dan pesanan aktif pada laporan Aktivitas |
| 8–9 | Tingkat pembatalan 25% dari 1 batal per 4 pesanan |
| 10–11 | Rata-rata durasi dan jumlah sampel |
| 12–13 | Header CSV dan baris omzet |
| 14 | Baris tingkat pembatalan |
| 15–16 | Konversi tanggal dan jam ke `Asia/Jakarta` |
| 17 | Rentang 7 hari menghasilkan 7 kunci tanggal |
| 18 | Preset 30 hari lebih panjang dari 7 hari |
| 19–20 | Rentang kustom menormalkan urutan tanggal terbalik |

Selain itu:

```bash
npm run check   # 0 error, 0 warning
npm run build   # sukses
```

---

## 6. Yang Sengaja Tidak Dilakukan

| Dilewati | Alasan | Kapan ditambahkan |
|----------|--------|-------------------|
| Agregasi via RPC Postgres / materialized view | Volume UMKM masih kecil; agregasi klien cukup | Saat pesanan per tenant menembus puluhan ribu per rentang |
| Library chart (Chart.js, ApexCharts) | Satu komponen batang `div` sudah memadai, nol dependensi baru | Saat butuh grafik garis/area bertumpuk |
| Perbandingan periode sebelumnya | Belum diminta | Saat pemilik membutuhkan analisis tren antar-periode |
| Ekspor PDF | CSV sudah cukup untuk pembukuan | Saat butuh laporan siap cetak untuk pihak ketiga |
| Kolom `completed_at` | Butuh migrasi database | Saat akurasi durasi penyelesaian menjadi keluhan |
| Tes UI komponen | Fokus pada logika agregasi yang paling rawan salah | Saat CI frontend dipasang |

---

## 7. Dampak ke Dokumen Lain

| Dokumen | Perubahan |
|---------|-----------|
| `docs/product/05_FEATURE_SPEC.md` | Bagian **F3** baru: Laporan & Analitik dengan acceptance criteria |
| `docs/product/04_USER_FLOWS.md` | Bagian **7** baru: alur pemilik melihat laporan; dua butir UAT ditambahkan |
| `docs/MILESTONES.md` | Baris **M10** pada matriks dan rincian milestone |
| `src/routes/platform.ts` | Rute `/dashboard/laporan` |
| `src/apps/dashboard/DashboardLayout.svelte` | Item navigasi "Laporan & Analitik" |
