<script lang="ts">
  import { onMount } from 'svelte';
  import { cartStore } from '@/stores/cart.svelte';
  import { fetchTenantMenu, type TenantMenuData } from '@/lib/tenant-menu';
  import { formatRupiah } from '@/lib/format';
  import Badge from '@/components/ui/Badge.svelte';
  import Skeleton from '@/components/ui/Skeleton.svelte';
  import type { Category, MenuItem } from '@/types';

  interface Props {
    tenantId: string;
    primaryColor?: string;
  }

  let { tenantId, primaryColor = '#ea580c' }: Props = $props();

  let categories = $state<Category[]>([]);
  let menuItems = $state<MenuItem[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let selectedCategoryId = $state<string | null>(null);
  let searchQuery = $state('');

  async function loadMenu() {
    if (!tenantId) return;
    loading = true;
    error = null;
    try {
      const data: TenantMenuData = await fetchTenantMenu(tenantId);
      categories = data.categories;
      menuItems = data.items;
    } catch (err: any) {
      console.error('[MenuCatalog] Error loading menu:', err);
      error = err?.message || 'Gagal memuat katalog menu.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadMenu();
  });

  // Hitung jumlah item per kategori
  const categoryCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const item of menuItems) {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    }
    return counts;
  });

  // Filter daftar menu berdasarkan kategori & pencarian kata kunci
  const filteredItems = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchCategory = !selectedCategoryId || item.category_id === selectedCategoryId;
      if (!matchCategory) return false;

      if (!query) return true;
      const matchName = item.name.toLowerCase().includes(query);
      const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
      return matchName || matchDesc;
    });
  });

  function getCategoryName(categoryId: string): string | null {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : null;
  }

  function handleAddToCart(item: MenuItem) {
    if (!item.is_available) return;
    cartStore.addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.image_url,
      categoryName: getCategoryName(item.category_id),
      is_available: item.is_available
    });
  }
</script>

<section class="mt-8">
  <!-- Baris Judul & Pencarian Menu -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Daftar Menu Pilihan
      </h2>
      <p class="text-xs text-slate-500 sm:text-sm">
        Pilih menu favorit Anda dan pesan langsung tanpa perlu antre.
      </p>
    </div>

    <!-- Search Input -->
    <div class="relative w-full sm:w-64">
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Cari menu lezat..."
        aria-label="Cari menu makanan atau minuman"
        class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 sm:text-sm"
      />
      <svg
        class="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {#if searchQuery}
        <button
          type="button"
          aria-label="Hapus kata kunci pencarian"
          onclick={() => (searchQuery = '')}
          class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Tab Filter Kategori (Horizontal Scrollable di Mobile) -->
  {#if categories.length > 0}
    <div
      role="tablist"
      aria-label="Filter kategori menu"
      class="mt-5 flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar sm:flex-wrap"
    >
      <button
        role="tab"
        aria-selected={selectedCategoryId === null}
        onclick={() => (selectedCategoryId = null)}
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm {selectedCategoryId === null
          ? 'bg-slate-900 text-white shadow-xs'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}"
      >
        <span>Semua Menu</span>
        <span
          class="inline-flex size-4 items-center justify-center rounded-full text-[10px] {selectedCategoryId === null
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 text-slate-600'}"
        >
          {menuItems.length}
        </span>
      </button>

      {#each categories as cat (cat.id)}
        {@const count = categoryCounts[cat.id] || 0}
        <button
          role="tab"
          aria-selected={selectedCategoryId === cat.id}
          onclick={() => (selectedCategoryId = cat.id)}
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm {selectedCategoryId === cat.id
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}"
        >
          <span>{cat.name}</span>
          <span
            class="inline-flex size-4 items-center justify-center rounded-full text-[10px] {selectedCategoryId === cat.id
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 text-slate-600'}"
          >
            {count}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Konten Katalog Menu -->
  <div class="mt-6">
    {#if loading}
      <!-- Loading Skeleton State -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {#each Array(4) as _}
          <div class="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <Skeleton class="size-20 shrink-0 rounded-xl" />
            <div class="flex flex-1 flex-col justify-between space-y-2">
              <div>
                <Skeleton class="h-4 w-3/5 rounded-md" />
                <Skeleton class="mt-2 h-3 w-4/5 rounded-md" />
              </div>
              <div class="flex items-center justify-between">
                <Skeleton class="h-4 w-1/3 rounded-md" />
                <Skeleton class="h-7 w-16 rounded-xl" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
        <svg
          class="mx-auto size-10 text-rose-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="mt-3 text-base font-bold text-slate-900">Gagal Memuat Menu</h3>
        <p class="mt-1 text-xs text-slate-600 sm:text-sm">{error}</p>
        <button
          onclick={loadMenu}
          class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
        >
          Coba Lagi
        </button>
      </div>
    {:else if filteredItems.length === 0}
      <!-- Empty State -->
      <div class="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 class="mt-3 text-base font-bold text-slate-900">Menu Tidak Ditemukan</h3>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">
          {#if searchQuery}
            Tidak ada menu yang sesuai dengan kata kunci "{searchQuery}".
          {:else}
            Belum ada menu yang tersedia untuk kategori ini.
          {/if}
        </p>
        {#if searchQuery || selectedCategoryId}
          <button
            onclick={() => {
              searchQuery = '';
              selectedCategoryId = null;
            }}
            class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            Tampilkan Semua Menu
          </button>
        {/if}
      </div>
    {:else}
      <!-- Grid Daftar Menu -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {#each filteredItems as item (item.id)}
          {@const quantityInCart = cartStore.getItemQuantity(item.id)}
          {@const catName = getCategoryName(item.category_id)}

          <article
            class="flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-xs {item.is_available
              ? 'border-slate-200'
              : 'border-slate-200 bg-slate-50/60 opacity-70'}"
          >
            <div class="flex gap-4">
              <!-- Foto Menu Thumbnail -->
              <div class="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:size-24">
                {#if item.image_url}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    class="size-full object-cover {item.is_available ? '' : 'grayscale'}"
                    onerror={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div class="hidden size-full items-center justify-center bg-slate-100 text-slate-400">
                    <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                {:else}
                  <div class="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                    <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                {/if}

                {#if !item.is_available}
                  <div class="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                    <span class="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                      Habis
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Rincian Menu -->
              <div class="flex flex-1 flex-col justify-start">
                <div class="flex items-start justify-between gap-1">
                  <h3 class="text-sm font-bold leading-snug text-slate-900 sm:text-base">
                    {item.name}
                  </h3>
                  {#if !item.is_available}
                    <Badge tone="danger" label="Habis" />
                  {/if}
                </div>

                {#if catName}
                  <span class="mt-0.5 text-[11px] font-medium text-slate-500">
                    {catName}
                  </span>
                {/if}

                {#if item.description}
                  <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                {/if}
              </div>
            </div>

            <!-- Footer Card: Harga & Kontrol Pemesanan -->
            <div class="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
              <span class="text-sm font-bold text-slate-900 sm:text-base">
                {formatRupiah(item.price)}
              </span>

              <div>
                {#if !item.is_available}
                  <button
                    disabled
                    type="button"
                    class="cursor-not-allowed rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400"
                  >
                    Habis
                  </button>
                {:else if quantityInCart === 0}
                  <button
                    type="button"
                    onclick={() => handleAddToCart(item)}
                    class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition active:scale-95"
                    style="background-color: var(--brand-primary, {primaryColor});"
                  >
                    <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah
                  </button>
                {:else}
                  <!-- Interactive Quantity Stepper -->
                  <div class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      aria-label="Kurangi kuantitas {item.name}"
                      onclick={() => cartStore.decrement(item.id)}
                      class="flex size-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs transition hover:bg-slate-100 active:scale-90"
                    >
                      <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
                      </svg>
                    </button>

                    <span class="w-6 text-center text-xs font-bold text-slate-900">
                      {quantityInCart}
                    </span>

                    <button
                      type="button"
                      aria-label="Tambah kuantitas {item.name}"
                      onclick={() => cartStore.increment(item.id)}
                      class="flex size-9 items-center justify-center rounded-lg text-white shadow-2xs transition active:scale-90"
                      style="background-color: var(--brand-primary, {primaryColor});"
                    >
                      <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>
