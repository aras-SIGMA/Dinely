<script lang="ts">
  import { authStore } from '@/stores/auth.svelte';
  import { formatRupiah } from '@/lib/format';
  import {
    buildCombinedCsv,
    computeActivityReport,
    computeRevenueReport,
    resolveRange,
    type ReportRangeMode,
    type ReportRange
  } from '@/lib/reports';
  import { fetchReportOrders } from '@/lib/reports-data';
  import Badge from '@/components/ui/Badge.svelte';

  type ReportTab = 'revenue' | 'activity';

  let activeTab = $state<ReportTab>('revenue');
  let rangeMode = $state<ReportRangeMode>(30);
  let customStart = $state('');
  let customEnd = $state('');
  let orders = $state<Awaited<ReturnType<typeof fetchReportOrders>>>([]);
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  const rangePresets: { id: ReportRangeMode; label: string }[] = [
    { id: 7, label: '7 Hari' },
    { id: 30, label: '30 Hari' },
    { id: 90, label: '90 Hari' },
    { id: 'custom', label: 'Kustom' }
  ];

  const range: ReportRange = $derived(
    resolveRange(rangeMode, customStart || undefined, customEnd || undefined)
  );

  const revenue = $derived(computeRevenueReport(orders, range));
  const activity = $derived(computeActivityReport(orders, range));

  const maxDailyRevenue = $derived(
    Math.max(...revenue.daily.map((bucket) => bucket.value), 1)
  );
  const maxDailyOrders = $derived(
    Math.max(...activity.daily.map((bucket) => bucket.count), 1)
  );
  const maxHourly = $derived(Math.max(...activity.hourly.map((bucket) => bucket.count), 1));

  async function loadReports(): Promise<void> {
    const currentTenantId = authStore.tenant?.id;
    if (!currentTenantId) return;

    loading = true;
    errorMessage = null;
    try {
      orders = await fetchReportOrders(currentTenantId, range);
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal memuat data laporan.';
      orders = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const currentTenantId = authStore.tenant?.id;
    range.startISO;
    range.endISO;
    if (!currentTenantId) return;
    void loadReports();
  });

  function selectRange(mode: ReportRangeMode): void {
    rangeMode = mode;
  }

  function exportCsv(): void {
    const csv = buildCombinedCsv(revenue, activity, range);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-dinely-${range.startDateKey}_${range.endDateKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function durationLabel(minutes: number | null): string {
    if (minutes === null) return '-';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} jam ${rest} menit` : `${hours} jam`;
  }

  function hourLabel(hour: number | null): string {
    return hour === null ? '-' : `${String(hour).padStart(2, '0')}:00`;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Laporan &amp; Analitik
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Pantau pendapatan nyata dan aktivitas operasional usaha Anda dalam satu tempat.
      </p>
    </div>

    <button
      type="button"
      onclick={exportCsv}
      disabled={loading || orders.length === 0}
      class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
      </svg>
      <span>Unduh CSV</span>
    </button>
  </div>

  <!-- Controls: rentang waktu + tab laporan -->
  <div class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
    <div class="flex flex-wrap items-center gap-2">
      {#each rangePresets as preset (String(preset.id))}
        <button
          type="button"
          onclick={() => selectRange(preset.id)}
          aria-pressed={rangeMode === preset.id}
          class="inline-flex min-h-[44px] items-center rounded-xl px-3.5 py-2 text-xs font-semibold transition {rangeMode ===
          preset.id
            ? 'bg-slate-950 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          {preset.label}
        </button>
      {/each}

      {#if rangeMode === 'custom'}
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="date"
            bind:value={customStart}
            aria-label="Tanggal mulai laporan"
            class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none"
          />
          <span class="text-xs text-slate-400">sampai</span>
          <input
            type="date"
            bind:value={customEnd}
            aria-label="Tanggal akhir laporan"
            class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none"
          />
        </div>
      {/if}
    </div>

    <div
      role="tablist"
      aria-label="Jenis laporan"
      class="inline-flex items-center rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'revenue'}
        onclick={() => (activeTab = 'revenue')}
        class="flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all {activeTab ===
        'revenue'
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-600 hover:text-slate-950'}"
      >
        Pendapatan
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'activity'}
        onclick={() => (activeTab = 'activity')}
        class="flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all {activeTab ===
        'activity'
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-600 hover:text-slate-950'}"
      >
        Aktivitas Pesanan
      </button>
    </div>
  </div>

  <p class="text-xs text-slate-500">
    Rentang: <strong>{range.startDateKey}</strong> s/d <strong>{range.endDateKey}</strong>
    (zona waktu Asia/Jakarta)
  </p>

  {#if loading}
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each Array(4) as _, index (index)}
          <div class="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
        {/each}
      </div>
      <div class="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
    </div>
  {:else if errorMessage}
    <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-sm font-semibold text-red-700">Gagal memuat laporan</p>
      <p class="mt-1 text-xs text-red-600">{errorMessage}</p>
      <button
        type="button"
        onclick={loadReports}
        class="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
      >
        Coba Lagi
      </button>
    </div>
  {:else if orders.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-12 text-center">
      <p class="text-sm font-semibold text-slate-700">Belum ada pesanan pada rentang ini</p>
      <p class="mt-1 text-xs text-slate-500">
        Coba pilih rentang waktu yang lebih panjang atau mulai terima pesanan dari pelanggan.
      </p>
    </div>
  {:else if activeTab === 'revenue'}
    <!-- ==================== LAPORAN PENDAPATAN ==================== -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Total Omzet</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">
          {formatRupiah(revenue.totalRevenue)}
        </p>
        <p class="mt-1 text-[11px] text-slate-500">Hanya dari pesanan selesai</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Pesanan Selesai</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{revenue.completedOrders}</p>
        <p class="mt-1 text-[11px] text-slate-500">Transaksi tuntas pada rentang ini</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Rata-rata Nilai Pesanan</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">
          {formatRupiah(revenue.averageOrderValue)}
        </p>
        <p class="mt-1 text-[11px] text-slate-500">Omzet dibagi pesanan selesai</p>
      </div>
    </div>

    <!-- Grafik omzet harian -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <header class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Tren Omzet Harian</h2>
          <p class="mt-0.5 text-xs text-slate-500">Batang tertinggi menandakan hari paling produktif.</p>
        </div>
      </header>

      <div class="mt-5 flex items-end gap-1.5 overflow-x-auto pb-2">
        {#each revenue.daily as bucket (bucket.dateKey)}
          <div class="group flex min-w-[18px] flex-1 flex-col items-center justify-end">
            <span class="mb-1 text-[9px] font-semibold tabular-nums text-slate-400 opacity-0 transition group-hover:opacity-100">
              {bucket.value > 0 ? formatRupiah(bucket.value) : ''}
            </span>
            <div
              class="w-full rounded-t-md bg-brand-500 transition-all duration-300 hover:bg-brand-600"
              style={`height: ${Math.max(2, (bucket.value / maxDailyRevenue) * 140)}px`}
              role="img"
              aria-label={`${bucket.dateKey}: ${formatRupiah(bucket.value)} dari ${bucket.count} pesanan`}
            ></div>
            <span class="mt-1.5 text-[9px] text-slate-400">{bucket.label}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Menu terlaris -->
    <section class="rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <header class="border-b border-slate-100 px-5 py-4">
        <h2 class="text-sm font-bold text-slate-900">Menu Terlaris</h2>
        <p class="mt-0.5 text-xs text-slate-500">Diurutkan berdasarkan kontribusi omzet.</p>
      </header>

      {#if revenue.topMenus.length === 0}
        <p class="p-5 text-center text-xs text-slate-400">Belum ada item terjual.</p>
      {:else}
        <div class="divide-y divide-slate-100">
          {#each revenue.topMenus as menu, index (menu.name)}
            <div class="flex items-center justify-between gap-4 px-5 py-3">
              <div class="flex min-w-0 items-center gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">
                  {index + 1}
                </span>
                <p class="truncate text-xs font-semibold text-slate-800">{menu.name}</p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-xs font-bold tabular-nums text-slate-900">{formatRupiah(menu.revenue)}</p>
                <p class="text-[11px] text-slate-500">{menu.quantity} terjual</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <!-- ==================== LAPORAN AKTIVITAS ==================== -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Total Pesanan Masuk</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{activity.totalOrders}</p>
        <p class="mt-1 text-[11px] text-slate-500">Termasuk pesanan dibatalkan</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Pesanan Aktif</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">{activity.activeOrders}</p>
        <p class="mt-1 text-[11px] text-slate-500">Tidak termasuk yang dibatalkan</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Tingkat Pembatalan</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">
          {activity.cancellationRate.toFixed(1)}%
        </p>
        <p class="mt-1 text-[11px] text-slate-500">{activity.statusCounts.dibatalkan} pesanan batal</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <p class="text-xs font-semibold text-slate-500">Rata-rata Penyelesaian</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900">
          {durationLabel(activity.averageFulfillmentMinutes)}
        </p>
        <p class="mt-1 text-[11px] text-slate-500">
          Dari {activity.measuredFulfillmentOrders} pesanan selesai
        </p>
      </div>
    </div>

    <!-- Distribusi status -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <header class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Distribusi Status Pesanan</h2>
          <p class="mt-0.5 text-xs text-slate-500">Gambaran posisi seluruh pesanan pada rentang ini.</p>
        </div>
        {#if activity.busiestHour !== null}
          <Badge tone="brand" label={`Jam tersibuk ${hourLabel(activity.busiestHour)}`} />
        {/if}
      </header>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each [
          { key: 'baru', label: 'Baru', color: 'bg-brand-500' },
          { key: 'diproses', label: 'Diproses', color: 'bg-amber-500' },
          { key: 'selesai', label: 'Selesai', color: 'bg-emerald-500' },
          { key: 'dibatalkan', label: 'Dibatalkan', color: 'bg-red-500' }
        ] as item (item.key)}
          <div class="rounded-xl border border-slate-200 p-4">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full {item.color}"></span>
              <span class="text-xs font-semibold text-slate-600">{item.label}</span>
            </div>
            <p class="mt-2 text-xl font-extrabold tabular-nums text-slate-900">
              {activity.statusCounts[item.key as keyof typeof activity.statusCounts]}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- Grafik pesanan harian -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <header>
        <h2 class="text-sm font-bold text-slate-900">Volume Pesanan Harian</h2>
        <p class="mt-0.5 text-xs text-slate-500">Seluruh pesanan masuk, termasuk yang dibatalkan.</p>
      </header>

      <div class="mt-5 flex items-end gap-1.5 overflow-x-auto pb-2">
        {#each activity.daily as bucket (bucket.dateKey)}
          <div class="group flex min-w-[18px] flex-1 flex-col items-center justify-end">
            <span class="mb-1 text-[9px] font-semibold tabular-nums text-slate-400 opacity-0 transition group-hover:opacity-100">
              {bucket.count > 0 ? bucket.count : ''}
            </span>
            <div
              class="w-full rounded-t-md bg-slate-700 transition-all duration-300 hover:bg-slate-900"
              style={`height: ${Math.max(2, (bucket.count / maxDailyOrders) * 140)}px`}
              role="img"
              aria-label={`${bucket.dateKey}: ${bucket.count} pesanan`}
            ></div>
            <span class="mt-1.5 text-[9px] text-slate-400">{bucket.label}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Jam sibuk -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <header>
        <h2 class="text-sm font-bold text-slate-900">Distribusi Jam Sibuk</h2>
        <p class="mt-0.5 text-xs text-slate-500">Jumlah pesanan masuk per jam (Asia/Jakarta).</p>
      </header>

      <div class="mt-5 flex items-end gap-1 overflow-x-auto pb-2">
        {#each activity.hourly as bucket (bucket.hour)}
          <div class="group flex min-w-[16px] flex-1 flex-col items-center justify-end">
            <div
              class="w-full rounded-t-sm bg-brand-300 transition-all duration-300 hover:bg-brand-500"
              style={`height: ${Math.max(2, (bucket.count / maxHourly) * 110)}px`}
              role="img"
              aria-label={`Jam ${bucket.label}: ${bucket.count} pesanan`}
            ></div>
            {#if bucket.hour % 3 === 0}
              <span class="mt-1.5 text-[9px] text-slate-400">{String(bucket.hour).padStart(2, '0')}</span>
            {:else}
              <span class="mt-1.5 text-[9px] text-transparent">·</span>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
