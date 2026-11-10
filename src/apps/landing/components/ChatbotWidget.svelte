<script lang="ts">
  import { tick } from 'svelte';
  import { chatbotStore, QUICK_PROMPTS, type UiChatMessage } from '@/stores/chatbot.svelte';
  import LinkaMascot from '@/components/ui/LinkaMascot.svelte';
  import Markdown from '@/components/ui/Markdown.svelte';
  import TextType from '@/components/ui/TextType.svelte';
  import { SUPPORT_EMAIL, buildSupportWhatsAppLink } from '@/lib/config';

  let inputMessage = $state('');
  let messagesContainer = $state<HTMLDivElement | null>(null);
  let inputElement = $state<HTMLInputElement | null>(null);

  let showHandoff = $derived(
    chatbotStore.messages.at(-1)?.isError === true && !chatbotStore.loading
  );

  const handoffWhatsApp = buildSupportWhatsAppLink(
    'Halo tim Dinely, saya butuh bantuan lanjutan terkait layanan Dinely dari asisten Linka.'
  );

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

<!-- Floating Action Button (FAB): pill label + circular mascot button -->
<div class="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 sm:bottom-6 sm:right-6">
  <!-- Pill Label -->
  <button
    type="button"
    onclick={() => chatbotStore.toggle()}
    tabindex="-1"
    aria-hidden="true"
    class="hidden rounded-full bg-slate-900 px-5 py-3 text-xs font-bold tracking-wide text-white shadow-lg ring-4 ring-white/70 transition-all duration-200 hover:bg-slate-800 hover:shadow-xl active:scale-95 sm:block sm:text-sm"
  >
    {chatbotStore.isOpen ? 'Tutup obrolan' : 'Tanya Linka aja, yuk!'}
  </button>

  <!-- Circular Mascot Button -->
  <button
    type="button"
    onclick={() => chatbotStore.toggle()}
    aria-label={chatbotStore.isOpen ? 'Tutup obrolan dengan Linka' : 'Buka obrolan dengan Linka, asisten AI Dinely'}
    aria-expanded={chatbotStore.isOpen}
    aria-haspopup="dialog"
    class="group relative flex size-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl ring-4 ring-white/80 transition-all duration-200 hover:bg-brand-600 hover:shadow-2xl active:scale-95"
  >
    {#if chatbotStore.isOpen}
      <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    {:else}
      <span class="flex size-10 items-center justify-center">
        <LinkaMascot variant="avatar" size="sm" animated={true} />
      </span>

      <!-- Status Online -->
      <span class="absolute -bottom-0.5 -right-0.5 flex size-3.5" aria-hidden="true">
        <span class="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70"></span>
        <span class="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500"></span>
      </span>
    {/if}
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
    <header class="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
      <div class="flex items-center gap-3">
        <div class="relative flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-orange-50 border border-brand-200/70 shadow-2xs select-none" aria-hidden="true">
          <LinkaMascot variant="happy" size="sm" animated={true} />
          <span class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" title="Online"></span>
        </div>

        <div>
          <h2 id="chatbot-title" class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            Linka
            <span class="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-500/20">AI</span>
          </h2>
          <p class="text-[11px] text-slate-500">
            Maskot Koki &amp; Asisten Dinely
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
          class="rounded-lg p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
          class="rounded-lg p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
      class="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white"
    >
      {#each chatbotStore.messages as msg (msg.id)}
        {#if msg.sender === 'assistant'}
          {@const isStreaming =
            chatbotStore.loading && msg.id === chatbotStore.messages.at(-1)?.id}
          {@const isEmptyThinking =
            isStreaming && !msg.text}
          {#if !isEmptyThinking}
            <!-- Bubble Assistant (Left-aligned) -->
            <div class="flex items-start gap-2.5 max-w-[88%]">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-orange-50 border border-brand-200/70 shadow-2xs mt-0.5 select-none" aria-hidden="true">
                <LinkaMascot variant="avatar" size="xs" />
              </div>
              <div
                class="rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs {msg.isError
                  ? 'border border-rose-200 bg-rose-50 text-rose-800'
                  : 'border border-slate-200/80 bg-white text-slate-800'}"
              >
                <div class="select-text">
                  {#if msg.isError}
                    <div class="whitespace-pre-line">{msg.text}</div>
                  {:else if isStreaming}
                    <div class="whitespace-pre-line"><TextType text={msg.text} animate /><span class="ml-0.5 inline-block w-1.5 h-3.5 -mb-0.5 bg-brand-500 animate-pulse rounded-sm" aria-hidden="true"></span></div>
                  {:else}
                    <Markdown text={msg.text} />
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        {:else}
          <!-- Bubble User (Right-aligned) -->
          <div class="flex justify-end">
            <div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 px-3.5 py-2.5 text-xs text-white shadow-xs leading-relaxed select-text">
              <div class="whitespace-pre-line">
                {msg.text}
              </div>
            </div>
          </div>
        {/if}
      {/each}

      <!-- Typing Indicator -->
      {#if chatbotStore.loading && !chatbotStore.messages.at(-1)?.text}
        <div class="flex items-start gap-2 max-w-[85%]">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-orange-50 border border-brand-200/70 shadow-2xs mt-0.5 select-none" aria-hidden="true">
            <LinkaMascot variant="thinking" size="xs" animated={true} />
          </div>
          <div class="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce"></span>
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.15s]"></span>
            <span class="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.3s]"></span>
            <span class="ml-1 text-[11px] font-medium text-slate-500">Linka sedang meracik jawaban...</span>
          </div>
        </div>
      {/if}

      <!-- Saran Pertanyaan Lanjutan Dinamis -->
      {#if chatbotStore.suggestions.length > 0 && !chatbotStore.loading}
        <div class="pt-1 flex flex-wrap gap-1.5" aria-label="Saran pertanyaan lanjutan">
          {#each chatbotStore.suggestions as suggestion}
            <button
              type="button"
              onclick={() => handleQuickPrompt(suggestion)}
              class="rounded-full border border-brand-200 bg-brand-50/60 px-3 py-1.5 text-[11px] font-medium text-brand-700 shadow-2xs transition hover:border-brand-500 hover:bg-brand-100 active:scale-95"
            >
              {suggestion}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Handoff ke Tim Dukungan (muncul saat Linka tidak bisa menjawab) -->
      {#if showHandoff}
        <div class="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 shadow-2xs">
          <div class="flex items-start gap-2">
            <svg class="size-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-amber-900">Butuh bantuan tim langsung?</p>
              <p class="mt-0.5 text-[11px] text-amber-800 leading-snug">
                Hubungi tim dukungan Dinely untuk pertanyaan yang belum terjawab.
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <a
                  href={handoffWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <svg class="size-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  class="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-amber-800 shadow-2xs transition hover:bg-amber-100 active:scale-95"
                >
                  <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </div>
            </div>
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
                <span class="text-xs font-bold text-slate-900">Linka</span>
                <span class="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">Asisten AI</span>
              </div>
              <p class="text-[11px] text-slate-600 leading-snug mt-0.5">
                Maskot &amp; asisten koki pintar Dinely. Ada yang bisa Linka bantu?
              </p>
            </div>
          </div>

          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pertanyaan Populer
          </p>
          <div class="flex flex-col gap-2">
            {#each QUICK_PROMPTS as prompt}
              <button
                type="button"
                onclick={() => handleQuickPrompt(prompt)}
                class="group flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-medium text-slate-700 shadow-2xs transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 active:scale-[0.98]"
              >
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
                  <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span class="flex-1">{prompt}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Area Form -->
    <footer class="border-t border-slate-100 bg-white px-4 pb-3 pt-2.5">
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
          placeholder="Tanya Linka seputar Dinely..."
          aria-label="Ketik pesan untuk Linka"
          class="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-xs transition focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || chatbotStore.loading}
          aria-label="Kirim pesan ke Linka"
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <p class="mt-1.5 text-center text-[10px] text-slate-400">
        Didukung model resmi Gemini AI untuk panduan layanan Dinely.
      </p>
    </footer>
  </div>
{/if}
