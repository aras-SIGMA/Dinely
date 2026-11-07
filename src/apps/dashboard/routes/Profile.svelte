<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { supabase } from '@/lib/supabase';
  import { toastState } from '@/stores/toast.svelte';
  import { uploadImage, type CompressionSummary } from '@/lib/cloudinary-upload';
  import Badge from '@/components/ui/Badge.svelte';

  // Form State
  let businessName = $state('');
  let description = $state('');
  let address = $state('');
  let contactWhatsapp = $state('');
  let contactPhone = $state('');
  let primaryColor = $state('#ea580c');
  let logoUrl = $state<string | null>(null);

  // Owner Profile
  let fullName = $state('');
  let ownerPhone = $state('');

  // UI state
  let saving = $state(false);
  let uploadingLogo = $state(false);
  let uploadProgress = $state(0);
  let compressionInfo = $state<CompressionSummary | null>(null);
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let isDirty = $state(false);
  let errorMessage = $state<string | null>(null);

  const presetColors = [
    { name: 'Oranye Rempah', hex: '#ea580c' },
    { name: 'Merah Cabai', hex: '#dc2626' },
    { name: 'Kuning Kunyit', hex: '#d97706' },
    { name: 'Hijau Daun', hex: '#059669' },
    { name: 'Biru Samudra', hex: '#0284c7' },
    { name: 'Hitam Arang', hex: '#0f172a' }
  ];

  function syncFormWithStore() {
    const t = authStore.tenant;
    const p = authStore.profile;

    if (t) {
      businessName = t.business_name || '';
      description = t.description || '';
      address = t.address || '';
      contactWhatsapp = t.contact_whatsapp || '';
      contactPhone = t.contact_phone || '';
      primaryColor = t.primary_color || '#ea580c';
      logoUrl = t.logo_url || null;
    }

    if (p) {
      fullName = p.full_name || '';
      ownerPhone = p.phone || '';
    }

    isDirty = false;
    errorMessage = null;
    compressionInfo = null;
  }

  onMount(() => {
    syncFormWithStore();
  });

  const tenant = $derived(authStore.tenant);
  const initials = $derived.by(() => {
    if (!businessName) return 'RL';
    return businessName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });

  async function handleLogoSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      errorMessage = 'Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      errorMessage = 'Ukuran berkas melebihi batas maksimal 10 MB.';
      return;
    }

    errorMessage = null;
    uploadingLogo = true;
    uploadProgress = 0;
    compressionInfo = null;

    try {
      const result = await uploadImage(file, {
        type: 'logo',
        onProgress: (percent) => {
          uploadProgress = percent;
        }
      });

      logoUrl = result.url;
      if (result.compression) {
        compressionInfo = result.compression;
      }
      isDirty = true;
      toastState.push('Logo berhasil diunggah dan dikompresi ke WebP', 'success');
    } catch (err: any) {
      errorMessage = err.message || 'Gagal mengunggah logo ke server.';
      toastState.push('Gagal mengunggah logo', 'error');
    } finally {
      uploadingLogo = false;
      if (fileInputRef) fileInputRef.value = '';
    }
  }

  function removeLogo() {
    logoUrl = null;
    compressionInfo = null;
    isDirty = true;
  }

  function handleInput() {
    isDirty = true;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!tenant) return;

    if (!businessName.trim()) {
      errorMessage = 'Nama usaha tidak boleh kosong.';
      return;
    }

    saving = true;
    errorMessage = null;

    try {
      // 1. Update tenants table
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          business_name: businessName.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
          contact_whatsapp: contactWhatsapp.trim() || null,
          contact_phone: contactPhone.trim() || null,
          primary_color: primaryColor,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id);

      if (tenantError) throw tenantError;

      // 2. Update owner profiles table
      if (authStore.profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: ownerPhone.trim() || null
          })
          .eq('id', authStore.profile.id);

        if (profileError) throw profileError;
      }

      // Refresh cache
      await authStore.refreshTenant();
      if (authStore.profile) {
        await authStore.loadProfile(authStore.profile.id);
      }

      isDirty = false;
      toastState.push('Profil usaha berhasil disimpan', 'success');
    } catch (err: any) {
      console.error('[Profile] Save failed:', err);
      errorMessage = err.message || 'Terjadi kesalahan saat menyimpan perubahan.';
      toastState.push('Gagal menyimpan profil usaha', 'error');
    } finally {
      saving = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profil Usaha</h1>
      <p class="mt-1 text-sm text-slate-500">
        Kelola identitas publik, logo, kontak pemesanan, dan tema warna restoran Anda.
      </p>
    </div>

    {#if isDirty}
      <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        <span class="size-1.5 rounded-full bg-amber-500"></span>
        Perubahan belum disimpan
      </span>
    {/if}
  </div>

  <!-- Error Alert -->
  {#if errorMessage}
    <div role="alert" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <svg class="size-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div class="flex-1">
        <p class="font-semibold">Perhatian</p>
        <p class="mt-0.5 text-xs text-red-700">{errorMessage}</p>
      </div>
      <button type="button" onclick={() => (errorMessage = null)} class="text-red-400 hover:text-red-600">
        &times;
      </button>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-8">
    <!-- Section 1: Logo & Identitas Visual -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-base font-bold text-slate-900 sm:text-lg">Logo & Identitas Visual</h2>
        <p class="mt-1 text-xs text-slate-500">
          Logo ditampilkan di header katalog menu publik dan receipt pesanan pelanggan.
        </p>
      </div>

      <div class="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <!-- Logo Preview Frame -->
        <div class="flex flex-col items-center gap-3">
          <div class="relative size-28 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-xs sm:size-32">
            {#if logoUrl}
              <img src={logoUrl} alt="Logo usaha" class="size-full object-cover" />
            {:else}
              <div
                class="flex size-full items-center justify-center text-3xl font-extrabold text-white transition-colors"
                style="background-color: {primaryColor};"
              >
                {initials}
              </div>
            {/if}

            {#if uploadingLogo}
              <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-2xs">
                <svg class="size-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span class="mt-1 text-[11px] font-semibold">{uploadProgress}%</span>
              </div>
            {/if}
          </div>

          {#if logoUrl && !uploadingLogo}
            <button
              type="button"
              onclick={removeLogo}
              class="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
            >
              Hapus Logo
            </button>
          {/if}
        </div>

        <!-- Upload Controls & Compression Info -->
        <div class="flex-1 space-y-4">
          <div>
            <label for="logo-file-input" class="block text-sm font-semibold text-slate-700">Unggah Logo Baru</label>
            <p class="mt-0.5 text-xs text-slate-500">
              Format yang didukung: PNG, JPG, WebP. Gambar otomatis dikonversi dan dikompresi ke WebP resolusi tinggi (maks. 800px / 300 KB).
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <input
              id="logo-file-input"
              type="file"
              accept="image/*"
              bind:this={fileInputRef}
              onchange={handleLogoSelect}
              disabled={uploadingLogo || saving}
              class="hidden"
            />

            <button
              type="button"
              onclick={() => fileInputRef?.click()}
              disabled={uploadingLogo || saving}
              class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              <svg class="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{uploadingLogo ? 'Mengunggah...' : 'Pilih Berkas Gambar'}</span>
            </button>
          </div>

          <!-- WebP Compression Feedback Badge -->
          {#if compressionInfo}
            <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
              <div class="flex items-center gap-2 font-semibold text-emerald-800">
                <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Optimasi Gambar WebP Berhasil</span>
              </div>
              <p class="mt-1 text-emerald-700">
                Ukuran asal {formatBytes(compressionInfo.originalSize)} berhasil dikompresi menjadi{' '}
                <strong class="font-bold">{formatBytes(compressionInfo.compressedSize)}</strong>{' '}
                (Hemat {compressionInfo.savedPercent}%). Website resto Anda akan memuat lebih cepat di HP pelanggan.
              </p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Color Picker -->
      <div class="mt-8 border-t border-slate-100 pt-6">
        <label for="custom-hex-color" class="block text-sm font-semibold text-slate-800">Tema Warna Restoran (Brand Color)</label>
        <p class="mt-0.5 text-xs text-slate-500">
          Warna ini diterapkan sebagai aksen utama pada tombol pesan, header toko, dan label di situs web publik Anda.
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          {#each presetColors as preset}
            <button
              type="button"
              onclick={() => {
                primaryColor = preset.hex;
                handleInput();
              }}
              class="group flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition-all {primaryColor.toLowerCase() === preset.hex.toLowerCase()
                ? 'border-slate-900 bg-slate-50 font-semibold ring-2 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300'}"
            >
              <span class="size-5 rounded-lg shadow-2xs" style="background-color: {preset.hex};"></span>
              <span class="text-slate-700">{preset.name}</span>
            </button>
          {/each}

          <!-- Custom Hex Input -->
          <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <input
              id="custom-color-picker"
              type="color"
              bind:value={primaryColor}
              oninput={handleInput}
              aria-label="Pilih warna kustom"
              class="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <label for="custom-hex-color" class="sr-only">Kode Warna Hex</label>
            <input
              id="custom-hex-color"
              type="text"
              bind:value={primaryColor}
              oninput={handleInput}
              class="w-20 font-mono text-xs uppercase text-slate-800 focus:outline-hidden"
              placeholder="#EA580C"
              maxlength="7"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Informasi Restoran & Operasional -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-base font-bold text-slate-900 sm:text-lg">Detail Operasional & Kontak Toko</h2>
        <p class="mt-1 text-xs text-slate-500">
          Informasi ini ditampilkan di halaman utama website publik agar pelanggan mudah menemukan dan menghubungi restoran.
        </p>
      </div>

      <div class="mt-6 grid gap-5 sm:grid-cols-2">
        <!-- Nama Usaha -->
        <div class="sm:col-span-2">
          <label for="businessName" class="block text-sm font-semibold text-slate-700">
            Nama Usaha Kuliner <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="businessName"
            bind:value={businessName}
            oninput={handleInput}
            required
            class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="Contoh: Dapur Bu Nia"
          />
        </div>

        <!-- Subdomain (Read Only) -->
        <div class="sm:col-span-2">
          <label for="subdomain-preview" class="block text-sm font-semibold text-slate-700">Alamat Website Toko (Subdomain)</label>
          <div class="mt-1.5 flex rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm shadow-2xs">
            <span class="font-semibold text-slate-900">{tenant?.subdomain ?? '-'}</span>
            <span class="text-slate-500">.restolink.site</span>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Subdomain didaftarkan secara permanen untuk identitas toko Anda. Hubungi administrator jika memerlukan migrasi subdomain.
          </p>
        </div>

        <!-- Deskripsi -->
        <div class="sm:col-span-2">
          <div class="flex items-center justify-between">
            <label for="description" class="block text-sm font-semibold text-slate-700">Deskripsi Singkat Usaha</label>
            <span class="text-xs text-slate-400">{description.length}/500</span>
          </div>
          <textarea
            id="description"
            rows="3"
            maxlength="500"
            bind:value={description}
            oninput={handleInput}
            class="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="Jelaskan keunikan rasa, spesialisasi menu, jam operasional, atau keunggulan bahan masakan Anda..."
          ></textarea>
        </div>

        <!-- WhatsApp Layanan Pelanggan -->
        <div>
          <label for="contactWhatsapp" class="block text-sm font-semibold text-slate-700">
            Nomor WhatsApp Restoran (Layanan Pelanggan)
          </label>
          <div class="relative mt-1.5">
            <input
              type="tel"
              id="contactWhatsapp"
              bind:value={contactWhatsapp}
              oninput={handleInput}
              class="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              placeholder="081234567890"
            />
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Digunakan untuk tombol "Tanya via WhatsApp" di katalog web pelanggan.
          </p>
        </div>

        <!-- Telepon Alternatif -->
        <div>
          <label for="contactPhone" class="block text-sm font-semibold text-slate-700">
            Nomor Telepon Toko Alternatif
          </label>
          <input
            type="tel"
            id="contactPhone"
            bind:value={contactPhone}
            oninput={handleInput}
            class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="021-77889900"
          />
        </div>

        <!-- Alamat Lengkap -->
        <div class="sm:col-span-2">
          <label for="address" class="block text-sm font-semibold text-slate-700">Alamat Lengkap Usaha</label>
          <textarea
            id="address"
            rows="2"
            bind:value={address}
            oninput={handleInput}
            class="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="Jl. Margonda Raya No. 45, Beji, Kota Depok, Jawa Barat 16424"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Section 3: Data Pemilik Akun -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-base font-bold text-slate-900 sm:text-lg">Informasi Akun Pemilik</h2>
        <p class="mt-1 text-xs text-slate-500">
          Data penanggung jawab akun dan kontak darurat sistem.
        </p>
      </div>

      <div class="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label for="fullName" class="block text-sm font-semibold text-slate-700">Nama Lengkap Pemilik</label>
          <input
            type="text"
            id="fullName"
            bind:value={fullName}
            oninput={handleInput}
            class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="Nama Pemilik"
          />
        </div>

        <div>
          <label for="ownerPhone" class="block text-sm font-semibold text-slate-700">Nomor Telepon Pribadi</label>
          <input
            type="tel"
            id="ownerPhone"
            bind:value={ownerPhone}
            oninput={handleInput}
            class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            placeholder="081234567890"
          />
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Actions -->
    <div class="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
      <button
        type="button"
        onclick={syncFormWithStore}
        disabled={!isDirty || saving}
        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
      >
        Batalkan Perubahan
      </button>

      <button
        type="submit"
        disabled={!isDirty || saving}
        class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {#if saving}
          <svg class="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Menyimpan...</span>
        {:else}
          <span>Simpan Perubahan</span>
        {/if}
      </button>
    </div>
  </form>
</div>
