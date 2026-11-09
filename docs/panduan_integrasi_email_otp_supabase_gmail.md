# Panduan Integrasi Email OTP 6-Digit (Supabase Auth + Gmail SMTP)

Dokumen spesifikasi arsitektur dan langkah implementasi alur registrasi akun dan verifikasi email menggunakan kode OTP 6-digit otomatis via Gmail SMTP pada RestoLink.

---

## 1. Deteksi Stack & Library

Mengacu pada `package.json`:
- **Framework UI**: Svelte 5.57.2 (Runes mode: `$state`, `$derived`, `$effect`)
- **Build Tool**: Vite 7.3.7
- **BaaS Client SDK**: `@supabase/supabase-js` 2.118.0
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.3.3

---

## 2. Arsitektur & Alur Pengguna (User Flow)

```
[User di Form Registrasi]
       │
       ▼
1. Input Nama, WhatsApp, Nama Usaha, Subdomain, Email, Password
       │
       ▼
2. Submit -> supabase.auth.signUp() + options.data metadata
       │
       ├─► (Database Trigger: Otomatis INSERT profiles + tenants 'pending')
       │
       ▼
3. Supabase Auth generate 6-digit OTP -> Kirim via smtp.gmail.com
       │
       ▼
4. Email masuk ke Gmail User: "Kode Verifikasi Akun RestoLink: 123456"
       │
       ▼
5. User input 6 digit di UI Register (Step 2)
       │
       ▼
6. Frontend panggil supabase.auth.verifyOtp({ email, token, type: 'signup' })
       │
       ├─► Sukses: Sesi aktif didapat, loadProfile() & loadTenant()
       ▼
7. Auto-redirect ke /dashboard (Role: owner)
```

---

## 3. Komponen & Kebutuhan Perubahan Kode

### A. Database Migration (`supabase/migrations/010_tenant_on_signup_trigger.sql`)
* **Masalah**: Trigger `handle_new_user()` lama (`004_triggers.sql`) hanya membuat baris `profiles`. Baris `tenants` sebelumnya dibuat di frontend saat `session` aktif. Ketika email confirmation menyala, `session` bernilai `null` saat pendaftaran, menyebabkan tenant gagal dibuat.
* **Solusi**: Perbarui trigger `handle_new_user()` agar secara atomik membuat baris di `public.tenants` dari `new.raw_user_meta_data`:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  BEGIN
    -- 1. Buat profil owner
    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      role
    ) VALUES (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      new.raw_user_meta_data->>'phone',
      'owner'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Atomik provisi tenant jika metadata usaha tersedia
    IF (new.raw_user_meta_data->>'subdomain') IS NOT NULL AND (new.raw_user_meta_data->>'business_name') IS NOT NULL THEN
      INSERT INTO public.tenants (
        owner_id,
        business_name,
        subdomain,
        status,
        primary_color
      ) VALUES (
        new.id,
        new.raw_user_meta_data->>'business_name',
        lower(new.raw_user_meta_data->>'subdomain'),
        'pending',
        '#ea580c'
      )
      ON CONFLICT (subdomain) DO NOTHING;
    END IF;

    RETURN new;
  END;
  $$;
  ```

---

### B. Auth Store (`src/stores/auth.svelte.ts`)
Tambahkan 2 metode baru pada `AuthStore`:

1. **`verifyEmailOtp(email: string, token: string)`**:
   ```typescript
   async verifyEmailOtp(email: string, token: string): Promise<AuthActionResult> {
     const { data, error } = await supabase.auth.verifyOtp({
       email: email.trim(),
       token: token.trim(),
       type: 'signup'
     });

     if (error) {
       return { success: false, error: error.message };
     }

     if (!data.user) {
       return { success: false, error: 'Sesi gagal dibuat setelah verifikasi.' };
     }

     await Promise.all([
       this.loadProfile(data.user.id),
       this.loadTenant(data.user.id)
     ]);

     return {
       success: true,
       session: true,
       role: this.role ?? 'owner'
     };
   }
   ```
2. **`resendOtp(email: string)`**:
   ```typescript
   async resendOtp(email: string): Promise<{ success: boolean; error?: string }> {
     const { error } = await supabase.auth.resend({
       type: 'signup',
       email: email.trim()
     });

     if (error) {
       return { success: false, error: error.message };
     }
     return { success: true };
   }
   ```

---

### C. Antarmuka Registrasi (`src/apps/landing/routes/Register.svelte`)
Ubah alur halaman registrasi menjadi 2 langkah (two-step flow):
- **Step 1 (Formulir Akun & Toko)**: Input nama, wa, bisnis, subdomain, email, sandi.
  - Saat form berhasil disubmit: Simpan email sementara, ubah state UI ke `currentStep = 'otp'`.
- **Step 2 (Verifikasi 6 Digit OTP)**:
  - Form input 6 kotak/field angka untuk kode verifikasi.
  - Tombol **Verifikasi Kode**.
  - Tombol **Kirim Ulang Kode** dengan countdown cooldown 60 detik (mencegah spamming).
  - Tombol **Ubah Email** (kembali ke Step 1 jika salah ketik email).
  - Saat kode valid: Tampilkan animasi sukses dan redirect langsung ke `/dashboard`.

---

### D. Konfigurasi Eksternal (Dashboard Supabase + Gmail SMTP)

Untuk membuat pengiriman OTP ke Gmail berjalan otomatis:

#### 1. Buat App Password di Akun Google
1. Buka **Akun Google** (`myaccount.google.com`) -> menu **Keamanan** (Security).
2. Pastikan **Verifikasi 2 Langkah** (2-Step Verification) sudah aktif.
3. Cari menu **Sandi Aplikasi** (App Passwords).
4. Buat nama aplikasi baru: `RestoLink SMTP`.
5. Salin 16 karakter password yang diberikan (tanpa spasi).

#### 2. Konfigurasi SMTP di Dashboard Supabase
1. Masuk ke project Supabase -> **Project Settings** -> **Authentication** -> **SMTP Settings**.
2. Nyalakan toggle **Enable Custom SMTP**.
3. Masukkan parameter konfigurasi:
   - **Sender email**: Alamat email Gmail Anda (misal: `restolink.auth@gmail.com`).
   - **Sender name**: `RestoLink`.
   - **Host**: `smtp.gmail.com`.
   - **Port**: `587`.
   - **Minimum TLS Version**: `TLS 1.2`.
   - **Username**: Alamat email Gmail Anda.
   - **Password**: 16 karakter App Password dari Google.
4. Klik **Save**.

#### 3. Sesuaikan Template Email Supabase
1. Masuk ke menu **Authentication** -> **Email Templates** -> pilih **Confirm signup**.
2. Ubah **Subject** menjadi:
   ```
   Kode Verifikasi RestoLink: {{ .Token }}
   ```
3. Ubah **Body** menjadi (atau sesuaikan desain HTML):
   ```html
   <h2>Verifikasi Akun RestoLink</h2>
   <p>Terima kasih telah mendaftar di RestoLink. Gunakan kode verifikasi 6 digit berikut untuk mengaktifkan akun Anda:</p>
   <h1 style="letter-spacing: 5px; font-size: 32px; color: #ea580c;">{{ .Token }}</h1>
   <p>Kode ini berlaku selama 60 menit. Jangan berikan kode ini kepada siapa pun.</p>
   ```
4. Simpan perubahan template.

---

## 4. Referensi Resmi (Official Source Citations)

- **Supabase Auth Verify OTP**:
  - URL: [https://supabase.com/docs/reference/javascript/auth-verifyotp](https://supabase.com/docs/reference/javascript/auth-verifyotp)
  - Signature: `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
- **Supabase Auth Resend Email**:
  - URL: [https://supabase.com/docs/reference/javascript/auth-resend](https://supabase.com/docs/reference/javascript/auth-resend)
  - Signature: `supabase.auth.resend({ type: 'signup', email })`
- **Supabase Custom SMTP Configuration**:
  - URL: [https://supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)
- **Google App Passwords Setup**:
  - URL: [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
