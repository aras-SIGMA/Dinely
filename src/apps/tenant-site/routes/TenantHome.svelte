<script lang="ts">
  import { tenantStore } from '@/stores/tenant.svelte';
  import { cartStore } from '@/stores/cart.svelte';
  import { guestOrderStore } from '@/stores/guest-order.svelte';
  import Badge from '@/components/ui/Badge.svelte';
  import MenuCatalog from '../components/MenuCatalog.svelte';
  import CartDrawer from '../components/CartDrawer.svelte';
  import CheckoutModal from '../components/CheckoutModal.svelte';
  import OrderReceiptModal from '../components/OrderReceiptModal.svelte';

  const tenant = $derived(tenantStore.tenant);

  let isCheckoutOpen = $state(false);
  let isReceiptOpen = $state(false);

  // Inisialisasi keranjang & pemulihan pesanan jika browser di-refresh
  $effect(() => {
    const tenantId = tenant?.id;
    if (!tenantId) return;

    cartStore.initTenant(tenantId);

    // Pulihkan status pesanan terakhir jika ada di localStorage
    guestOrderStore.recoverLastOrder(tenantId).then((recovered) => {
      if (recovered) {
        isReceiptOpen = true;
      }
    });

    return () => {
      guestOrderStore.stopPolling();
    };
  });

  // Gunakan contact_whatsapp, fallback ke contact_phone jika ada
  const targetPhone = $derived(tenant?.contact_whatsapp || tenant?.contact_phone || null);

  // Normalisasi nomor ke standar internasional Indonesia (awalan 62)
  const cleanWaNumber = $derived.by(() => {
    if (!targetPhone) return null;
    let num = targetPhone.replace(/[^0-9]/g, '');
    if (num.startsWith('0')) {
      num = '62' + num.slice(1);
    }
    return num;
  });

  const waInquiryLink = $derived.by(() => {
    if (!cleanWaNumber || !tenant) return null;
    const greeting = encodeURIComponent(
      `Halo ${tenant.business_name}, saya melihat menu digital Anda di website dan ingin bertanya mengenai pemesanan/layanan.`
    );
    return `https://wa.me/${cleanWaNumber}?text=${greeting}`;
  });

  const initials = $derived.by(() => {
    if (!tenant?.business_name) return 'RL';
    return tenant.business_name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });

  const activeOrderCodeFormatted = $derived.by(() => {
    const raw = guestOrderStore.activeOrderCode;
    if (!raw) return '';
    return raw.startsWith('#') ? raw : `#${raw}`;
  });
</script>

{#if tenant}
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <!-- Banner Notifikasi Pesanan Berjalan (Jika ada pesanan aktif dan modal bukti pesanan ditutup) -->
    {#if guestOrderStore.activeOrderCode && !isReceiptOpen}
      <aside
        aria-label="Notifikasi pesanan yang sedang berjalan"
        class="mb-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 shadow-xs"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="relative flex size-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full size-3 bg-brand-600"></span>
            </span>
            <div>
              <p class="text-xs font-semibold text-slate-700">
                Pesanan Anda: <strong class="text-slate-900">{activeOrderCodeFormatted}</strong>
              </p>
              <div class="mt-0.5 flex items-center gap-1.5">
                <Badge tone={guestOrderStore.statusTone} label={guestOrderStore.statusLabel} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onclick={() => (isReceiptOpen = true)}
            class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition"
          >
            <span>Buka Bukti Pesanan</span>
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>
    {/if}

    <!-- Header Profil Usaha Kuliner (FE-11) -->
    <header class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-8">
      <div class="flex items-start gap-4 sm:gap-5">
        <!-- Logo Resto atau Inisial Brand -->
        {#if tenant.logo_url}
          <img
            src={tenant.logo_url}
            alt={tenant.business_name}
            class="size-16 shrink-0 rounded-2xl object-cover ring-2 ring-slate-100 sm:size-20"
            onerror={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div
            class="hidden size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-xs sm:size-20 sm:text-2xl"
            style="background-color: var(--brand-primary, {tenant.primary_color || '#ea580c'});"
          >
            {initials}
          </div>
        {:else}
          <div
            class="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-xs sm:size-20 sm:text-2xl"
            style="background-color: var(--brand-primary, {tenant.primary_color || '#ea580c'});"
          >
            {initials}
          </div>
        {/if}

        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {tenant.business_name}
            </h1>
            <Badge tone="success" label="Buka / Layanan Aktif" />
          </div>

          <p class="mt-1 text-xs text-slate-500">
            <code class="rounded bg-slate-100 px-1.5 py-0.5">{tenant.subdomain}.restolink.site</code>
          </p>

          {#if tenant.description}
            <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {tenant.description}
            </p>
          {/if}

          {#if tenant.address}
            <div class="mt-4 flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
              <svg
                class="mt-0.5 size-4 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{tenant.address}</span>
            </div>
          {/if}
        </div>
      </div>
    </header>

    <!-- Card Layanan Informasi & Tanya Usaha (Customer Service WhatsApp - FE-11) -->
    {#if waInquiryLink || tenant.contact_phone}
      <section class="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs sm:p-7">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="max-w-xl">
            <div class="flex items-center gap-2">
              <span class="inline-flex size-2 rounded-full bg-emerald-500"></span>
              <h2 class="text-base font-bold text-slate-900 sm:text-lg">
                Layanan Bantuan & Tanya Usaha Langsung
              </h2>
            </div>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Punya pertanyaan seputar katering partai besar, reservasi meja, atau informasi menu? Hubungi pengelola <strong>{tenant.business_name}</strong> langsung untuk bantuan cepat.
            </p>
          </div>

          <!-- Tombol WhatsApp & Telepon -->
          <div class="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            {#if waInquiryLink}
              <a
                href={waInquiryLink}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <svg class="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.074-1.807-.412-.969-.401-1.631-1.341-1.68-1.405-.049-.064-.383-.51-.383-.972 0-.462.242-.689.328-.784.086-.095.188-.119.251-.119.063 0 .126.002.181.004.058.003.136-.022.213.163.078.188.267.653.29.701.023.048.039.105.008.167-.031.062-.047.1-.094.155-.047.056-.099.124-.141.167-.047.047-.096.098-.041.193.055.094.244.404.524.654.361.321.666.421.76.468.095.048.151.04.207-.024.056-.064.24-.28.304-.376.064-.096.127-.08.214-.048.087.032.553.261.648.308.095.048.158.072.182.112.024.041.024.238-.12.643z"
                  />
                </svg>
                Tanya via WhatsApp
              </a>
            {/if}

            {#if tenant.contact_phone}
              <a
                href="tel:{tenant.contact_phone}"
                class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Telepon
              </a>
            {/if}
          </div>
        </div>

        <p class="mt-3 text-[11px] text-emerald-800/80">
          * Untuk pemesanan menu makanan & minuman reguler, gunakan katalog pemesanan digital di bawah.
        </p>
      </section>
    {/if}

    <!-- Katalog Menu Digital Interaktif (FE-12) -->
    <MenuCatalog tenantId={tenant.id} primaryColor={tenant.primary_color} />

    <!-- Komponen Keranjang Belanja & Drawer (FE-13) -->
    <CartDrawer
      tenantId={tenant.id}
      primaryColor={tenant.primary_color}
      onProceedCheckout={() => (isCheckoutOpen = true)}
    />

    <!-- Modal Konfirmasi & Checkout Tamu (FE-13) -->
    <CheckoutModal
      open={isCheckoutOpen}
      tenantId={tenant.id}
      primaryColor={tenant.primary_color}
      onClose={() => (isCheckoutOpen = false)}
      onSuccess={() => {
        isCheckoutOpen = false;
        isReceiptOpen = true;
      }}
    />

    <!-- Modal Bukti Pesanan & Live Tracking (FE-14) -->
    <OrderReceiptModal
      open={isReceiptOpen}
      tenantId={tenant.id}
      businessName={tenant.business_name}
      primaryColor={tenant.primary_color}
      onClose={() => (isReceiptOpen = false)}
    />
  </main>
{/if}
