<script lang="ts">
  import { cartStore } from '@/stores/cart.svelte';
  import { formatRupiah } from '@/lib/format';

  interface Props {
    tenantId: string;
    primaryColor?: string;
    onProceedCheckout: () => void;
  }

  let { tenantId, primaryColor = '#ea580c', onProceedCheckout }: Props = $props();

  let isOpen = $state(false);

  function openDrawer() {
    isOpen = true;
  }

  function closeDrawer() {
    isOpen = false;
  }

  function handleCheckout() {
    closeDrawer();
    onProceedCheckout();
  }
</script>

<!-- Floating Cart Bar (Hanya tampil jika ada item di keranjang) -->
{#if cartStore.totalItems > 0 && !isOpen}
  <aside
    aria-label="Ringkasan keranjang pesanan melayang"
    class="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-lg sm:bottom-6 sm:inset-x-auto sm:right-6 sm:w-96"
  >
    <div
      class="flex items-center justify-between rounded-2xl bg-slate-900/95 p-3.5 text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900"
    >
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
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-1.5">
            <span class="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
              {cartStore.totalItems} menu
            </span>
            <span class="text-xs text-slate-300">dipilih</span>
          </div>
          <p class="text-sm font-bold tracking-tight text-white">
            {cartStore.formattedSubtotal}
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={openDrawer}
        class="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-xs transition hover:bg-slate-100 active:scale-95"
      >
        <span>Lihat Keranjang</span>
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </aside>
{/if}

<!-- Drawer Modal Rincian Keranjang Belanja -->
{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop Blur -->
    <div
      role="button"
      tabindex="0"
      aria-label="Tutup keranjang"
      onclick={closeDrawer}
      onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeDrawer()}
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    ></div>

    <!-- Panel Drawer (Slide-over desktop, Bottom-sheet mobile) -->
    <div class="fixed inset-y-0 right-0 flex max-w-full">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        class="flex w-screen max-w-md flex-col justify-between bg-white shadow-2xl"
      >
        <!-- Header Drawer -->
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div class="flex items-center gap-2">
            <div
              class="flex size-8 items-center justify-center rounded-lg text-white"
              style="background-color: var(--brand-primary, {primaryColor});"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <h3 id="cart-title" class="text-base font-bold text-slate-900">
                Keranjang Belanja
              </h3>
              <p class="text-xs text-slate-500">
                {cartStore.totalItems} item terpilih
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup keranjang belanja"
            onclick={closeDrawer}
            class="rounded-xl p-2.5 -mr-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Daftar Item dalam Keranjang -->
        <div class="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {#if cartStore.items.length === 0}
            <div class="flex h-full flex-col items-center justify-center py-12 text-center">
              <div class="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg class="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h4 class="mt-3 text-base font-bold text-slate-900">Keranjang Masih Kosong</h4>
              <p class="mt-1 text-xs text-slate-500">
                Yuk pilih hidangan lezat dan minuman segar dari katalog menu!
              </p>
              <button
                type="button"
                onclick={closeDrawer}
                class="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
              >
                Pilih Menu
              </button>
            </div>
          {:else}
            {#each cartStore.items as item (item.menuItemId)}
              <div class="flex items-center justify-between py-3.5 gap-3">
                <!-- Info Menu -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {#if item.imageUrl}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        class="size-full object-cover"
                        loading="lazy"
                        onerror={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    {/if}
                    <div class="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                      <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>

                  <div class="truncate">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p class="text-xs text-slate-500">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                </div>

                <!-- Kontrol Kuantitas & Hapus -->
                <div class="flex items-center gap-2 shrink-0">
                  <div class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      aria-label="Kurangi kuantitas {item.name}"
                      onclick={() => cartStore.decrement(item.menuItemId)}
                      class="flex size-9 items-center justify-center rounded-md bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-90"
                    >
                      <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
                      </svg>
                    </button>

                    <span class="w-5 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Tambah kuantitas {item.name}"
                      onclick={() => cartStore.increment(item.menuItemId)}
                      class="flex size-9 items-center justify-center rounded-md text-white shadow-2xs active:scale-90"
                      style="background-color: var(--brand-primary, {primaryColor});"
                    >
                      <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <!-- Tombol Hapus Baris -->
                  <button
                    type="button"
                    aria-label="Hapus menu {item.name}"
                    onclick={() => cartStore.removeItem(item.menuItemId)}
                    class="rounded-lg p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Footer Ringkasan Pembayaran & Tombol Checkout -->
        {#if cartStore.items.length > 0}
          <div class="border-t border-slate-200 bg-slate-50/80 p-6 space-y-4">
            <div class="space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span>Total Item</span>
                <span class="font-medium text-slate-800">{cartStore.totalItems} porsi</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>Total Tagihan</span>
                <span class="text-base font-extrabold" style="color: var(--brand-primary, {primaryColor});">
                  {cartStore.formattedSubtotal}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onclick={handleCheckout}
                class="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-98"
                style="background-color: var(--brand-primary, {primaryColor});"
              >
                <span>Lanjut Isi Data Pemesan</span>
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                type="button"
                onclick={() => cartStore.clearCart()}
                class="text-center text-xs font-medium text-slate-400 hover:text-rose-600 transition py-1"
              >
                Kosongkan Keranjang
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
