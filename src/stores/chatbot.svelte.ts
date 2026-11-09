/**
 * ============================================================================
 * RESTOLINK - Chatbot Reactive Store (FE-17 / Milestone 8)
 * ============================================================================
 * Mengelola state dialog percakapan asisten virtual AI di landing page
 * berbasis Svelte 5 Runes ($state).
 * ============================================================================
 */

import { streamChatMessage, fetchSuggestions, type ChatHistoryItem } from '@/lib/chatbot';

export interface UiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}

const STORAGE_KEY = 'restolink_chat_messages_v4';
const MAX_PERSISTED_MESSAGES = 60;

const INITIAL_GREETING: UiChatMessage = {
  id: 'greeting-default',
  sender: 'assistant',
  text: 'Halo! Saya Linka, maskot & asisten virtual resmi RestoLink. Ada yang bisa saya bantu terkait fitur menu digital, cara pendaftaran, atau paket Mikro usaha Anda?',
  timestamp: new Date().toISOString()
};

export const QUICK_PROMPTS = [
  'Apa itu RestoLink?',
  'Berapa biaya paket Mikro?',
  'Bagaimana cara daftarnya?',
  'Apakah ada komisi per pesanan?'
];

class ChatbotStore {
  isOpen = $state(false);
  loading = $state(false);
  messages = $state<UiChatMessage[]>([INITIAL_GREETING]);
  suggestions = $state<string[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
        }
      }
    } catch {
      // Abaikan parsing error
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const capped = this.messages.slice(-MAX_PERSISTED_MESSAGES);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // Abaikan quota error
    }
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  clear(): void {
    this.messages = [
      {
        id: `greeting-${Date.now()}`,
        sender: 'assistant',
        text: 'Halo kembali! Percakapan telah direset. Saya Linka, ada pertanyaan lain seputar RestoLink yang bisa saya bantu?',
        timestamp: new Date().toISOString()
      }
    ];
    this.suggestions = [];
    this.saveToStorage();
  }

  get historyPayload(): ChatHistoryItem[] {
    return this.messages.slice(-10).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
  }

  async send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.loading) return;

    const userMsg: UiChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    // Tambahkan pesan user ke antrean
    this.messages = [...this.messages, userMsg];
    this.saveToStorage();

    this.loading = true;
    this.suggestions = [];

    // Placeholder bubble assistant untuk streaming inkremental
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const placeholder: UiChatMessage = {
      id: assistantId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toISOString()
    };
    this.messages = [...this.messages, placeholder];

    const updateAssistant = (text: string, isError = false) => {
      this.messages = this.messages.map((msg) =>
        msg.id === assistantId ? { ...msg, text, isError } : msg
      );
    };

    const historyForRequest = this.historyPayload.slice(0, -1);

    try {
      await streamChatMessage(
        {
          message: trimmed,
          history: historyForRequest
        },
        {
          onDelta: (delta) => {
            const current = this.messages.find((m) => m.id === assistantId);
            updateAssistant((current?.text ?? '') + delta);
          },
          onDone: (fullText) => {
            if (!fullText.trim()) {
              updateAssistant(
                'Maaf, saya tidak dapat memproses jawaban saat ini. Silakan coba lagi.',
                true
              );
              return;
            }
            this.saveToStorage();
            void this.loadSuggestions(trimmed, fullText, historyForRequest);
          },
          onError: (message) => {
            updateAssistant(`Maaf, kendala: ${message}`, true);
            this.saveToStorage();
          }
        }
      );
    } catch (err: any) {
      console.error('[chatbotStore] Error streaming message:', err);
      updateAssistant(
        'Maaf, terjadi kendala koneksi ke server asisten AI. Silakan coba kembali sesaat lagi.',
        true
      );
      this.saveToStorage();
    } finally {
      this.loading = false;
    }
  }

  async loadSuggestions(
    question: string,
    reply: string,
    history: ChatHistoryItem[]
  ): Promise<void> {
    const list = await fetchSuggestions({ question, reply, history });
    this.suggestions = list;
  }
}

export const chatbotStore = new ChatbotStore();
