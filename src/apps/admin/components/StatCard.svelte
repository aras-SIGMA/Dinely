<script lang="ts">
  type Props = {
    label: string;
    value: string | number;
    hint?: string;
    iconPath: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
  };

  let { label, value, hint = '', iconPath, tone = 'neutral' }: Props = $props();

  const tones: Record<NonNullable<Props['tone']>, { chip: string; text: string }> = {
    neutral: { chip: 'bg-slate-100 text-slate-600', text: 'text-slate-900' },
    success: { chip: 'bg-green-50 text-green-600', text: 'text-green-700' },
    warning: { chip: 'bg-amber-50 text-amber-600', text: 'text-amber-700' },
    danger: { chip: 'bg-red-50 text-red-600', text: 'text-red-700' },
    brand: { chip: 'bg-brand-50 text-brand-600', text: 'text-brand-700' }
  };
</script>

<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
  <div class="flex items-center justify-between gap-2">
    <p class="truncate text-xs font-medium text-slate-500">{label}</p>
    <span class={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tones[tone].chip}`}>
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d={iconPath} />
      </svg>
    </span>
  </div>
  <p class={`mt-3 text-2xl font-bold tabular-nums ${tones[tone].text}`}>{value}</p>
  {#if hint}
    <p class="mt-0.5 text-xs text-slate-400">{hint}</p>
  {/if}
</div>
