<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  type Direction = 'vertical' | 'horizontal';

  type Props = {
    children: Snippet;
    distance?: number;
    direction?: Direction;
    reverse?: boolean;
    duration?: number;
    delay?: number;
    threshold?: number;
    once?: boolean;
    class?: string;
  };

  let {
    children,
    distance = 60,
    direction = 'vertical',
    reverse = false,
    duration = 0.7,
    delay = 0,
    threshold = 0.15,
    once = true,
    class: className = ''
  }: Props = $props();

  let node = $state<HTMLElement | null>(null);
  let visible = $state(false);

  onMount(() => {
    if (!node) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduce) {
      visible = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible = true;
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            visible = false;
          }
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  });

  let offset = $derived(`${distance * (reverse ? -1 : 1)}px`);
</script>

<div
  bind:this={node}
  class="animated-content {className}"
  style="--ac-offset: {offset}; --ac-duration: {duration}s; --ac-delay: {delay}s; --ac-axis: {direction ===
  'horizontal'
    ? 'translateX'
    : 'translateY'};"
  data-visible={visible}
>
  {@render children()}
</div>

<style>
  .animated-content {
    opacity: 0;
    transform: var(--ac-axis, translateY) var(--ac-offset, 60px);
    transition:
      opacity var(--ac-duration, 0.7s) cubic-bezier(0.22, 1, 0.36, 1) var(--ac-delay, 0s),
      transform var(--ac-duration, 0.7s) cubic-bezier(0.22, 1, 0.36, 1) var(--ac-delay, 0s);
    will-change: opacity, transform;
  }

  .animated-content[data-visible='true'] {
    opacity: 1;
    transform: var(--ac-axis, translateY) 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .animated-content {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
