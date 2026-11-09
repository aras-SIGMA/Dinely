<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let {
    text,
    animate = true,
    duration = 360
  }: { text: string; animate?: boolean; duration?: number } = $props();

  let reduceMotion = $state(false);

  onMount(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => (reduceMotion = query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  function split(value: string): string[] {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
        (part) => part.segment
      );
    }
    return Array.from(value);
  }

  // Memoization: saat streaming, teks tumbuh sebagai perpanjangan prefix.
  // Hanya segmentasi bagian baru agar tidak O(n^2).
  let cache: { text: string; chars: string[] } = { text: '', chars: [] };
  let chars = $derived.by(() => {
    if (text === cache.text) return cache.chars;
    if (cache.text.length > 0 && text.startsWith(cache.text)) {
      cache = { text, chars: [...cache.chars, ...split(text.slice(cache.text.length))] };
    } else {
      cache = { text, chars: split(text) };
    }
    return cache.chars;
  });
</script>

{#if animate && !reduceMotion}
  {#each chars as ch, i (i)}<span in:fade={{ duration }}>{ch}</span>{/each}
{:else}
  {text}
{/if}
