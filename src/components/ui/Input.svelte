<script lang="ts">
  type Props = {
    id?: string;
    label?: string;
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url';
    value?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    hint?: string;
    autocomplete?: AutoFill;
    oninput?: (event: Event) => void;
  };

  let {
    id = '',
    label = '',
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    required = false,
    disabled = false,
    error = '',
    hint = '',
    autocomplete,
    oninput
  }: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
  {#if label}
    <label for={id} class="text-sm font-medium text-slate-700">
      {label}
      {#if required}<span class="text-red-600" aria-hidden="true">*</span>{/if}
    </label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {required}
    {disabled}
    {autocomplete}
    bind:value
    {oninput}
    aria-invalid={error ? 'true' : undefined}
    class="h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 {error
      ? 'border-red-500'
      : 'border-slate-300'}"
  />
  {#if error}
    <p class="text-xs text-red-600">{error}</p>
  {:else if hint}
    <p class="text-xs text-slate-500">{hint}</p>
  {/if}
</div>
