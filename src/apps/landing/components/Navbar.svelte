<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Logo from '@/components/ui/Logo.svelte';

  type Props = {
    currentPath?: string;
    hidden?: boolean;
  };

  type NavItem = {
    label: string;
    href: string;
    align?: 'left' | 'right';
    subMenus?: {
      title: string;
      items: {
        label: string;
        description: string;
        icon: string;
        href: string;
      }[];
    }[];
  };

  let { currentPath, hidden = false }: Props = $props();

  let isScrolled = $state(false);
  let isMobileMenuOpen = $state(false);
  let browserPath = $state('');

  const activePath = $derived(currentPath ?? browserPath);

  const navItems: NavItem[] = [
    {
      label: 'Beranda',
      href: '/'
    },
    {
      label: 'Fitur',
      href: '/fitur',
      subMenus: [
        {
          title: 'Etalase & Pemesanan',
          items: [
            {
              label: 'Website Menu Digital',
              description: 'Etalase & subdomain mandiri',
              icon: 'globe',
              href: '/fitur#menu-digital'
            },
            {
              label: 'Pemesanan QR Meja',
              description: 'Scan meja, langsung pesan',
              icon: 'qr',
              href: '/fitur#qr-ordering'
            }
          ]
        },
        {
          title: 'Dapur & Manajemen',
          items: [
            {
              label: 'Layar Dapur Real-Time',
              description: 'Nota digital tanpa kertas',
              icon: 'utensils',
              href: '/fitur#kitchen-orders'
            },
            {
              label: 'Kontrol Stok & Menu',
              description: 'Update habis & harga instan',
              icon: 'box',
              href: '/fitur#stock-control'
            },
            {
              label: 'Dashboard Analitik',
              description: 'Rekap omset & laba harian',
              icon: 'chart',
              href: '/fitur#dashboard-analytics'
            }
          ]
        }
      ]
    },
    {
      label: 'Hardware',
      href: '/hardware',
      subMenus: [
        {
          title: 'Kebutuhan Perangkat Usaha',
          items: [
            {
              label: 'Usaha Mikro',
              description: '1 unit Smartphone (Modal Rp0)',
              icon: 'smartphone',
              href: '/hardware?tier=mikro'
            },
            {
              label: 'Usaha Kecil',
              description: 'Tablet, Printer Struk, Staf & WiFi',
              icon: 'tablet',
              href: '/hardware?tier=kecil'
            },
            {
              label: 'Usaha Menengah',
              description: 'POS Station, KDS Dapur, Bar & Waiter',
              icon: 'pos',
              href: '/hardware?tier=menengah'
            }
          ]
        }
      ]
    },
    {
      label: 'Tentang Kami',
      href: '/tentang-kami',
      align: 'right',
      subMenus: [
        {
          title: 'Mengenal RestoLink',
          items: [
            {
              label: 'Kisah RestoLink',
              description: 'Perjalanan & latar belakang',
              icon: 'book',
              href: '/tentang-kami#kisah'
            },
            {
              label: 'Visi & Misi',
              description: 'Komitmen digitalisasi UMKM',
              icon: 'target',
              href: '/tentang-kami#visi-misi'
            },
            {
              label: 'Tim Leadership',
              description: 'Karya Tim Kepiting Purba',
              icon: 'users',
              href: '/tentang-kami#tim-leadership'
            }
          ]
        }
      ]
    },
    {
      label: 'Hubungi Kami',
      href: '/hubungi-kami'
    }
  ];

  const ICONS: Record<string, string> = {
    globe: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    qr: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>',
    utensils: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
    box: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    chart: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
    target: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    workflow: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    flag: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>',
    message: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    smartphone: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    tablet: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    pos: '<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
  };

  function updateBrowserPath() {
    if (typeof window !== 'undefined') {
      browserPath = window.location.pathname;
    }
  }

  function handleScroll() {
    if (typeof window !== 'undefined') {
      isScrolled = window.scrollY > 20;
    }
  }

  // --- Desktop navigation: sliding hover pill + mega dropdown ---
  let navListEl = $state<HTMLElement | null>(null);
  let triggerEls: (HTMLElement | null)[] = [];
  let hoveredIdx: number | null = $state(null);
  let openLabel: string | null = $state(null);
  let innerW = $state(0);
  let fontTick = $state(0);

  let pill = $state({ left: 0, width: 0, visible: false, kind: 'active' as 'active' | 'hover' });

  const activeIdx = $derived(navItems.findIndex((item) => item.href === activePath));

  $effect(() => {
    void innerW;
    void fontTick;
    const target = hoveredIdx !== null ? hoveredIdx : activeIdx >= 0 ? activeIdx : null;
    const list = navListEl;
    const el = target !== null ? (triggerEls[target] ?? null) : null;

    if (target === null || !list || !el) {
      pill = { ...pill, visible: false };
      return;
    }

    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    if (!elRect.width) {
      pill = { ...pill, visible: false };
      return;
    }

    pill = {
      left: elRect.left - listRect.left,
      width: elRect.width,
      visible: true,
      kind: hoveredIdx !== null && hoveredIdx !== activeIdx ? 'hover' : 'active'
    };
  });

  function handleNavEnter(index: number) {
    hoveredIdx = index;
    const item = navItems[index];
    openLabel = item?.subMenus ? item.label : null;
  }

  function handleNavLeave() {
    hoveredIdx = null;
    openLabel = null;
  }

  function handleFocusOut(event: FocusEvent) {
    const current = event.currentTarget as Element | null;
    const next = event.relatedTarget as Node | null;
    if (current && !current.contains(next)) {
      openLabel = null;
    }
  }

  function resetNavInteraction() {
    hoveredIdx = null;
    openLabel = null;
    isMobileMenuOpen = false;
  }

  function handleSubmenuClick(href: string) {
    resetNavInteraction();
    if (typeof window !== 'undefined' && href.includes('tier=')) {
      const url = new URL(href, window.location.origin);
      const tier = url.searchParams.get('tier');
      if (tier) {
        window.dispatchEvent(new CustomEvent('restolink:tier-change', { detail: { tier } }));
      }
    }
  }

  onMount(() => {
    updateBrowserPath();
    handleScroll();
    window.addEventListener('popstate', updateBrowserPath);
    window.addEventListener('scroll', handleScroll, { passive: true });
    requestAnimationFrame(() => {
      fontTick += 1;
    });
    document.fonts?.ready.then(() => {
      fontTick += 1;
    });
    return () => {
      window.removeEventListener('popstate', updateBrowserPath);
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      openLabel = null;
      closeMobileMenu();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} bind:innerWidth={innerW} />

<!-- Adaptive Floating White Navbar (Inspired by cationgate.site) -->
<header
  class="fixed top-0 inset-x-0 z-40 w-full flex justify-center pointer-events-none transition-all duration-300 ease-in-out {hidden
    ? 'opacity-0 -translate-y-12'
    : 'opacity-100 translate-y-0'} {isScrolled ? 'px-3 sm:px-4 pt-2.5 sm:pt-3' : 'px-3 sm:px-4 pt-0'}"
>
  <div
    class="relative w-full max-w-7xl px-4 sm:px-6 py-2.5 sm:py-3 pointer-events-auto transition-all duration-300 ease-in-out border-0 outline-none {isMobileMenuOpen
      ? 'rounded-2xl bg-white p-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.08)] backdrop-blur-md'
      : isScrolled
        ? 'rounded-2xl bg-white/95 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.08)] backdrop-blur-md'
        : 'rounded-none bg-white shadow-none'}"
  >
    <div class="relative flex h-11 sm:h-12 items-center justify-between">
      <!-- Brand Logo (Left End) -->
      <div class="flex items-center">
        <a
          href="/"
          class="rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-opacity hover:opacity-90"
          aria-label="RestoLink Beranda"
          onclick={closeMobileMenu}
        >
          <Logo size="sm" theme="light" />
        </a>
      </div>

      <!-- Center Desktop Navigation: Hover Pill + Mega Dropdown -->
      <nav
        class="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center"
        aria-label="Navigasi Utama"
        onmouseleave={handleNavLeave}
      >
        <ul bind:this={navListEl} class="relative flex items-center">
          <span
            aria-hidden="true"
            class="pointer-events-none absolute top-0 h-full rounded-full transition-all duration-300 ease-out {pill.kind === 'hover'
              ? 'bg-slate-100/80'
              : 'bg-brand-50'} {pill.visible ? 'opacity-100' : 'opacity-0'}"
            style="left: {pill.left}px; width: {pill.width}px;"
          ></span>
          {#each navItems as item, i (i)}
            {@const isActive = activeIdx === i}
            {@const engaged = hoveredIdx === i || openLabel === item.label}
            <li
              class="relative"
              onmouseenter={() => handleNavEnter(i)}
              onfocus={() => handleNavEnter(i)}
              onfocusout={handleFocusOut}
            >
              <a
                bind:this={triggerEls[i]}
                href={item.href}
                class="group relative z-10 flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 {isActive
                  ? 'font-bold text-brand-700'
                  : engaged
                    ? 'text-slate-900'
                    : 'text-slate-600'}"
                aria-current={isActive ? 'page' : undefined}
                aria-haspopup={item.subMenus ? 'true' : undefined}
                aria-expanded={item.subMenus ? openLabel === item.label : undefined}
              >
                <span>{item.label}</span>
                {#if item.subMenus}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-3.5 transition-transform duration-300 {engaged ? 'rotate-180' : ''}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                {/if}
              </a>

              {#if item.subMenus && openLabel === item.label}
                <div
                  class="absolute top-full {item.align === 'right' ? 'right-0' : 'left-0'} pt-2.5"
                  transition:fly={{ y: 10, duration: 200 }}
                >
                  <div
                    class="flex w-max gap-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/[0.06]"
                  >
                    {#each item.subMenus as group (group.title)}
                      <div>
                        <h3
                          class="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          {group.title}
                        </h3>
                        <ul class="space-y-3">
                          {#each group.items as sub (sub.label)}
                            <li>
                              <a
                                href={sub.href}
                                class="group/sub flex items-start gap-3"
                                onclick={() => handleSubmenuClick(sub.href)}
                              >
                                <span
                                  class="flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition-colors duration-300 group-hover/sub:border-brand-200 group-hover/sub:bg-brand-50 group-hover/sub:text-brand-700"
                                >
                                  {@html ICONS[sub.icon]}
                                </span>
                                <span class="block w-max leading-4">
                                  <span class="block text-xs font-semibold text-slate-900">
                                    {sub.label}
                                  </span>
                                  <span
                                    class="mt-0.5 block text-[11px] leading-4 text-slate-500 transition-colors duration-300 group-hover/sub:text-slate-800"
                                  >
                                    {sub.description}
                                  </span>
                                </span>
                              </a>
                            </li>
                          {/each}
                        </ul>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>

      <!-- Right Desktop Action Buttons -->
      <div class="hidden md:flex items-center gap-2 sm:gap-3">
        <a
          href="/masuk"
          class="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Masuk
        </a>
        <a
          href="/daftar"
          class="inline-flex items-center justify-center rounded-full bg-brand-600 px-4.5 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-500 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Coba 30 Hari Gratis
        </a>
      </div>

      <!-- Mobile Hamburger Toggle Button -->
      <div class="flex md:hidden">
        <button
          type="button"
          onclick={toggleMobileMenu}
          class="inline-flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        >
          {#if isMobileMenuOpen}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Menu (Frosted White) -->
    {#if isMobileMenuOpen}
      <div
        id="mobile-navigation"
        class="mt-3 pt-3 border-t border-slate-100 md:hidden animate-slide-in-up"
      >
        <nav class="flex flex-col gap-1 py-1" aria-label="Navigasi Mobile">
          {#each navItems as item (item.href)}
            {@const isActive = activePath === item.href}
            <a
              href={item.href}
              onclick={resetNavInteraction}
              class="flex items-center min-h-[44px] rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors {isActive
                ? 'bg-brand-50 text-brand-700 font-bold'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}"
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </a>
          {/each}
        </nav>

        <div class="mt-4 flex flex-col gap-2.5 pt-3 border-t border-slate-100">
          <a
            href="/masuk"
            onclick={closeMobileMenu}
            class="flex items-center justify-center min-h-[44px] rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Masuk
          </a>
          <a
            href="/daftar"
            onclick={closeMobileMenu}
            class="flex items-center justify-center min-h-[44px] rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 transition-colors shadow-xs"
          >
            Coba 30 Hari Gratis
          </a>
        </div>
      </div>
    {/if}
  </div>
</header>
