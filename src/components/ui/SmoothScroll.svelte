<script lang="ts">
  import { onMount, onDestroy, type Snippet } from 'svelte';
  import Lenis from 'lenis';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();

  let lenisInstance: Lenis | null = null;
  let rafCallback: ((time: number) => void) | null = null;

  onMount(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenisInstance.on('scroll', ScrollTrigger.update);

    rafCallback = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };

    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
  });

  onDestroy(() => {
    if (rafCallback) {
      gsap.ticker.remove(rafCallback);
    }
    lenisInstance?.destroy();
    lenisInstance = null;
  });
</script>

{#if children}
  <div class={className}>
    {@render children()}
  </div>
{/if}
