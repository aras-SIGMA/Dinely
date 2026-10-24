<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    description?: string;
    padded?: boolean;
    children: Snippet;
  };

  let { title = '', description = '', padded = true, children }: Props = $props();
</script>

<section class="rounded-xl border border-slate-200 bg-white shadow-sm">
  {#if title || description}
    <header class="border-b border-slate-200 px-5 py-4">
      {#if title}<h2 class="text-base font-semibold text-slate-900">{title}</h2>{/if}
      {#if description}<p class="mt-1 text-sm text-slate-500">{description}</p>{/if}
    </header>
  {/if}
  <div class={padded ? 'p-5' : ''}>
    {@render children()}
  </div>
</section>
