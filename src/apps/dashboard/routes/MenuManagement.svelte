<script lang="ts">
  import { authStore } from '@/stores/auth.svelte';
  import { supabase } from '@/lib/supabase';
  import { toastState } from '@/stores/toast.svelte';
  import { formatRupiah } from '@/lib/format';
  import { uploadImage, type CompressionSummary } from '@/lib/cloudinary-upload';
  import Modal from '@/components/ui/Modal.svelte';
  import Badge from '@/components/ui/Badge.svelte';
  import type { Category, MenuItem } from '@/types';

  // Data State
  let categories = $state<Category[]>([]);
  let menuItems = $state<MenuItem[]>([]);
  let loading = $state(true);

  // Filters
  let searchQuery = $state('');
  let selectedCategoryFilter = $state<string>('all');
  let availabilityFilter = $state<'all' | 'available' | 'unavailable'>('all');

  // Menu Modal State
  let menuModalOpen = $state(false);
  let editingMenu = $state<MenuItem | null>(null);
  let formMenuCategoryId = $state('');
  let formMenuName = $state('');
  let formMenuDescription = $state('');
  let formMenuPrice = $state<number>(0);
  let formMenuImageUrl = $state<string | null>(null);
  let formMenuIsAvailable = $state(true);
  let formMenuSortOrder = $state(0);

  // Upload State for Menu
  let menuFileInputRef = $state<HTMLInputElement | null>(null);
  let uploadingMenuImage = $state(false);
  let menuUploadProgress = $state(0);
  let menuCompressionSummary = $state<CompressionSummary | null>(null);
  let menuFormSaving = $state(false);
  let menuFormError = $state<string | null>(null);

  // Category Modal State
  let categoryModalOpen = $state(false);
  let editingCategory = $state<Category | null>(null);
  let newCategoryName = $state('');
  let categorySaving = $state(false);
  let categoryError = $state<string | null>(null);

  // Delete Confirmation Modal
  let deleteMenuTarget = $state<MenuItem | null>(null);
  let deletingMenu = $state(false);

  let deleteCategoryTarget = $state<Category | null>(null);
  let deletingCategory = $state(false);

  const tenant = $derived(authStore.tenant);

  $effect(() => {
    const currentTenantId = authStore.tenant?.id;
    if (currentTenantId) {
      fetchAllData();
    }
  });

  async function fetchAllData() {
    if (!tenant?.id) return;
    loading = true;
    try {
      const [catRes, menuRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
      ]);

      if (catRes.error) throw catRes.error;
      if (menuRes.error) throw menuRes.error;

      categories = (catRes.data as Category[]) || [];
      menuItems = (menuRes.data as MenuItem[]) || [];
    } catch (err: any) {
      console.error('[MenuManagement] Fetch failed:', err);
      toastState.push('Gagal memuat data menu', 'error');
    } finally {
      loading = false;
    }
  }

  // Filtered menu items
  const filteredMenuItems = $derived.by(() => {
    return menuItems.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchDesc) return false;
      }

      // 2. Category Filter
      if (selectedCategoryFilter !== 'all' && item.category_id !== selectedCategoryFilter) {
        return false;
      }

      // 3. Availability Filter
      if (availabilityFilter === 'available' && !item.is_available) return false;
      if (availabilityFilter === 'unavailable' && item.is_available) return false;

      return true;
    });
  });

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return 'Tanpa Kategori';
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Tanpa Kategori';
  }

  function getCategoryCount(categoryId: string): number {
    return menuItems.filter((m) => m.category_id === categoryId).length;
  }

  // Toggle availability instantly with optimistic update
  async function toggleAvailability(item: MenuItem) {
    if (!tenant?.id) return;
    const nextState = !item.is_available;
    const previousState = item.is_available;

    // Optimistic update
    menuItems = menuItems.map((m) => (m.id === item.id ? { ...m, is_available: nextState } : m));

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: nextState, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      toastState.push(
        nextState ? `Status "${item.name}" diubah: Tersedia` : `Status "${item.name}" diubah: Stok Habis`,
        'success'
      );
    } catch (err: any) {
      // Revert optimistic update
      menuItems = menuItems.map((m) => (m.id === item.id ? { ...m, is_available: previousState } : m));
      toastState.push('Gagal mengubah status ketersediaan menu', 'error');
    }
  }

  // Open modal create menu
  function openCreateMenu() {
    editingMenu = null;
    formMenuCategoryId = categories[0]?.id || '';
    formMenuName = '';
    formMenuDescription = '';
    formMenuPrice = 0;
    formMenuImageUrl = null;
    formMenuIsAvailable = true;
    formMenuSortOrder = menuItems.length + 1;
    menuCompressionSummary = null;
    menuFormError = null;
    menuModalOpen = true;
  }

  // Open modal edit menu
  function openEditMenu(item: MenuItem) {
    editingMenu = item;
    formMenuCategoryId = item.category_id || categories[0]?.id || '';
    formMenuName = item.name;
    formMenuDescription = item.description || '';
    formMenuPrice = Number(item.price);
    formMenuImageUrl = item.image_url;
    formMenuIsAvailable = item.is_available;
    formMenuSortOrder = item.sort_order;
    menuCompressionSummary = null;
    menuFormError = null;
    menuModalOpen = true;
  }

  // Handle Menu Photo Upload
  async function handleMenuImageSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      menuFormError = 'Harap pilih file gambar berekstensi JPG, PNG, atau WebP.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      menuFormError = 'Ukuran gambar maksimal adalah 10 MB.';
      return;
    }

    menuFormError = null;
    uploadingMenuImage = true;
    menuUploadProgress = 0;
    menuCompressionSummary = null;

    try {
      const result = await uploadImage(file, {
        type: 'menu',
        onProgress: (p) => {
          menuUploadProgress = p;
        }
      });

      formMenuImageUrl = result.url;
      if (result.compression) {
        menuCompressionSummary = result.compression;
      }
      toastState.push('Foto menu berhasil dikompresi ke WebP dan diunggah', 'success');
    } catch (err: any) {
      menuFormError = err.message || 'Gagal mengunggah foto menu.';
      toastState.push('Gagal mengunggah gambar', 'error');
    } finally {
      uploadingMenuImage = false;
      if (menuFileInputRef) menuFileInputRef.value = '';
    }
  }

  // Save Menu (Create or Update)
  async function handleSaveMenu(e: SubmitEvent) {
    e.preventDefault();
    if (!tenant?.id) return;

    if (!formMenuName.trim()) {
      menuFormError = 'Nama menu wajib diisi.';
      return;
    }

    if (formMenuPrice < 0) {
      menuFormError = 'Harga tidak boleh bernilai negatif.';
      return;
    }

    menuFormSaving = true;
    menuFormError = null;

    try {
      if (editingMenu) {
        // UPDATE
        const { data, error } = await supabase
          .from('menu_items')
          .update({
            category_id: formMenuCategoryId || null,
            name: formMenuName.trim(),
            description: formMenuDescription.trim() || null,
            price: formMenuPrice,
            image_url: formMenuImageUrl,
            is_available: formMenuIsAvailable,
            sort_order: formMenuSortOrder,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMenu.id)
          .eq('tenant_id', tenant.id)
          .select()
          .single();

        if (error) throw error;
        menuItems = menuItems.map((m) => (m.id === editingMenu!.id ? (data as MenuItem) : m));
        toastState.push('Menu berhasil diperbarui', 'success');
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            tenant_id: tenant.id,
            category_id: formMenuCategoryId || null,
            name: formMenuName.trim(),
            description: formMenuDescription.trim() || null,
            price: formMenuPrice,
            image_url: formMenuImageUrl,
            is_available: formMenuIsAvailable,
            sort_order: formMenuSortOrder
          })
          .select()
          .single();

        if (error) throw error;
        menuItems = [...menuItems, data as MenuItem];
        toastState.push('Menu baru berhasil ditambahkan', 'success');
      }

      menuModalOpen = false;
    } catch (err: any) {
      console.error('[MenuManagement] Save menu failed:', err);
      menuFormError = err.message || 'Terjadi kesalahan saat menyimpan menu.';
      toastState.push('Gagal menyimpan menu', 'error');
    } finally {
      menuFormSaving = false;
    }
  }

  // Confirm Delete Menu
  function confirmDeleteMenu(item: MenuItem) {
    deleteMenuTarget = item;
  }

  async function executeDeleteMenu() {
    if (!deleteMenuTarget || !tenant?.id) return;
    deletingMenu = true;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deleteMenuTarget.id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      menuItems = menuItems.filter((m) => m.id !== deleteMenuTarget!.id);
      toastState.push(`Menu "${deleteMenuTarget.name}" berhasil dihapus`, 'success');
      deleteMenuTarget = null;
    } catch (err: any) {
      toastState.push('Gagal menghapus menu', 'error');
    } finally {
      deletingMenu = false;
    }
  }

  // Categories CRUD
  async function handleAddCategory() {
    if (!tenant?.id || !newCategoryName.trim()) return;
    categorySaving = true;
    categoryError = null;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          tenant_id: tenant.id,
          name: newCategoryName.trim(),
          sort_order: categories.length + 1
        })
        .select()
        .single();

      if (error) throw error;

      categories = [...categories, data as Category];
      newCategoryName = '';
      toastState.push('Kategori berhasil ditambahkan', 'success');
    } catch (err: any) {
      categoryError = err.message || 'Gagal menambahkan kategori.';
    } finally {
      categorySaving = false;
    }
  }

  async function handleUpdateCategory(cat: Category, newName: string) {
    if (!tenant?.id || !newName.trim()) return;
    categorySaving = true;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName.trim() })
        .eq('id', cat.id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      categories = categories.map((c) => (c.id === cat.id ? { ...c, name: newName.trim() } : c));
      editingCategory = null;
      toastState.push('Kategori berhasil diperbarui', 'success');
    } catch (err: any) {
      toastState.push('Gagal memperbarui kategori', 'error');
    } finally {
      categorySaving = false;
    }
  }

  function confirmDeleteCategory(cat: Category) {
    const count = getCategoryCount(cat.id);
    if (count > 0) {
      categoryError = `Kategori "${cat.name}" masih berisi ${count} menu. Pindahkan atau hapus menu terlebih dahulu.`;
      return;
    }
    categoryError = null;
    deleteCategoryTarget = cat;
  }

  async function executeDeleteCategory() {
    if (!deleteCategoryTarget || !tenant?.id) return;
    deletingCategory = true;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCategoryTarget.id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      categories = categories.filter((c) => c.id !== deleteCategoryTarget!.id);
      toastState.push(`Kategori "${deleteCategoryTarget.name}" berhasil dihapus`, 'success');
      deleteCategoryTarget = null;
    } catch (err: any) {
      toastState.push('Gagal menghapus kategori', 'error');
    } finally {
      deletingCategory = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="space-y-6">
  <!-- Header & Actions -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Kategori & Menu</h1>
      <p class="mt-1 text-sm text-slate-500">
        Kelola variasi hidangan, kategori masakan, harga, dan kontrol status ketersediaan stok dapur.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onclick={() => (categoryModalOpen = true)}
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
      >
        <svg class="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Kelola Kategori ({categories.length})</span>
      </button>

      <button
        type="button"
        onclick={openCreateMenu}
        class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Menu Baru</span>
      </button>
    </div>
  </div>

  <!-- Filters & Search Bar -->
  <div class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
    <!-- Search Input -->
    <div class="relative flex-1">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <svg class="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Cari nama menu atau deskripsi hidangan..."
        class="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
      />
    </div>

    <!-- Availability Status Filter -->
    <div class="flex items-center gap-2">
      <label for="availability-filter" class="text-xs font-medium text-slate-500 whitespace-nowrap">Status:</label>
      <select
        id="availability-filter"
        bind:value={availabilityFilter}
        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-hidden"
      >
        <option value="all">Semua Status</option>
        <option value="available">Tersedia Saja</option>
        <option value="unavailable">Stok Habis</option>
      </select>
    </div>
  </div>

  <!-- Category Pills -->
  <div class="flex gap-2 overflow-x-auto pb-1">
    <button
      type="button"
      onclick={() => (selectedCategoryFilter = 'all')}
      class="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors {selectedCategoryFilter === 'all'
        ? 'bg-slate-900 text-white'
        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"
    >
      <span>Semua Kategori</span>
      <span class="rounded-full px-1.5 py-0.2 text-[10px] {selectedCategoryFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}">
        {menuItems.length}
      </span>
    </button>

    {#each categories as cat (cat.id)}
      {@const count = getCategoryCount(cat.id)}
      <button
        type="button"
        onclick={() => (selectedCategoryFilter = cat.id)}
        class="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors {selectedCategoryFilter === cat.id
          ? 'bg-brand-600 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"
      >
        <span>{cat.name}</span>
        <span class="rounded-full px-1.5 py-0.2 text-[10px] {selectedCategoryFilter === cat.id ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-700'}">
          {count}
        </span>
      </button>
    {/each}
  </div>

  <!-- Menu Items Grid -->
  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <div class="h-64 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
          <div class="h-36 rounded-xl bg-slate-100"></div>
          <div class="mt-3 h-4 w-3/4 rounded bg-slate-100"></div>
          <div class="mt-2 h-3 w-1/2 rounded bg-slate-100"></div>
        </div>
      {/each}
    </div>
  {:else if filteredMenuItems.length === 0}
    <!-- Empty State -->
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="mt-4 text-base font-bold text-slate-900">Tidak ada menu yang ditemukan</h3>
      <p class="mx-auto mt-1 max-w-sm text-xs text-slate-500">
        {#if searchQuery || selectedCategoryFilter !== 'all' || availabilityFilter !== 'all'}
          Tidak ada menu yang cocok dengan kata kunci atau filter yang Anda pilih. Coba sesuaikan kata kunci pencarian.
        {:else}
          Daftar menu restoran Anda masih kosong. Mulai tambahkan menu kuliner pertama Anda sekarang.
        {/if}
      </p>

      <button
        type="button"
        onclick={openCreateMenu}
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Menu Pertama</span>
      </button>
    </div>
  {:else}
    <!-- Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredMenuItems as item (item.id)}
        <div class="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
          <!-- Card Image & Header -->
          <div>
            <div class="relative h-44 w-full bg-slate-100 overflow-hidden">
              {#if item.image_url}
                <img
                  src={item.image_url}
                  alt={item.name}
                  class="size-full object-cover transition-opacity duration-200 {item.is_available ? 'opacity-100' : 'opacity-40 grayscale'}"
                  loading="lazy"
                  onerror={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div class="hidden size-full items-center justify-center text-slate-400 bg-slate-100">
                  <svg class="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              {:else}
                <div class="flex size-full items-center justify-center text-slate-400">
                  <svg class="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              {/if}

              <!-- Category Badge -->
              <span class="absolute top-3 left-3 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                {getCategoryName(item.category_id)}
              </span>

              <!-- Availability Status Badge -->
              <div class="absolute top-3 right-3">
                {#if item.is_available}
                  <span class="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs shadow-2xs">
                    <span class="size-1.5 rounded-full bg-white"></span>
                    Tersedia
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 rounded-lg bg-red-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs shadow-2xs">
                    <span class="size-1.5 rounded-full bg-white"></span>
                    Habis
                  </span>
                {/if}
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-4">
              <h3 class="font-bold text-slate-900 line-clamp-1" title={item.name}>
                {item.name}
              </h3>
              <p class="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                {item.description || 'Tidak ada deskripsi'}
              </p>
              <p class="mt-3 text-base font-extrabold text-slate-900">
                {formatRupiah(Number(item.price))}
              </p>
            </div>
          </div>

          <!-- Card Actions & Quick Toggle -->
          <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
            <div class="flex items-center justify-between">
              <!-- Fast Stock Switch -->
              <label class="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={item.is_available}
                  onchange={() => toggleAvailability(item)}
                  class="sr-only peer"
                />
                <div class="relative h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-emerald-600 peer-focus:outline-hidden after:absolute after:top-0.5 after:left-[2px] after:size-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                <span class="text-xs font-semibold {item.is_available ? 'text-emerald-700' : 'text-slate-500'}">
                  {item.is_available ? 'Tersedia' : 'Stok Habis'}
                </span>
              </label>

              <!-- Edit & Delete Buttons -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  onclick={() => openEditMenu(item)}
                  class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
                  title="Ubah Menu"
                  aria-label="Ubah Menu"
                >
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onclick={() => confirmDeleteMenu(item)}
                  class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Hapus Menu"
                  aria-label="Hapus Menu"
                >
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- ========================================================================= -->
<!-- MODAL: TAMBAH / UBAH MENU -->
<!-- ========================================================================= -->
<Modal
  bind:open={menuModalOpen}
  title={editingMenu ? 'Ubah Rincian Menu' : 'Tambah Menu Kuliner Baru'}
  description="Isi rincian nama, harga, kategori, dan foto hidangan."
>
  {#if menuFormError}
    <div class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      {menuFormError}
    </div>
  {/if}

  <form id="menu-form" onsubmit={handleSaveMenu} class="space-y-4">
    <!-- Category & Name -->
    <div>
      <label for="form-category" class="block text-xs font-semibold text-slate-700">Kategori Hidangan</label>
      <select
        id="form-category"
        bind:value={formMenuCategoryId}
        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-hidden"
      >
        <option value="">Pilih Kategori</option>
        {#each categories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="form-name" class="block text-xs font-semibold text-slate-700">
        Nama Menu <span class="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="form-name"
        bind:value={formMenuName}
        required
        placeholder="Contoh: Nasi Bakar Cakalang Kemangi"
        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-hidden"
      />
    </div>

    <!-- Description -->
    <div>
      <label for="form-desc" class="block text-xs font-semibold text-slate-700">Deskripsi Bahan & Rasa</label>
      <textarea
        id="form-desc"
        rows="2"
        bind:value={formMenuDescription}
        placeholder="Nasi gurih berempah dibungkus daun pisang dengan suwiran ikan cakalang asap..."
        class="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-hidden"
      ></textarea>
    </div>

    <!-- Price -->
    <div>
      <label for="form-price" class="block text-xs font-semibold text-slate-700">
        Harga Jual (Rupiah) <span class="text-red-500">*</span>
      </label>
      <div class="relative mt-1">
        <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400">
          Rp
        </span>
        <input
          type="number"
          id="form-price"
          min="0"
          step="500"
          bind:value={formMenuPrice}
          required
          class="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-hidden"
        />
      </div>
    </div>

    <!-- Foto Menu & WebP Compressor -->
    <div>
      <label for="menu-image-upload-input" class="block text-xs font-semibold text-slate-700">Foto Menu</label>
      <div class="mt-2 flex items-start gap-4">
        <!-- Preview box -->
        <div class="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {#if formMenuImageUrl}
            <img
              src={formMenuImageUrl}
              alt="Preview"
              class="size-full object-cover"
              onerror={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          {:else}
            <div class="flex size-full items-center justify-center text-slate-300">
              <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}

          {#if uploadingMenuImage}
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-2xs">
              <span class="text-[10px] font-bold">{menuUploadProgress}%</span>
            </div>
          {/if}
        </div>

        <div class="flex-1 space-y-2">
          <input
            id="menu-image-upload-input"
            type="file"
            accept="image/*"
            bind:this={menuFileInputRef}
            onchange={handleMenuImageSelect}
            class="hidden"
          />

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={() => menuFileInputRef?.click()}
              disabled={uploadingMenuImage || menuFormSaving}
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              {uploadingMenuImage ? 'Mengompresi...' : 'Pilih Foto'}
            </button>

            {#if formMenuImageUrl}
              <button
                type="button"
                onclick={() => {
                  formMenuImageUrl = null;
                  menuCompressionSummary = null;
                }}
                class="text-xs text-red-600 hover:underline"
              >
                Hapus
              </button>
            {/if}
          </div>

          {#if menuCompressionSummary}
            <p class="text-[11px] text-emerald-700 font-medium">
              WebP: {formatBytes(menuCompressionSummary.originalSize)} &rarr; {formatBytes(menuCompressionSummary.compressedSize)} (-{menuCompressionSummary.savedPercent}%)
            </p>
          {:else}
            <p class="text-[11px] text-slate-400">
              Format WebP otomatis, maks. 800px / 300 KB.
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Toggle Status -->
    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-700">Status Ketersediaan Awal</span>
      <label class="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          bind:checked={formMenuIsAvailable}
          class="sr-only peer"
        />
        <div class="relative h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-emerald-600 peer-focus:outline-hidden after:absolute after:top-0.5 after:left-[2px] after:size-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
        <span class="text-xs font-semibold {formMenuIsAvailable ? 'text-emerald-700' : 'text-slate-500'}">
          {formMenuIsAvailable ? 'Tersedia' : 'Habis'}
        </span>
      </label>
    </div>
  </form>

  {#snippet footer()}
    <button
      type="button"
      onclick={() => (menuModalOpen = false)}
      class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
    >
      Batal
    </button>
    <button
      type="submit"
      form="menu-form"
      disabled={menuFormSaving || uploadingMenuImage}
      class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
    >
      {#if menuFormSaving}
        <span>Menyimpan...</span>
      {:else}
        <span>Simpan Menu</span>
      {/if}
    </button>
  {/snippet}
</Modal>

<!-- ========================================================================= -->
<!-- MODAL: KELOLA KATEGORI -->
<!-- ========================================================================= -->
<Modal
  bind:open={categoryModalOpen}
  title="Kelola Kategori Hidangan"
  description="Kelompokkan menu agar pelanggan mudah mencari makanan dan minuman."
>
  {#if categoryError}
    <div class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      {categoryError}
    </div>
  {/if}

  <!-- Form Tambah Kategori -->
  <div class="flex gap-2 border-b border-slate-100 pb-4">
    <input
      type="text"
      bind:value={newCategoryName}
      placeholder="Nama kategori baru (contoh: Minuman Dingin)..."
      class="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-hidden"
      onkeydown={(e) => e.key === 'Enter' && handleAddCategory()}
    />
    <button
      type="button"
      onclick={handleAddCategory}
      disabled={categorySaving || !newCategoryName.trim()}
      class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40"
    >
      Tambah
    </button>
  </div>

  <!-- List Kategori -->
  <div class="mt-4 space-y-2 max-h-72 overflow-y-auto">
    {#if categories.length === 0}
      <p class="py-6 text-center text-xs text-slate-400">Belum ada kategori yang dibuat.</p>
    {:else}
      {#each categories as cat (cat.id)}
        <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          {#if editingCategory?.id === cat.id}
            <!-- Inline Edit -->
            <input
              type="text"
              bind:value={editingCategory.name}
              class="flex-1 rounded-lg border border-brand-500 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-hidden"
              onkeydown={(e) => {
                if (e.key === 'Enter') handleUpdateCategory(cat, editingCategory!.name);
                if (e.key === 'Escape') editingCategory = null;
              }}
            />
            <div class="ml-2 flex items-center gap-1">
              <button
                type="button"
                onclick={() => handleUpdateCategory(cat, editingCategory!.name)}
                class="rounded bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onclick={() => (editingCategory = null)}
                class="rounded bg-slate-200 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-300"
              >
                Batal
              </button>
            </div>
          {:else}
            <div>
              <p class="text-xs font-bold text-slate-900">{cat.name}</p>
              <p class="text-[11px] text-slate-500">{getCategoryCount(cat.id)} item menu</p>
            </div>

            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => (editingCategory = { ...cat })}
                class="rounded p-1 text-slate-500 hover:bg-slate-200/70"
                title="Ubah nama"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                type="button"
                onclick={() => confirmDeleteCategory(cat)}
                class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Hapus kategori"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  {#snippet footer()}
    <button
      type="button"
      onclick={() => (categoryModalOpen = false)}
      class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
    >
      Selesai
    </button>
  {/snippet}
</Modal>

<!-- ========================================================================= -->
<!-- MODAL: KONFIRMASI HAPUS MENU -->
<!-- ========================================================================= -->
{#if deleteMenuTarget}
  <Modal
    open={true}
    title="Hapus Menu Kuliner?"
    description="Menu yang dihapus tidak dapat dipulihkan kembali dan akan otomatis hilang dari website pemesanan pelanggan."
    onclose={() => (deleteMenuTarget = null)}
  >
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <p class="text-sm font-bold text-slate-900">{deleteMenuTarget.name}</p>
      <p class="mt-0.5 text-xs text-slate-500">{formatRupiah(Number(deleteMenuTarget.price))}</p>
    </div>

    {#snippet footer()}
      <button
        type="button"
        onclick={() => (deleteMenuTarget = null)}
        disabled={deletingMenu}
        class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Batalkan
      </button>
      <button
        type="button"
        onclick={executeDeleteMenu}
        disabled={deletingMenu}
        class="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        <span>{deletingMenu ? 'Menghapus...' : 'Ya, Hapus Menu'}</span>
      </button>
    {/snippet}
  </Modal>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: KONFIRMASI HAPUS KATEGORI -->
<!-- ========================================================================= -->
{#if deleteCategoryTarget}
  <Modal
    open={true}
    title="Hapus Kategori?"
    description="Kategori ini akan dihapus dari daftar. Pastikan tidak ada menu yang terkait dengan kategori ini."
    onclose={() => (deleteCategoryTarget = null)}
  >
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <p class="text-sm font-bold text-slate-900">{deleteCategoryTarget.name}</p>
    </div>

    {#snippet footer()}
      <button
        type="button"
        onclick={() => (deleteCategoryTarget = null)}
        disabled={deletingCategory}
        class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Batalkan
      </button>
      <button
        type="button"
        onclick={executeDeleteCategory}
        disabled={deletingCategory}
        class="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        <span>{deletingCategory ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
      </button>
    {/snippet}
  </Modal>
{/if}
