# Task List: Upgrade Tampilan Login & Register Dinely

## Phase 1: Redesign Halaman Masuk (Login)

### Task 1: Implementasi Split-Screen Layout & UI Modern Halaman Login (`/masuk`)
**Description:** Mengubah layout single-card saat ini menjadi layout split-screen kelas dunia. Sisi kiri menampilkan panel branding Dinely bertema dark slate dengan ilustrasi fitur andalan (katalog QR & manajemen dapur) dan kutipan testimoni UMKM. Sisi kanan menampilkan form masuk yang bersih dengan label modern, toggle intip kata sandi, dan navigasi balik.
**Acceptance criteria:**
- [ ] Layout split-screen 50:50 pada layar besar (`lg+`) dan full-width kartu rapi pada mobile (`< lg`)
- [ ] Sisi kiri memuat logo Dinely, tagline UMKM kuliner, kartu visual mockup, dan avatar Linka
- [ ] Sisi kanan memuat form login (email, kata sandi, toggle show password, tombol masuk)
- [ ] Error alert saat kredensial salah tertampil jelas dan ramah pengguna
- [ ] Modal pemulihan kata sandi tetap dapat dibuka dengan lancar
**Verification:**
- [ ] `npm run check` bebas error
- [ ] Login sukses mengarah ke dashboard sesuai role pengguna
**Files likely touched:**
- `src/apps/landing/routes/Login.svelte`
**Estimated scope:** M (1 file, full UI overhaul)

---

### Task 2: Tambahkan Quick Demo Credentials Helper untuk Kemudahan Penjurian
**Description:** Menambahkan banner / chip kecil yang elegan di bagian bawah atau atas form login untuk mengisi email dan kata sandi akun demo dalam 1 klik, memudahkan juri atau pengunjung menguji aplikasi tanpa harus mengetik manual.
**Acceptance criteria:**
- [ ] Terdapat opsi "Akun Demo Evaluator / Juri" yang rapi dan tidak mengganggu alur login reguler
- [ ] Sekali klik, input email dan kata sandi otomatis terisi kredensial uji coba
- [ ] Validasi form (`isFormValid`) otomatis bernilai aktif (valid)
**Verification:**
- [ ] Klik tombol demo mengisi form secara reaktif dan form siap di-submit
**Files likely touched:**
- `src/apps/landing/routes/Login.svelte`
**Estimated scope:** S (1 file)

---

## Checkpoint: Login Verification
- [ ] Halaman `/masuk` tampil responsif di layar mobile (375px), tablet (768px), dan desktop (1280px)
- [ ] Autentikasi dengan akun valid berhasil masuk ke dashboard
- [ ] Kredensial salah menampilkan pesan error yang tepat

---

## Phase 2: Redesign Halaman Daftar (Register)

### Task 3: Implementasi Split-Screen Layout & Grouping Halaman Register (`/daftar`)
**Description:** Mengubah halaman register menjadi layout split-screen yang serasi dengan halaman login. Sisi kiri menampilkan kartu rincian keuntungan uji coba 30 hari (subdomain gratis, 0% komisi, QR meja), sisi kanan menampilkan formulir pendaftaran yang terbagi dalam dua kelompok logis: 1) Data Usaha & Subdomain, 2) Akun Pemilik & Keamanan.
**Acceptance criteria:**
- [ ] Layout split-screen 50:50 di desktop, mobile responsif
- [ ] Formulir dikelompokkan secara visual menjadi: "1. Profil Usaha & Subdomain" dan "2. Akun Pemilik & Keamanan"
- [ ] Navigasi "Kembali ke Beranda" dan "Sudah punya akun? Masuk" jelas terlihat
- [ ] Seluruh validasi data (nama, whatsapp, usaha, email, password) tetap bekerja 100%
**Verification:**
- [ ] `npm run check` lolos tanpa error
- [ ] Submit pendaftaran memicu `authStore.signUp` dengan benar
**Files likely touched:**
- `src/apps/landing/routes/Register.svelte`
**Estimated scope:** M (1 file, full UI overhaul)

---

### Task 4: Polish Subdomain Live Checker Card & Interactive Feedback
**Description:** Mempercantik kartu indikator subdomain dinamis agar tampak seperti live browser address bar mini dengan status ping animasi, badge ketersediaan (Tersedia / Sedang Dicek / Sudah Dipakai), dan preview format URL lengkap.
**Acceptance criteria:**
- [ ] Desain mock URL bar mini: `https://[subdomain].dinely.site` yang reaktif
- [ ] Indikator animasi status: loading ping saat debounce, checklist hijau saat tersedia, silang merah saat tidak valid/sudah dipakai
- [ ] Auto-slugify dari nama usaha tetap mulus tanpa lag
**Verification:**
- [ ] Ketik nama usaha -> subdomain otomatis ter-generate dan terverifikasi
- [ ] Ketik manual subdomain -> status ter-update sesuai ketersediaan
**Files likely touched:**
- `src/apps/landing/routes/Register.svelte`
**Estimated scope:** S (1 file)

---

## Checkpoint: Register Verification
- [ ] Alur pendaftaran usaha baru berhasil membuat akun dan tenant
- [ ] Debounce subdomain tidak mengalami perlambatan atau race condition

---

## Phase 3: Final Audit & Quality Gates

### Task 5: Audit Aksesibilitas (WCAG AA), TypeScript Check, API Test, dan Build Produksi
**Description:** Menjalankan seluruh pengujian kualitas menyeluruh untuk memastikan tidak ada regresi pada sistem.
**Acceptance criteria:**
- [ ] `npm run check` menghasilkan 0 error dan 0 warning
- [ ] `npm run test:api` meloloskan seluruh 85/85 test suite backend
- [ ] `npm run build` menghasilkan bundle produksi yang bersih tanpa warning
- [ ] Seluruh form input dapat diakses via keyboard (Tab / Shift-Tab / Enter)
**Verification:**
- [ ] `npm run check`
- [ ] `npm run test:api`
- [ ] `npm run build`
**Files likely touched:**
- (Testing & verification)
**Estimated scope:** S (All affected files)
