# Implementation Plan: Redesign & Upgrade Tampilan Login & Register Dinely

## Overview
Meningkatkan kualitas tampilan dan pengalaman pengguna (UI/UX) pada halaman **Masuk (`/masuk`)** dan **Daftar (`/daftar`)** Dinely agar setara dengan standar web SaaS kelas juara (seperti CationGate, Stripe, dan Supabase). Peningkatan meliputi layout split-screen modern (50:50 desktop), showcase visual branding & mockup subdomain di panel kiri, formulir terstruktur dengan micro-interactions di panel kanan, serta fitur kemudahan pengujian bagi juri kompetisi (1-Click Demo Credentials).

## Architecture & Design Decisions
1. **Layout Split-Screen Responsif**:
   - Desktop (`lg`): 2 kolom berdampingan. Sisi kiri menampilkan visual showcase bertema *Dark Premium Slate & Warm Brand Glow* dengan poin nilai tambah platform; sisi kanan menampilkan formulir bersih yang fokus dan elegan.
   - Mobile & Tablet (`< lg`): Stack vertikal yang rapi, memprioritaskan form dengan header brand yang ringkas agar tidak membebani scrolling di layar kecil.
2. **Branding Showcase di Sisi Kiri**:
   - Menampilkan kutipan nilai produk UMKM, kartu simulasi live website subdomain (`https://dapur-nia.dinely.site`), dan badge maskot Linka yang ramah.
3. **Formulir Terstruktur & Micro-Interactions**:
   - Halaman Register: Pengelompokan visual yang jelas antara **Data Usaha & Subdomain** dengan **Akun Pemilik & Keamanan**.
   - Live Subdomain Checker: Tampilan status ketersediaan subdomain yang lebih visual dan interaktif dengan preview URL instan.
4. **Fitur Khusus Juri (1-Click Demo Account Helper)**:
   - Tombol bantuan cepat di halaman Login untuk mengisi kredensial akun uji coba secara instan (mengurangi friksi saat penjurian).
5. **Preservasi Logika Backend & Keamanan**:
   - Mempertahankan 100% integrasi Supabase Auth (`authStore.signIn`, `authStore.signUp`), validasi format subdomain, sanitasi input, dan penanganan error yang sudah teruji.

---

## Task List

### Phase 1: Redesign Halaman Masuk (Login)
- [ ] Task 1: Implementasi Split-Screen Layout & UI Modern Halaman Login (`/masuk`)
- [ ] Task 2: Tambahkan Quick Demo Credentials Helper untuk Kemudahan Penjurian

### Checkpoint: Login Verification
- [ ] Tampilan responsif di 320px, 768px, 1024px, dan 1440px
- [ ] Alur autentikasi dan penanganan error berfungsi normal

### Phase 2: Redesign Halaman Daftar (Register)
- [ ] Task 3: Implementasi Split-Screen Layout & Form Stepper/Grouping Halaman Register (`/daftar`)
- [ ] Task 4: Polish Subdomain Live Checker Card & Interactive Feedback

### Checkpoint: Register Verification
- [ ] Validasi debounce subdomain berjalan mulus
- [ ] Pendaftaran berhasil mengarah ke dashboard atau konfirmasi email

### Phase 3: Final Audit & Quality Gates
- [ ] Task 5: Audit Aksesibilitas (WCAG AA), TypeScript Check, API Test, dan Build Produksi

---

## Risks & Mitigations
| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Form terasa terlalu panjang di mobile | Sedang | Gunakan grouping visual yang ramping dan sembunyikan dekorasi berat di mobile. |
| Regresi pada logika Supabase Auth | Tinggi | Pertahankan method `authStore.signIn` dan `authStore.signUp` tanpa merubah kontrak data. |
| Subdomain debounce macet saat mengetik cepat | Sedang | Pertahankan debounce timer 350ms dan client-side regex check sebelum query database. |

## Open Questions
- Apakah tim sudah memiliki akun demo tetap (email & password tertentu) yang ingin dipasang sebagai demo default untuk juri, atau menggunakan akun pengujian lokal?
