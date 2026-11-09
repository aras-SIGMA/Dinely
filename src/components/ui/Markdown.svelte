<script lang="ts">
  import { parseMarkdown, type InlineSpan } from '@/lib/markdown';

  let { text }: { text: string } = $props();

  let blocks = $derived(parseMarkdown(text));
</script>

{#snippet spans(list: InlineSpan[])}
  {#each list as span}
    {#if span.type === 'bold'}<strong class="font-semibold text-slate-900">{span.text}</strong>
    {:else if span.type === 'italic'}<em>{span.text}</em>
    {:else if span.type === 'code'}<code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-brand-700">{span.text}</code>
    {:else if span.type === 'link'}<a href={span.href} target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 underline hover:text-brand-700">{span.text}</a>
    {:else}{span.text}{/if}
  {/each}
{/snippet}

{#each blocks as block}
  {#if block.type === 'heading'}
    <p
      class="mt-2 mb-1 font-bold text-slate-900 first:mt-0 {block.level === 1
        ? 'text-sm'
        : block.level === 2
        ? 'text-[13px]'
        : 'text-xs'}"
    >
      {@render spans(block.spans)}
    </p>
  {:else if block.type === 'list'}
    <ul class="my-1 space-y-0.5 {block.ordered ? 'list-decimal' : 'list-disc'} pl-4">
      {#each block.items as item}
        <li>{@render spans(item)}</li>
      {/each}
    </ul>
  {:else}
    <p class="my-1 first:mt-0 last:mb-0">
      {@render spans(block.spans)}
    </p>
  {/if}
{/each}
