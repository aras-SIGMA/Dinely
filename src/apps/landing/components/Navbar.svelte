<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
  import Logo from '@/components/ui/Logo.svelte';

  type Props = {
    currentPath?: string;
  };

  let { currentPath }: Props = $props();

  let isMobileMenuOpen = $state(false);
  let browserPath = $state('');

  let activePath = $derived(currentPath ?? browserPath);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/fitur', label: 'Fitur' },
    { href: '/harga', label: 'Harga' }
  ];

  function updateBrowserPath() {
    if (typeof window !== 'undefined') {
      browserPath = window.location.pathname;
    }
  }

  onMount(() => {
    updateBrowserPath();
    window.addEventListener('popstate', updateBrowserPath);
    return () => {
      window.removeEventListener('popstate', updateBrowserPath);
    };
  });

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      closeMobileMenu();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-shadow">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <!-- Brand Logo -->
    <div class="flex items-center gap-3">
      <a
        href="/"
        class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5"
        aria-label="RestoLink Beranda"
        onclick={closeMobileMenu}
      >
        <Logo size="md" />
      </a>
      <span class="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 sm:inline-block border border-brand-200/60">
        GTNIC 2026
      </span>
    </div>

    <!-- Desktop Navigation Links -->
    <nav class="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
      {#each navLinks as link (link.href)}
        {@const isActive = activePath === link.href}
        <a
          href={link.href}
          class="relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 {isActive
            ? 'text-brand-600 font-semibold bg-brand-50/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}"
          aria-current={isActive ? 'page' : undefined}
        >
          {link.label}
          {#if isActive}
            <span class="absolute inset-x-3.5 -bottom-2 h-0.5 rounded-full bg-brand-600"></span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Desktop Action Buttons -->
    <div class="hidden md:flex items-center gap-3">
      <a href="/masuk" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
        <Button variant="ghost" size="sm">Masuk</Button>
      </a>
      <a href="/daftar" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
        <Button size="sm">Coba 30 Hari Gratis</Button>
      </a>
    </div>

    <!-- Mobile Hamburger Toggle -->
    <div class="flex md:hidden">
      <button
        type="button"
        onclick={toggleMobileMenu}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
      >
        {#if isMobileMenuOpen}
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile Drawer Menu -->
  {#if isMobileMenuOpen}
    <div
      id="mobile-navigation"
      class="border-b border-slate-200 bg-white px-4 pt-3 pb-6 md:hidden shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <nav class="flex flex-col gap-1 py-1" aria-label="Navigasi Mobile">
        {#each navLinks as link (link.href)}
          {@const isActive = activePath === link.href}
          <a
            href={link.href}
            onclick={closeMobileMenu}
            class="flex items-center min-h-[44px] rounded-lg px-3.5 py-2 text-base font-medium transition-colors {isActive
              ? 'bg-brand-50 text-brand-700 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}"
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
          </a>
        {/each}
      </nav>

      <div class="mt-4 flex flex-col gap-2.5 pt-4 border-t border-slate-100">
        <a href="/masuk" onclick={closeMobileMenu} class="w-full">
          <Button variant="secondary" size="md" full>Masuk</Button>
        </a>
        <a href="/daftar" onclick={closeMobileMenu} class="w-full">
          <Button size="md" full>Coba 30 Hari Gratis</Button>
        </a>
      </div>
    </div>
  {/if}
</header>
