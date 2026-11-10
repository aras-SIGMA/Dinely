<script lang="ts">
  type BarItem = {
    label: string;
    count: number;
    color: string;
  };

  type Props = {
    title: string;
    description?: string;
    items: BarItem[];
    emptyLabel?: string;
  };

  let { title, description = '', items, emptyLabel = 'Belum ada data' }: Props = $props();

  let total = $derived(items.reduce((sum, item) => sum + item.count, 0));

  function pct(count: number): number {
    if (total === 0 || count === 0) return 0;
    return Math.round((count / total) * 100);
  }
</script>

<section class="rounded-xl border border-slate-200 bg-white shadow-xs">
  <header class="border-b border-slate-100 px-5 py-4">
    <h2 class="text-sm font-semibold text-slate-900">{title}</h2>
    {#if description}
      <p class="mt-0.5 text-xs text-slate-500">{description}</p>
    {/if}
  </header>
  <div class="flex flex-col gap-4 p-5">
    {#if total === 0}
      <p class="text-center text-xs text-slate-400">{emptyLabel}</p>
    {:else}
      {#each items as item (item.label)}
        <div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="flex items-center gap-2 font-medium text-slate-700">
              <span class="size-2 rounded-full {item.color}"></span>
              {item.label}
            </span>
            <span class="tabular-nums text-slate-500">
              {item.count} <span class="text-slate-300">·</span> {pct(item.count)}%
            </span>
          </div>
          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.label}: ${item.count}`}>
            <div
              class={`h-full rounded-full ${item.color} transition-all duration-500`}
              style={`width: ${pct(item.count)}%`}
            ></div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>
