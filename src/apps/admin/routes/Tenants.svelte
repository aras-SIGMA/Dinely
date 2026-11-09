<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminStore,
    getTenantStatusLabel,
    getTenantStatusTone,
    formatDate,
    type TenantStatusFilter
  } from '@/stores/admin.svelte';
  import Badge from '@/components/ui/Badge.svelte';
  import Button from '@/components/ui/Button.svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import StatCard from '../components/StatCard.svelte';
  import StatusDistribution from '../components/StatusDistribution.svelte';
  import type { AdminTenantItem, TenantStatus } from '@/types';

  let selectedTenant = $state<AdminTenantItem | null>(null);
  let isOverrideModalOpen = $state(false);

  // Form override modal
  let targetStatus = $state<TenantStatus>('active');
  let extendDays = $state<number>(30);
  let selectedPackageId = $state<string>('');
  let overrideReason = $state<string>('');
  let isSaving = $state(false);

  onMount(() => {
    adminStore.fetchTenants();
    adminStore.fetchPackages();
    adminStore.startPolling(30000);

    return () => {
      adminStore.stopPolling();
    };
  });

  function openOverrideModal(tenant: AdminTenantItem) {
    selectedTenant = tenant;
    targetStatus = tenant.status;
    selectedPackageId = tenant.current_package_id || '';
    extendDays = 30;
    overrideReason = '';
    isOverrideModalOpen = true;
  }

  function closeOverrideModal() {
    isOverrideModalOpen = false;
    selectedTenant = null;
  }

  async function handleSaveOverride() {
    if (!selectedTenant) return;
    isSaving = true;

    try {
      const ok = await adminStore.updateTenantStatus(selectedTenant.id, targetStatus, {
        extendDays: extendDays > 0 ? extendDays : undefined,
        packageId: selectedPackageId || null,
        reason: overrideReason
      });

      if (ok) {
        closeOverrideModal();
      }
    } finally {
      isSaving = false;
    }
  }

  const statusFilters: { key: TenantStatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'trial', label: 'Trial' },
    { key: 'pending', label: 'Pending' },
    { key: 'suspended', label: 'Ditangguhkan' },
    { key: 'expired', label: 'Kedaluwarsa' }
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Monitoring Tenant</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-500">
        Kelola seluruh pendaftaran usaha kuliner, status akun, dan manual override aktivasi.
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        loading={adminStore.loadingTenants}
        onclick={() => adminStore.fetchTenants()}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="size-4"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992V7.348m-4.992 0l-3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Segarkan
      </Button>
    </div>
  </div>

  <!-- Metric Stat Cards (shadcn-style) -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
    <StatCard
      label="Total Tenant"
      value={adminStore.tenantCounts.all}
      tone="neutral"
      iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      hint="Seluruh usaha terdaftar"
    />
    <StatCard
      label="Aktif"
      value={adminStore.tenantCounts.active}
      tone="success"
      iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      hint="Langganan berjalan"
    />
    <StatCard
      label="Trial"
      value={adminStore.tenantCounts.trial}
      tone="brand"
      iconPath="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.346L11.48 3.5Z"
      hint="Masa percobaan"
    />
    <StatCard
      label="Pending"
      value={adminStore.tenantCounts.pending}
      tone="warning"
      iconPath="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      hint="Menunggu bayar"
    />
    <StatCard
      label="Ditangguhkan"
      value={adminStore.tenantCounts.suspended}
      tone="danger"
      iconPath="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      hint="Akses dibekukan"
    />
    <StatCard
      label="Kedaluwarsa"
      value={adminStore.tenantCounts.expired}
      tone="neutral"
      iconPath="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      hint="Perlu perpanjangan"
    />
  </div>

  <div class="grid items-start gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">

  <!-- Filters & Search -->
  <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
    <!-- Filter Tabs -->
    <div class="flex flex-wrap gap-1.5">
      {#each statusFilters as f}
        <button
          type="button"
          onclick={() => (adminStore.tenantStatusFilter = f.key)}
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors {adminStore.tenantStatusFilter === f.key ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
        >
          {f.label}
          <span
            class="rounded-full px-1.5 py-0.2 text-[10px] {adminStore.tenantStatusFilter === f.key ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}"
          >
            {adminStore.tenantCounts[f.key]}
          </span>
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="relative w-full sm:w-64">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <input
        type="search"
        placeholder="Cari resto, subdomain, pemilik..."
        bind:value={adminStore.tenantSearchQuery}
        class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  </div>

  <!-- Data Table -->
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
    {#if adminStore.loadingTenants && adminStore.tenants.length === 0}
      <div class="flex flex-col items-center justify-center p-12 text-slate-400">
        <div class="size-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
        <p class="mt-3 text-sm">Memuat data tenant...</p>
      </div>
    {:else if adminStore.filteredTenants.length === 0}
      <div class="p-12 text-center text-slate-500">
        <svg class="mx-auto size-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <p class="mt-2 text-sm font-medium text-slate-700">Tidak ada tenant ditemukan</p>
        <p class="mt-1 text-xs text-slate-400">
          Coba sesuaikan kata kunci pencarian atau filter status tenant.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-xs text-slate-600">
          <thead class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase">
            <tr>
              <th scope="col" class="px-4 py-3">Usaha & Subdomain</th>
              <th scope="col" class="px-4 py-3">Pemilik</th>
              <th scope="col" class="px-4 py-3">Paket</th>
              <th scope="col" class="px-4 py-3">Status</th>
              <th scope="col" class="px-4 py-3">Masa Aktif</th>
              <th scope="col" class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each adminStore.filteredTenants as tenant (tenant.id)}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <!-- Usaha & Subdomain -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    {#if tenant.logo_url}
                      <img
                        src={tenant.logo_url}
                        alt={tenant.business_name}
                        class="size-8 shrink-0 rounded-lg object-cover border border-slate-200"
                      />
                    {:else}
                      <div
                        class="flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-xs"
                        style="background-color: {tenant.primary_color || '#ea580c'}"
                      >
                        {tenant.business_name.slice(0, 1).toUpperCase()}
                      </div>
                    {/if}
                    <div>
                      <p class="font-semibold text-slate-900">{tenant.business_name}</p>
                      <a
                        href="/?tenant={tenant.subdomain}"
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 hover:underline"
                      >
                        {tenant.subdomain}.restolink.site
                        <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fill-rule="evenodd"
                            d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h4a.75.75 0 0 1 0 1.5h-4Z"
                            clip-rule="evenodd"
                          />
                          <path
                            fill-rule="evenodd"
                            d="M6.194 12.753a.75.75 0 0 0 1.06 1.06L13.5 7.56v3.69a.75.75 0 0 0 1.5 0V5.25a.75.75 0 0 0-.75-.75H9.5a.75.75 0 0 0 0 1.5h3.69l-6.996 7.003Z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </td>

                <!-- Pemilik -->
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{tenant.owner?.full_name || 'Tidak diketahui'}</p>
                  <p class="text-slate-400">{tenant.contact_phone || tenant.owner?.phone || '-'}</p>
                </td>

                <!-- Paket -->
                <td class="px-4 py-3">
                  {#if tenant.package}
                    <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {tenant.package.name}
                    </span>
                  {:else}
                    <span class="text-slate-400 italic">Belum Ada</span>
                  {/if}
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <Badge
                    tone={getTenantStatusTone(tenant.status)}
                    label={getTenantStatusLabel(tenant.status)}
                  />
                </td>

                <!-- Masa Aktif -->
                <td class="px-4 py-3">
                  {#if tenant.status === 'active'}
                    <p class="text-slate-800">{formatDate(tenant.subscription_ends_at)}</p>
                    <p class="text-[10px] text-emerald-600">Berlangganan Aktif</p>
                  {:else if tenant.status === 'trial'}
                    <p class="text-slate-800">{formatDate(tenant.trial_ends_at)}</p>
                    <p class="text-[10px] text-brand-600">Masa Percobaan</p>
                  {:else}
                    <p class="text-slate-400">-</p>
                  {/if}
                </td>

                <!-- Aksi -->
                <td class="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={adminStore.updatingTenantId === tenant.id}
                    onclick={() => openOverrideModal(tenant)}
                  >
                    Override
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    </div>
  </div>

    <!-- Chart distribusi status tenant (data store existing) -->
    <StatusDistribution
      title="Distribusi Status Tenant"
      description="Proporsi seluruh tenant berdasarkan status langganan"
      emptyLabel="Belum ada tenant terdaftar"
      items={[
        { label: 'Aktif', count: adminStore.tenantCounts.active, color: 'bg-green-500' },
        { label: 'Trial', count: adminStore.tenantCounts.trial, color: 'bg-brand-500' },
        { label: 'Pending', count: adminStore.tenantCounts.pending, color: 'bg-amber-500' },
        { label: 'Ditangguhkan', count: adminStore.tenantCounts.suspended, color: 'bg-red-500' },
        { label: 'Kedaluwarsa', count: adminStore.tenantCounts.expired, color: 'bg-slate-400' }
      ]}
    />
  </div>
</div>

<!-- Modal Manual Override Status Tenant -->
<Modal
  bind:open={isOverrideModalOpen}
  title="Manual Override Status Tenant"
  description="Ubah status aktivasi tenant untuk membantu penanganan masalah aktivasi atau komplain."
  onclose={closeOverrideModal}
>
  {#if selectedTenant}
    <div class="space-y-4">
      <!-- Info Ringkas Tenant -->
      <div class="rounded-lg bg-slate-50 p-3 border border-slate-200">
        <p class="text-xs font-semibold text-slate-900">{selectedTenant.business_name}</p>
        <p class="text-[11px] text-slate-500 font-mono">{selectedTenant.subdomain}.restolink.site</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-[11px] text-slate-500">Status Sekarang:</span>
          <Badge
            tone={getTenantStatusTone(selectedTenant.status)}
            label={getTenantStatusLabel(selectedTenant.status)}
          />
        </div>
      </div>

      <!-- Pilih Target Status Baru -->
      <div>
        <label for="targetStatus" class="block text-xs font-semibold text-slate-700">
          Ubah Status Menjadi <span class="text-red-500">*</span>
        </label>
        <select
          id="targetStatus"
          bind:value={targetStatus}
          class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="active">active (Aktif - Web publik menerima pesanan)</option>
          <option value="trial">trial (Masa Percobaan)</option>
          <option value="pending">pending (Menunggu Pembayaran Awal)</option>
          <option value="suspended">suspended (Ditangguhkan / Blokir Akses)</option>
          <option value="expired">expired (Kedaluwarsa)</option>
        </select>
      </div>

      <!-- Paket Langganan -->
      {#if adminStore.packages.length > 0}
        <div>
          <label for="packageSelect" class="block text-xs font-semibold text-slate-700">
            Tetapkan Paket
          </label>
          <select
            id="packageSelect"
            bind:value={selectedPackageId}
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Tetap Pakai Paket Saat Ini --</option>
            {#each adminStore.packages as pkg}
              <option value={pkg.id}>{pkg.name} ({pkg.tier})</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Opsi Masa Aktif -->
      {#if targetStatus === 'active' || targetStatus === 'trial'}
        <div>
          <label for="extendDaysInput" class="block text-xs font-semibold text-slate-700">
            Masa Berlaku (Hari dari sekarang)
          </label>
          <div class="mt-1.5 flex items-center gap-2">
            <input
              id="extendDaysInput"
              type="number"
              min="1"
              max="365"
              bind:value={extendDays}
              class="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span class="text-xs text-slate-500">Hari (default: 30 hari)</span>
          </div>
        </div>
      {/if}

      <!-- Catatan Audit / Alasan Override -->
      <div>
        <label for="overrideReason" class="block text-xs font-semibold text-slate-700">
          Catatan / Alasan Override <span class="text-slate-400">(Audit trail)</span>
        </label>
        <textarea
          id="overrideReason"
          rows="2"
          placeholder="Misal: Konfirmasi transfer manual WhatsApp CS, kendala webhook Midtrans..."
          bind:value={overrideReason}
          class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        ></textarea>
      </div>

      <!-- Warning Notice -->
      <div class="rounded-lg bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-800">
        <p class="font-semibold">Perhatian Akses Admin:</p>
        <p class="mt-0.5">
          Perubahan status ini akan langsung berpengaruh pada ketersediaan website publik tenant dan akses dashboard pemilik.
        </p>
      </div>
    </div>
  {/if}

  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={closeOverrideModal}>Batal</Button>
    <Button
      variant="primary"
      size="sm"
      loading={isSaving}
      onclick={handleSaveOverride}
    >
      Simpan Perubahan
    </Button>
  {/snippet}
</Modal>
