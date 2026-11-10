<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    title?: string;
    description?: string;
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  };

  let { open = $bindable(false), title = '', description = '', onclose, children, footer }: Props =
    $props();

  function close() {
    open = false;
    onclose?.();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) close();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
    <button
      type="button"
      class="absolute inset-0 bg-slate-900/50"
      aria-label="Tutup dialog"
      onclick={close}
    ></button>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
    >
      <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          {#if title}<h2 class="text-base font-semibold text-slate-900">{title}</h2>{/if}
          {#if description}<p class="mt-1 text-sm text-slate-500">{description}</p>{/if}
        </div>
        <button
          type="button"
          onclick={close}
          class="rounded-md p-2.5 -mr-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="size-5" aria-hidden="true">
            <path
              d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
            />
          </svg>
        </button>
      </header>
      <div class="overflow-y-auto px-5 py-4">
        {@render children()}
      </div>
      {#if footer}
        <footer class="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          {@render footer()}
        </footer>
      {/if}
    </div>
  </div>
{/if}
