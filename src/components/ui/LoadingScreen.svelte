<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from '@/components/ui/Logo.svelte';
  import { uiStore } from '@/stores/ui.svelte';

  type Props = {
    loading?: boolean;
    minDuration?: number;
  };

  let { loading = true, minDuration = 3000 }: Props = $props();

  const hasLoadedBefore = uiStore.isAppReady;

  let minTimePassed = $state(hasLoadedBefore);
  let shouldRender = $state(!hasLoadedBefore);

  onMount(() => {
    if (hasLoadedBefore) {
      return;
    }

    const timer = setTimeout(() => {
      minTimePassed = true;
    }, minDuration);

    return () => clearTimeout(timer);
  });

  const isVisible = $derived(hasLoadedBefore ? false : (loading || !minTimePassed));

  $effect(() => {
    if (!isVisible) {
      uiStore.setAppReady(true);
    }
  });

  function handleTransitionEnd() {
    if (!isVisible) {
      shouldRender = false;
    }
  }
</script>

{#if shouldRender}
  <div
    role="status"
    aria-live="polite"
    aria-label="Memuat aplikasi Dinely"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f7f3ea] transition-opacity duration-500 ease-out {isVisible
      ? 'opacity-100 pointer-events-auto'
      : 'opacity-0 pointer-events-none'}"
    ontransitionend={handleTransitionEnd}
  >
    <!-- Brand Centerpiece -->
    <div class="flex flex-col items-center">
      <div class="relative">
        <!-- Subtle Pulse Ring behind Logo -->
        <div
          class="absolute -inset-3 rounded-2xl bg-brand-500/15 blur-md animate-pulse"
          aria-hidden="true"
        ></div>
        <Logo size="lg" />
      </div>

      <!-- Animated Progress Line -->
      <div
        class="mt-8 h-1 w-36 overflow-hidden rounded-full bg-slate-200/80"
        aria-hidden="true"
      >
        <div class="loading-bar h-full rounded-full bg-brand-600"></div>
      </div>

      <span class="sr-only">Sedang memuat data...</span>
    </div>
  </div>
{/if}

<style>
  .loading-bar {
    width: 45%;
    animation: loading-slide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes loading-slide {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(120%);
    }
    100% {
      transform: translateX(300%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-bar {
      animation: none;
      width: 100%;
    }
  }
</style>
