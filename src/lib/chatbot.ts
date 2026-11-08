/**
 * ============================================================================
 * RESTOLINK - Client Chatbot Service (FE-17 / Milestone 8)
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

export interface SendChatMessageResult {
  reply: string;
  fallback?: boolean;
  error?: string;
}

/**
 * Mengirim pesan user ke API proxy Google Gemini
 */
export async function sendChatMessage(
  input: SendChatMessageInput
): Promise<SendChatMessageResult> {
  const trimmed = input.message.trim();
  if (!trimmed) {
    return {
      reply: '',
      error: 'Pesan tidak boleh kosong.'
    };
  }

  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        history: input.history || []
      }),
      signal: AbortSignal.timeout(20000)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error || `Terjadi kendala pada server (${res.status}).`;
      return {
        reply: '',
        error: errorMsg
      };
    }

    return {
      reply: data.reply || 'Maaf, saya tidak dapat memproses jawaban saat ini.',
      fallback: Boolean(data.fallback)
    };
  } catch (err: any) {
    console.error('[Chatbot Service] Network exception:', err);
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      reply: isTimeout
        ? 'Maaf, waktu tunggu habis saat memproses jawaban. Silakan coba tanyakan kembali.'
        : 'Maaf, sambungan ke Linka terganggu. Silakan periksa koneksi internet Anda dan coba lagi.',
      fallback: true
    };
  }
}
