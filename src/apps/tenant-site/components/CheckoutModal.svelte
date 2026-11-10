<script lang="ts">
  import { cartStore } from '@/stores/cart.svelte';
  import { guestOrderStore, type SubmitOrderForm } from '@/stores/guest-order.svelte';
  import { formatRupiah } from '@/lib/format';

  interface Props {
    open: boolean;
    tenantId: string;
    primaryColor?: string;
    onClose: () => void;
    onSuccess: () => void;
  }

  let { open, tenantId, primaryColor = '#ea580c', onClose, onSuccess }: Props = $props();

  let buyerName = $state('');
  let note = $state('');
  let validationError = $state<string | null>(null);

  function resetForm() {
    buyerName = '';
    note = '';
    validationError = null;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    validationError = null;

    const trimmedName = buyerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      validationError = 'Nama pemesan wajib diisi (minimal 2 karakter).';
      return;
    }

    if (cartStore.isEmpty) {
      validationError = 'Keranjang belanja Anda masih kosong.';
      return;
    }

    const form: SubmitOrderForm = {
      buyerName: trimmedName,
      buyerContact: null,
      note: note.trim() || null
    };

    const result = await guestOrderStore.submit(tenantId, form);
    if (result) {
      resetForm();
      onSuccess();
    }
  }

  function handleCancel() {
    if (guestOrderStore.submitting) return;
    resetForm();
    onClose();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      role="button"
      tabindex="0"
      aria-label="Tutup form pemesanan"
      onclick={handleCancel}
      onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && handleCancel()}
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    ></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg p-6 sm:p-8"
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl text-white shadow-xs"
              style="background-color: var(--brand-primary, {primaryColor});"
            >
              <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 id="checkout-modal-title" class="text-lg font-bold text-slate-900">
                Konfirmasi Pesanan
              </h3>
              <p class="text-xs text-slate-500">
                Isi data diri untuk memproses pesanan ke kasir
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={guestOrderStore.submitting}
            onclick={handleCancel}
            aria-label="Tutup modal konfirmasi pesanan"
            class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50"
          >
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Snapshot Ringkasan Pesanan Singkat -->
        <div class="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
          <div class="flex items-center justify-between text-xs text-slate-600">
            <span class="font-medium">Total Pesanan:</span>
            <span class="font-bold text-slate-900">{cartStore.totalItems} menu</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-sm font-extrabold text-slate-900">
            <span>Total Tagihan:</span>
            <span style="color: var(--brand-primary, {primaryColor});">
              {cartStore.formattedSubtotal}
            </span>
          </div>
        </div>

        <!-- Form Pemesanan -->
        <form onsubmit={handleSubmit} class="mt-5 space-y-4">
          {#if validationError || guestOrderStore.errorMessage}
            <div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {validationError || guestOrderStore.errorMessage}
            </div>
          {/if}

          <!-- Nama Pemesan (Wajib) -->
          <div>
            <label for="buyer-name" class="block text-xs font-bold text-slate-700">
              Nama Pemesan <span class="text-rose-500">*</span>
            </label>
            <input
              id="buyer-name"
              type="text"
              required
              disabled={guestOrderStore.submitting}
              bind:value={buyerName}
              placeholder="Contoh: Budi Santoso"
              class="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs transition focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100"
            />
            <p class="mt-1 text-[11px] text-slate-500">
              Nama yang akan dipanggil oleh pelayan atau kasir.
            </p>
          </div>

          <!-- Catatan / Nomor Meja (Opsional) -->
          <div>
            <label for="order-note" class="block text-xs font-bold text-slate-700">
              Nomor Meja / Catatan Khusus <span class="font-normal text-slate-400">(Opsional)</span>
            </label>
            <textarea
              id="order-note"
              rows="2"
              disabled={guestOrderStore.submitting}
              bind:value={note}
              placeholder="Contoh: Meja 4 / Jangan terlalu pedas ya kak"
              class="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs transition focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100"
            ></textarea>
          </div>

          <!-- Tombol Aksi -->
          <div class="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={guestOrderStore.submitting}
              onclick={handleCancel}
              class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={guestOrderStore.submitting}
              class="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
              style="background-color: var(--brand-primary, {primaryColor});"
            >
              {#if guestOrderStore.submitting}
                <svg class="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Mengirim Pesanan...</span>
              {:else}
                <span>Pesan Sekarang</span>
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
