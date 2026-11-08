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
  class="relative min-h-screen w-full overflow-hidden {className}"
>
  <div
    data-flow-inner
    class="flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-6 px-[5vw] pt-[clamp(2.5rem,8vw,5rem)] pb-[clamp(2.5rem,6vw,4rem)] will-change-transform"
    style="transform-origin: bottom left; {style}"
  >
    {@render children()}
  </div>
</section>
