<script lang="ts">
  import { toastState } from '@/stores/toast.svelte';

  const tones: Record<string, string> = {
    info: 'border-slate-300 bg-white text-slate-800',
    success: 'border-green-300 bg-green-50 text-green-800',
    error: 'border-red-300 bg-red-50 text-red-800'
  };
</script>

<div class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
  {#each toastState.items as item (item.id)}
    <div
      role="status"
      class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg {tones[
        item.tone
      ]}"
    >
      <p class="flex-1">{item.message}</p>
      <button
        type="button"
        class="-m-1.5 shrink-0 p-1.5 text-current opacity-50 hover:opacity-100"
        onclick={() => toastState.dismiss(item.id)}
        aria-label="Tutup notifikasi"
      >
        &times;
      </button>
    </div>
  {/each}
</div>
