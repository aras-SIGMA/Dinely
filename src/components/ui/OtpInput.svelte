<script lang="ts">
  import { onMount } from 'svelte';

  type Props = {
    length?: number;
    value?: string;
    disabled?: boolean;
    hasError?: boolean;
    oncomplete?: (code: string) => void;
    onchange?: (code: string) => void;
  };

  let {
    length = 6,
    value = $bindable(''),
    disabled = false,
    hasError = false,
    oncomplete,
    onchange
  }: Props = $props();

  let digits = $state<string[]>(['', '', '', '', '', '']);
  let inputRefs: HTMLInputElement[] = [];

  // Sinkronisasi value jika direset dari luar
  $effect(() => {
    if (!value) {
      digits = Array.from({ length }, () => '');
    } else if (value.length <= length) {
      const chars = value.split('');
      digits = Array.from({ length }, (_, i) => chars[i] || '');
    }
  });

  function updateCode() {
    const fullCode = digits.join('');
    value = fullCode;
    onchange?.(fullCode);

    if (fullCode.length === length) {
      oncomplete?.(fullCode);
    }
  }

  function handleInput(index: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const char = target.value.replace(/\D/g, '').slice(-1);

    digits[index] = char;
    updateCode();

    if (char && index < length - 1) {
      inputRefs[index + 1]?.focus();
      inputRefs[index + 1]?.select();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        digits[index - 1] = '';
        updateCode();
        inputRefs[index - 1]?.focus();
      } else {
        digits[index] = '';
        updateCode();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs[index - 1]?.focus();
      inputRefs[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs[index + 1]?.focus();
      inputRefs[index + 1]?.select();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasteData = e.clipboardData?.getData('text') || '';
    const cleanNumbers = pasteData.replace(/\D/g, '').slice(0, length);

    if (!cleanNumbers) return;

    const chars = cleanNumbers.split('');
    for (let i = 0; i < length; i++) {
      digits[i] = chars[i] || '';
    }

    updateCode();

    const nextIndex = Math.min(cleanNumbers.length, length - 1);
    inputRefs[nextIndex]?.focus();
  }

  onMount(() => {
    // Auto-focus kotak pertama saat dimuat
    inputRefs[0]?.focus();
  });
</script>

<div class="flex items-center justify-center gap-2 sm:gap-3" role="group" aria-label="6 Digit Kode Verifikasi OTP">
  {#each Array(length) as _, index}
    <input
      bind:this={inputRefs[index]}
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="1"
      autocomplete="one-time-code"
      aria-label={`Digit ke-${index + 1} dari ${length}`}
      value={digits[index]}
      {disabled}
      oninput={(e) => handleInput(index, e)}
      onkeydown={(e) => handleKeyDown(index, e)}
      onpaste={handlePaste}
      onfocus={() => inputRefs[index]?.select()}
      class="size-11 sm:size-13 rounded-xl border text-center font-mono text-xl sm:text-2xl font-bold shadow-xs transition-all duration-150 outline-none
        {disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900'}
        {hasError
          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
          : digits[index]
          ? 'border-brand-500 bg-brand-50/20 text-slate-900 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/20'
          : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20'}"
    />
  {/each}
</div>
