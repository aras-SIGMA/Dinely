<script lang="ts">
  import { onMount } from 'svelte';

  type SplitType = 'words' | 'chars';

  type Props = {
    text: string;
    class?: string;
    delay?: number; // ms stagger between elements (default: 35ms)
    baseDelay?: number; // ms delay before starting this text block
    duration?: number; // duration in seconds (default: 0.8s)
    splitType?: SplitType; // 'words' | 'chars' (default: 'words')
    ready?: boolean; // reactive trigger (e.g. uiStore.isAppReady)
    mask?: boolean; // clip emerging letters behind a clean mask line (default: true)
  };

  let {
    text,
    class: className = '',
    delay = 35,
    baseDelay = 0,
    duration = 0.8,
    splitType = 'words',
    ready = true,
    mask = true
  }: Props = $props();

  let mounted = $state(false);
  let prefersReducedMotion = $state(false);

  onMount(() => {
    prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    mounted = true;
  });

  const isRevealed = $derived(prefersReducedMotion || (mounted && ready));

  // Parse words and characters while preserving whitespace and preventing word break
  type WordData = {
    word: string;
    chars: { char: string; globalIndex: number }[];
    wordIndex: number;
  };

  const parsedWords = $derived.by<WordData[]>(() => {
    if (!text) return [];
    const words = text.split(' ');
    let globalCharIndex = 0;

    return words.map((word, wordIndex) => {
      const chars = word.split('').map((char) => {
        const item = { char, globalIndex: globalCharIndex };
        globalCharIndex += 1;
        return item;
      });
      // count the space
      globalCharIndex += 1;

      return {
        word,
        chars,
        wordIndex
      };
    });
  });
</script>

<span class="inline {className}" aria-label={text}>
  {#each parsedWords as wordData (wordData.wordIndex)}
    <span
      class="inline-block whitespace-nowrap {mask ? 'overflow-hidden align-top' : ''} mr-[0.26em] last:mr-0"
      aria-hidden="true"
    >
      {#if splitType === 'words'}
        {@const wordDelay = baseDelay + wordData.wordIndex * (delay * 2)}
        <span
          class="inline-block split-unit"
          style="--unit-delay: {wordDelay}ms; --unit-duration: {duration}s;"
          data-revealed={isRevealed}
        >
          {wordData.word}
        </span>
      {:else}
        {#each wordData.chars as charData (charData.globalIndex)}
          {@const charDelay = baseDelay + charData.globalIndex * delay}
          <span
            class="inline-block split-unit"
            style="--unit-delay: {charDelay}ms; --unit-duration: {duration}s;"
            data-revealed={isRevealed}
          >
            {charData.char}
          </span>
        {/each}
      {/if}
    </span>
  {/each}
</span>

<style>
  .split-unit {
    opacity: 0;
    transform: translateY(115%);
    transition:
      opacity var(--unit-duration, 0.8s) cubic-bezier(0.16, 1, 0.3, 1) var(--unit-delay, 0ms),
      transform var(--unit-duration, 0.8s) cubic-bezier(0.16, 1, 0.3, 1) var(--unit-delay, 0ms);
    will-change: transform, opacity;
  }

  .split-unit[data-revealed='true'] {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .split-unit {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
