/**
 * ============================================================================
 * RESTOLINK - Chatbot Reactive Store (FE-17 / Milestone 8)
 * ============================================================================
 * Mengelola state dialog percakapan asisten virtual AI di landing page
 * berbasis Svelte 5 Runes ($state).
 * ============================================================================
 */

import { sendChatMessage, type ChatHistoryItem } from '@/lib/chatbot';

export interface UiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}

const STORAGE_KEY = 'restolink_chat_messages_v1';

const INITIAL_GREETING: UiChatMessage = {
  id: 'greeting-default',
  sender: 'assistant',
  text: 'Halo! 👋 Saya asisten virtual RestoLink. Ada yang bisa saya bantu terkait fitur menu digital, cara pendaftaran, atau paket Mikro?',
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
  hasUnread = $state(false);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
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
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch {
      // Abaikan quota error
    }
  }

  open(): void {
    this.isOpen = true;
    this.hasUnread = false;
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
        text: 'Halo kembali! Percakapan telah direset. Ada pertanyaan lain seputar RestoLink yang bisa saya bantu?',
        timestamp: new Date().toISOString()
      }
    ];
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

    try {
      const result = await sendChatMessage({
        message: trimmed,
        history: this.historyPayload
      });

      const replyText = result.error
        ? `Maaf, kendala: ${result.error}`
        : result.reply;

      const assistantMsg: UiChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
        isError: Boolean(result.error)
      };

      this.messages = [...this.messages, assistantMsg];

      // Jika window sedang ditutup, beri notifikasi unread
      if (!this.isOpen) {
        this.hasUnread = true;
      }

      this.saveToStorage();
    } catch (err: any) {
      console.error('[chatbotStore] Error sending message:', err);
      const fallbackMsg: UiChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Maaf, terjadi kendala koneksi ke server asisten AI. Silakan coba kembali sesaat lagi.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      this.messages = [...this.messages, fallbackMsg];
      this.saveToStorage();
    } finally {
      this.loading = false;
    }
  }
}

export const chatbotStore = new ChatbotStore();
