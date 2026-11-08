<script lang="ts">
  import { tick } from 'svelte';
  import { chatbotStore, QUICK_PROMPTS, type UiChatMessage } from '@/stores/chatbot.svelte';

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
    aria-label={chatbotStore.isOpen ? 'Tutup obrolan asisten AI' : 'Buka bantuan asisten virtual AI RestoLink'}
    aria-expanded={chatbotStore.isOpen}
    aria-haspopup="dialog"
    class="group relative flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-3.5 text-white shadow-xl ring-4 ring-white/80 transition-all duration-200 hover:bg-slate-800 hover:shadow-2xl active:scale-95 sm:px-5"
  >
    <!-- Avatar / Icon -->
    <div class="relative flex size-6 items-center justify-center">
      {#if chatbotStore.isOpen}
        <!-- X icon when open -->
        <svg class="size-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <!-- Sparkle / Chat icon when closed -->
        <svg class="size-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        <!-- Unread / Active beacon indicator -->
        <span class="absolute -right-1 -top-1 flex size-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full size-2.5 bg-brand-500"></span>
        </span>
      {/if}
    </div>

    <!-- Label Text -->
    <span class="text-xs font-bold tracking-wide sm:text-sm">
      {chatbotStore.isOpen ? 'Tutup' : 'Tanya AI RestoLink'}
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
        <div class="relative flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-slate-900 bg-emerald-500"></span>
        </div>

        <div>
          <h2 id="chatbot-title" class="text-xs font-bold text-white sm:text-sm">
            Asisten AI RestoLink
          </h2>
          <p class="text-[10px] text-slate-300">
            Online &bull; Siap jawab seputar platform
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <!-- Tombol Reset / Clear Chat -->
        <button
          type="button"
          onclick={() => chatbotStore.clear()}
          aria-label="Bersihkan riwayat percakapan"
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
          aria-label="Tutup jendela chat"
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
          <div class="flex items-start gap-2.5 max-w-[85%]">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs mt-0.5">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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
        <div class="flex items-start gap-2.5 max-w-[85%]">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs mt-0.5">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-4 py-3 shadow-2xs">
            <span class="size-1.5 rounded-full bg-slate-400 animate-bounce"></span>
            <span class="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]"></span>
            <span class="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]"></span>
            <span class="ml-1 text-[11px] text-slate-400">Mengetik...</span>
          </div>
        </div>
      {/if}

      <!-- Quick Prompt Chips (Ditampilkan jika percakapan masih di awal) -->
      {#if chatbotStore.messages.length <= 1 && !chatbotStore.loading}
        <div class="pt-2">
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pertanyaan Populer:
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
          placeholder="Tanya seputar RestoLink..."
          aria-label="Ketik pesan ke asisten AI RestoLink"
          class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || chatbotStore.loading}
          aria-label="Kirim pesan"
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
