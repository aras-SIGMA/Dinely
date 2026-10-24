<script lang="ts">
  type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

  type Props = {
    tone?: Tone;
    label: string;
  };

  let { tone = 'neutral', label }: Props = $props();

  const tones: Record<Tone, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    brand: 'bg-brand-100 text-brand-700'
  };
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {tones[tone]}">
  {label}
</span>
