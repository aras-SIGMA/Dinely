<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    style?: string;
    'aria-label'?: string;
    children: Snippet;
  }

  let { class: className = '', style = '', 'aria-label': ariaLabel, children }: Props = $props();
</script>

<section
  data-flow-section
  aria-label={ariaLabel}
  class="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden {className}"
>
  <div
    data-flow-inner
    class="flow-art-container relative flex h-full w-full flex-col justify-between px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 pt-[clamp(1.25rem,2.8vh,3rem)] pb-[clamp(1.25rem,2.8vh,3rem)] will-change-transform box-border"
    style="transform-origin: bottom left; {style}"
  >
    {@render children()}
  </div>
</section>
