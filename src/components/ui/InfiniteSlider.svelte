<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    direction?: 'vertical' | 'horizontal';
    speed?: number; // duration in seconds
    reverse?: boolean;
    class?: string;
    children: Snippet;
  };

  let {
    direction = 'vertical',
    speed = 35,
    reverse = false,
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="infinite-slider-container relative overflow-hidden {className}">
  <div
    class="infinite-slider-track flex {direction === 'vertical' ? 'flex-col' : 'flex-row'}"
    style="--slider-speed: {speed}s; animation-direction: {reverse ? 'reverse' : 'normal'};"
  >
    <div
      class="slider-group flex {direction === 'vertical'
        ? 'flex-col gap-5 pb-5'
        : 'flex-row gap-5 pr-5'}"
    >
      {@render children()}
    </div>
    <div
      class="slider-group flex {direction === 'vertical'
        ? 'flex-col gap-5 pb-5'
        : 'flex-row gap-5 pr-5'}"
      aria-hidden="true"
    >
      {@render children()}
    </div>
  </div>
</div>

<style>
  .infinite-slider-track {
    will-change: transform;
    animation: infinite-slider-scroll var(--slider-speed, 35s) linear infinite;
  }

  .infinite-slider-container:hover .infinite-slider-track {
    animation-play-state: paused;
  }

  @keyframes infinite-slider-scroll {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-50%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .infinite-slider-track {
      animation: none !important;
    }
  }
</style>
