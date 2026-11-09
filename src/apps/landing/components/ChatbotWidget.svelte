<script lang="ts">
  import { tick } from 'svelte';
  import { chatbotStore, QUICK_PROMPTS, type UiChatMessage } from '@/stores/chatbot.svelte';
  import LinkaMascot from '@/components/ui/LinkaMascot.svelte';

  let inputMessage = $state('');
  let messagesContainer = $state<HTMLDivElement | null>(null);
  let inputElement = $state<HTMLInputElement | null>(null);

  // Scroll otomatis ke bawah setiap kali ada pesan baru
  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Effect untuk scroll saat pesan bertambah atau saat popup dibuka
  $effect(() => {
    if (chatbotStore.messages.length || chatbotStore.loading || chatbotStore.isOpen) {
      scrollToBottom();
    }
  });

  // Focus ke input saat dialog dibuka
  $effect(() => {
    if (chatbotStore.isOpen) {
      tick().then(() => {
        inputElement?.focus();
      });
    }
  });

  async function handleSend() {
    const text = inputMessage.trim();
    if (!text || chatbotStore.loading) return;

    inputMessage = '';
    await chatbotStore.send(text);
    await scrollToBottom();
  }

  function handleQuickPrompt(prompt: string) {
    if (chatbotStore.loading) return;
    chatbotStore.send(prompt);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      chatbotStore.close();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Floating Action Button (FAB) -->
<div class="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
  <button
    type="button"
    onclick={() => chatbotStore.toggle()}
    aria-label={chatbotStore.isOpen ? 'Tutup obrolan dengan Linka' : 'Buka obrolan dengan Linka, asisten AI RestoLink'}
    aria-expanded={chatbotStore.isOpen}
    aria-haspopup="dialog"
    class="group relative flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-3 text-white shadow-xl ring-4 ring-white/80 transition-all duration-200 hover:bg-slate-800 hover:shadow-2xl active:scale-95 sm:px-5 sm:py-3.5"
  >
    <!-- Avatar / Icon -->
    <div class="relative flex size-7 items-center justify-center">
      {#if chatbotStore.isOpen}
        <!-- X icon when open -->
        <svg class="size-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <!-- Crabby Linka Mascot Avatar -->
        <LinkaMascot variant="avatar" size="xs" animated={true} />

        <!-- Unread / Active beacon indicator -->
        <span class="absolute -right-1 -top-1 flex size-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
        </span>
      {/if}
    </div>

    <!-- Label Text -->
    <span class="text-xs font-bold tracking-wide sm:text-sm">
      {chatbotStore.isOpen ? 'Tutup' : 'Tanya Linka'}
    </span>
  </button>
</div>

<!-- Chat Dialog Popup Window -->
{#if chatbotStore.isOpen}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="chatbot-title"
    class="fixed bottom-20 left-4 right-4 z-50 flex h-[520px] max-h-[75vh] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl transition-all sm:bottom-24 sm:left-auto sm:right-6 sm:w-[380px] sm:max-h-[82vh] animate-in fade-in slide-in-from-bottom-4 duration-200"
  >
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-3.5 text-white">
      <div class="flex items-center gap-3">
        <div class="relative flex size-10 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/80 p-0.5 shadow-xs select-none" aria-hidden="true">
          <LinkaMascot variant="happy" size="sm" animated={true} />
          <span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" title="Online"></span>
        </div>

        <div>
          <h2 id="chatbot-title" class="text-xs font-bold text-white sm:text-sm flex items-center gap-1.5">
            Linka
            <span class="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300 border border-brand-500/30">AI</span>
          </h2>
          <p class="text-[10px] text-slate-300">
            Online &bull; Maskot Koki &amp; Asisten RestoLink
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <!-- Tombol Reset / Clear Chat -->
        <button
          type="button"
          onclick={() => chatbotStore.clear()}
          aria-label="Bersihkan riwayat percakapan dengan Linka"
          title="Reset percakapan"
          class="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <!-- Tombol Tutup Window -->
        <button
          type="button"
          onclick={() => chatbotStore.close()}
          aria-label="Tutup jendela obrolan Linka"
          class="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Message Stream -->
    <div
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50"
    >
      {#each chatbotStore.messages as msg (msg.id)}
        {#if msg.sender === 'assistant'}
          <!-- Bubble Assistant (Left-aligned) -->
          <div class="flex items-start gap-2 max-w-[85%]">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orange-100/90 border border-orange-200 p-0.5 shadow-2xs mt-0.5 select-none" aria-hidden="true">
              <LinkaMascot variant="avatar" size="xs" />
            </div>
            <div
              class="rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs {msg.isError
                ? 'border border-rose-200 bg-rose-50 text-rose-800'
                : 'border border-slate-200/80 bg-white text-slate-800'}"
            >
              <div class="whitespace-pre-line select-text">
                {msg.text}
              </div>
            </div>
          </div>
        {:else}
          <!-- Bubble User (Right-aligned) -->
          <div class="flex justify-end">
            <div class="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-xs leading-relaxed select-text">
              <div class="whitespace-pre-line">
                {msg.text}
              </div>
            </div>
          </div>
        {/if}
      {/each}

      <!-- Typing Indicator -->
      {#if chatbotStore.loading}
        <div class="flex items-start gap-2 max-w-[85%]">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orange-100/90 border border-orange-200 p-0.5 shadow-2xs mt-0.5 select-none" aria-hidden="true">
            <LinkaMascot variant="thinking" size="xs" animated={true} />
          </div>
          <div class="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce"></span>
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.15s]"></span>
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.3s]"></span>
            <span class="ml-1 text-[11px] font-medium text-slate-500">Linka sedang meracik jawaban...</span>
          </div>
        </div>
      {/if}

      <!-- Quick Prompt Chips (Ditampilkan jika percakapan masih di awal) -->
      {#if chatbotStore.messages.length <= 1 && !chatbotStore.loading}
        <div class="pt-2">
          <!-- Mascot Hero Card -->
          <div class="mb-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-orange-50/50 p-3 shadow-2xs flex items-center gap-3">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-brand-200/60 p-1 shadow-xs">
              <LinkaMascot variant="waving" size="md" animated={true} />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-900">Crabby Linka</span>
                <span class="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">Kepiting Purba</span>
              </div>
              <p class="text-[11px] text-slate-600 leading-snug mt-0.5">
                Maskot &amp; asisten koki pintar RestoLink. Ada yang bisa Linka bantu?
              </p>
            </div>
          </div>

          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pertanyaan Populer untuk Linka:
          </p>
          <div class="flex flex-col gap-1.5">
            {#each QUICK_PROMPTS as prompt}
              <button
                type="button"
                onclick={() => handleQuickPrompt(prompt)}
                class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-2xs transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700 active:scale-98"
              >
                &bull; {prompt}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Area Form -->
    <footer class="border-t border-slate-200 bg-white p-3">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        class="flex items-center gap-2"
      >
        <input
          bind:this={inputElement}
          bind:value={inputMessage}
          disabled={chatbotStore.loading}
          type="text"
          maxlength="1000"
          placeholder="Tanya Linka seputar RestoLink..."
          aria-label="Ketik pesan untuk Linka"
          class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || chatbotStore.loading}
          aria-label="Kirim pesan ke Linka"
          class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs transition hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <p class="mt-1.5 text-center text-[10px] text-slate-400">
        Didukung model resmi Gemini AI untuk panduan layanan RestoLink.
      </p>
    </footer>
  </div>
{/if}
