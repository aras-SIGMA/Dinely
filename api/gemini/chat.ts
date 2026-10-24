import type { ApiRequest, ApiResponse } from '../_types';

/**
 * ============================================================================
 * ENDPOINT: POST /api/gemini/chat
 * ============================================================================
 * FUNGSI:
 * Proxy endpoint untuk Chatbot AI di Landing Page utama platform.
 * Menjawab pertanyaan calon pengguna seputar fitur, paket, harga, dan cara daftar.
 * Chatbot ini HANYA ada di landing page utama, TIDAK dipasang di website tenant.
 *
 * VARIABEL LINGKUNGAN (.env) YANG DIGUNAKAN:
 * - GEMINI_API_KEY: Kunci API Google Gemini (AI Studio)
 *
 * PAYLOAD REQUEST DARI FRONTEND:
 * {
 *   "message": "Halo, apakah ada uji coba gratis di RestoLink?",
 *   "history": [ ...riwayat pesan sebelumnya... ]
 * }
 *
 * OUTPUT RESPONSE KE FRONTEND:
 * {
 *   "reply": "Halo! Ya, RestoLink menyediakan uji coba gratis 30 hari untuk paket..."
 * }
 * ============================================================================
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  // TODO (Milestone 8):
  // 1. Validasi input pesan tidak kosong dan tidak melebihi batas panjang karakter
  // 2. Sertakan System Prompt yang membatasi AI hanya menjawab seputar produk RestoLink
  // 3. Panggil API Gemini: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
  // 4. Kembalikan teks balasan terstruktur ke client

  return res.status(501).json({
    message: 'Endpoint siap diimplementasikan pada Milestone 8 (Chatbot Gemini).'
  });
}
