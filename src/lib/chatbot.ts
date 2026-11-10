/**
 * ============================================================================
 * DINELY - Client Chatbot Service (FE-17 / Milestone 8)
 * ============================================================================
 * Menghubungkan widget chatbot landing page ke serverless endpoint
 * `/api/gemini/chat` secara aman tanpa mengekspos API key di browser.
 * ============================================================================
 */

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface SendChatMessageInput {
  message: string;
  history?: ChatHistoryItem[];
}

export interface StreamChatHandlers {
  onDelta: (text: string) => void;
  onDone: (fullText: string, fallback: boolean) => void;
  onError: (message: string) => void;
}

export interface FetchSuggestionsInput {
  question: string;
  reply: string;
  history?: ChatHistoryItem[];
}

/**
 * Meminta 3 saran pertanyaan lanjutan dari endpoint saran.
 */
export async function fetchSuggestions(
  input: FetchSuggestionsInput
): Promise<string[]> {
  try {
    const res = await fetch('/api/gemini/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: input.question,
        reply: input.reply,
        history: input.history || []
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return [];

    const data = await res.json().catch(() => ({}));
    const list: unknown = data?.suggestions;
    if (!Array.isArray(list)) return [];

    return list
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 3);
  } catch (err) {
    console.error('[Chatbot Service] Suggestions exception:', err);
    return [];
  }
}

/**
 * Mengirim pesan user ke API proxy Google Gemini dengan streaming SSE
 */
export async function streamChatMessage(
  input: SendChatMessageInput,
  handlers: StreamChatHandlers
): Promise<void> {
  const trimmed = input.message.trim();
  if (!trimmed) {
    handlers.onError('Pesan tidak boleh kosong.');
    return;
  }

  let fullText = '';
  let fallback = false;

  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        history: input.history || [],
        stream: true
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      handlers.onError(
        data?.error || `Terjadi kendala pada server (${res.status}).`
      );
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let match: RegExpExecArray | null;
      const boundary = /\r?\n\r?\n/;
      while ((match = boundary.exec(buffer)) !== null) {
        const block = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);

        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (typeof parsed.text === 'string' && parsed.text.length > 0) {
              fullText += parsed.text;
              handlers.onDelta(parsed.text);
            }
            if (parsed.fallback) fallback = true;
          } catch {
            // Lewati potongan SSE yang tidak bisa diparse
          }
        }
      }
    }

    handlers.onDone(fullText, fallback);
  } catch (err: any) {
    console.error('[Chatbot Service] Stream exception:', err);
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    if (fullText.length > 0) {
      handlers.onDone(fullText, fallback);
      return;
    }
    handlers.onError(
      isTimeout
        ? 'Maaf, waktu tunggu habis saat memproses jawaban. Silakan coba tanyakan kembali.'
        : 'Maaf, sambungan ke Linka terganggu. Silakan periksa koneksi internet Anda dan coba lagi.'
    );
  }
}
