<script lang="ts">
  import { guestOrderStore } from '@/stores/guest-order.svelte';
  import { formatRupiah, formatDate } from '@/lib/format';
  import Badge from '@/components/ui/Badge.svelte';

  interface Props {
    open: boolean;
    tenantId: string;
    businessName: string;
    primaryColor?: string;
    onClose: () => void;
  }

  let { open, tenantId, businessName, primaryColor = '#ea580c', onClose }: Props = $props();

  let copied = $state(false);

  const formattedCode = $derived.by(() => {
    const raw = guestOrderStore.activeOrderCode;
    if (!raw) return '';
    return raw.startsWith('#') ? raw : `#${raw}`;
  });

  const orderDetail = $derived(guestOrderStore.orderDetail);

  async function handleCopy() {
    if (!formattedCode) return;
    try {
      await navigator.clipboard.writeText(formattedCode);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    } catch (err) {
      console.warn('Gagal menyalin kode:', err);
    }
  }

  function handleRefresh() {
    if (!tenantId || !guestOrderStore.activeOrderCode) return;
    guestOrderStore.track(tenantId, guestOrderStore.activeOrderCode);
  }

  function handleFinish() {
    guestOrderStore.reset(tenantId);
    onClose();
  }
</script>

{#if open && guestOrderStore.activeOrderCode}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop Blur -->
    <div
      role="button"
      tabindex="0"
      aria-label="Tutup bukti pesanan"
      onclick={onClose}
      onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && onClose()}
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    ></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        class="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-lg p-6 sm:p-8"
      >
        <!-- Header: Success Icon & Restaurant Name -->
        <div class="text-center">
          <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
            <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 id="receipt-title" class="mt-4 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Pesanan Berhasil Terkirim!
          </h3>
          <p class="mt-1 text-xs text-slate-500 sm:text-sm">
            Pesanan Anda telah diterima oleh <strong>{businessName}</strong>.
          </p>
        </div>

        <!-- Big Prominent Order Code Box -->
        <div class="mt-6 rounded-2xl border-2 border-dashed border-brand-500/30 bg-brand-50/40 p-5 text-center">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Kode Pesanan Anda
          </span>

          <div class="mt-1 text-3xl font-black tracking-wider text-slate-900 sm:text-4xl">
            {formattedCode}
          </div>

          <!-- Tombol Salin Kode Pesanan -->
          <button
            type="button"
            onclick={handleCopy}
            class="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold shadow-2xs transition hover:bg-slate-50 active:scale-95 {copied
              ? 'text-emerald-600 border-emerald-300'
              : 'text-slate-800'}"
          >
            {#if copied}
              <svg class="size-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Kode Berhasil Disalin!</span>
            {:else}
              <svg class="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Salin Kode Pesanan</span>
            {/if}
          </button>
        </div>

        <!-- Live Status Tracking Card -->
        <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-600">Status Pesanan:</span>
            <div class="flex items-center gap-2">
              {#if !guestOrderStore.isTerminal}
                <!-- Live Pulsing Beacon -->
                <span class="relative flex size-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full size-2.5 bg-brand-500"></span>
                </span>
              {/if}
              <Badge tone={guestOrderStore.statusTone} label={guestOrderStore.statusLabel} />
            </div>
          </div>

          <!-- Petunjuk Kasir -->
          <div class="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-100">
            <svg class="mt-0.5 size-4 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Tunjukkan <strong>{formattedCode}</strong> ke kasir untuk proses pembayaran & konfirmasi. Status pesanan akan terbarui secara otomatis saat diproses.
            </p>
          </div>
        </div>

        <!-- Rincian Pesanan (Snapshot Item) -->
        {#if orderDetail}
          <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 text-xs text-slate-500">
              <span>Pemesan: <strong class="text-slate-900">{orderDetail.buyer_name || '-'}</strong></span>
              {#if orderDetail.created_at}
                <span>{formatDate(orderDetail.created_at)}</span>
              {/if}
            </div>

            {#if orderDetail.note}
              <div class="mt-2 text-xs text-slate-600 bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                <span class="font-bold text-amber-900">Catatan/Meja:</span> {orderDetail.note}
              </div>
            {/if}

            {#if orderDetail.items && orderDetail.items.length > 0}
              <div class="mt-3 max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs">
                {#each orderDetail.items as item}
                  <div class="flex items-center justify-between py-2">
                    <div>
                      <span class="font-semibold text-slate-900">{item.name}</span>
                      <span class="text-slate-400"> × {item.quantity}</span>
                    </div>
                    <span class="font-medium text-slate-700">{formatRupiah(item.subtotal)}</span>
                  </div>
                {/each}
              </div>
            {/if}

            <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
              <span>Total Pembayaran:</span>
              <span class="text-base font-extrabold" style="color: var(--brand-primary, {primaryColor});">
                {formatRupiah(orderDetail.total_amount || 0)}
              </span>
            </div>
          </div>
        {/if}

        <!-- Actions / Navigation -->
        <div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onclick={handleRefresh}
            disabled={guestOrderStore.trackingLoading}
            class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-50"
          >
            {#if guestOrderStore.trackingLoading}
              <svg class="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            {/if}
            <span>Perbarui Status</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={onClose}
              class="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Lihat Menu Lagi
            </button>

            <button
              type="button"
              onclick={handleFinish}
              class="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
              style="background-color: var(--brand-primary, {primaryColor});"
            >
              Pesanan Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
