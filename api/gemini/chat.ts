import type { ApiRequest, ApiResponse } from '../_types';
import { parseJsonBody, sendJson } from '../_lib/http';

export interface ChatMessage {
  role?: string;
  sender?: string;
  text?: string;
  parts?: Array<{ text: string }>;
  content?: string;
}

export interface ChatRequestPayload {
  message?: string;
  history?: ChatMessage[];
}

export const RESTOLINK_SYSTEM_PROMPT = `Anda adalah asisten virtual resmi RestoLink, platform web multi-tenant untuk UMKM kuliner di Indonesia.
Tugas Anda adalah membantu calon pengguna dan pengunjung memahami platform RestoLink dengan ramah, jelas, ringkas, dan profesional dalam Bahasa Indonesia.

Informasi Resmi RestoLink:
1. Tentang Platform:
   - RestoLink adalah platform pusat kendali terpadu bagi UMKM kuliner untuk mengelola profil resto, menu digital, dan pemesanan secara mandiri tanpa perlu membuat website dari nol.
2. Fitur Utama:
   - Website menu digital berbasis subdomain unik (contoh: warungmakan.restolink.site) yang langsung aktif dan cepat dibuka pelanggan via mobile browser.
   - Manajemen Kategori & Menu: CRUD menu, upload foto menu & logo usaha (terkompresi WebP otomatis via Cloudinary), penandaan menu terlaris / stok habis.
   - Pemesanan Tamu (Guest Checkout): Pelanggan dapat memesan langsung dari meja via scan QR Code tanpa perlu download aplikasi atau registrasi akun.
   - Dashboard Pemilik: Pemantauan pesanan masuk secara real-time dengan status (baru -> diproses -> selesai).
   - Pengaturan Resto: Jam operasional, alamat, kontak WhatsApp, nomor meja, rekening/QRIS resto.
3. Paket Layanan & Harga:
   - Paket Mikro: Rp 49.000 / bulan dengan uji coba (trial) berbayar 30 hari pertama via Midtrans Sandbox.
   - Paket Kecil & Menengah: Segera hadir (dalam tahap pengembangan fitur lanjutan).
4. Cara Pendaftaran & Memulai:
   - Buka menu 'Daftar' di landing page RestoLink (restolink.site).
   - Masukkan nama pemilik, nama resto, pilih subdomain unik yang diinginkan, email, dan kata sandi.
   - Selesaikan pembayaran paket Mikro untuk mengaktifkan tenant dan subdomain.
   - Masuk ke Dashboard Pemilik untuk mengatur menu dan mencetak QR Code meja.

Batasan & Aturan Ketat:
- Anda HANYA boleh menjawab pertanyaan yang berkaitan dengan RestoLink (fitur, harga/paket, cara daftar, cara kerja).
- JIKA pengguna bertanya di luar topik RestoLink (seperti pengetahuan umum, coding, politik, cuaca, lelucon, atau hal di luar RestoLink), tolak dengan sopan dan arahkan kembali ke RestoLink. Contoh: 'Maaf, saya adalah asisten virtual RestoLink dan hanya dapat membantu menjawab pertanyaan seputar platform RestoLink, fitur, paket harga, dan cara pendaftarannya. Ada yang ingin Anda tanyakan seputar RestoLink?'
- Jangan pernah memberikan informasi palsu, menjanjikan diskon di luar paket resmi, atau keluar dari persona RestoLink.`;

export const FALLBACK_REPLY_QUOTA =
  'Maaf, asisten AI RestoLink saat ini sedang mengalami lonjakan permintaan atau batas kuota layanan sementara. Silakan tinjau informasi fitur dan paket langganan langsung pada menu Fitur dan Harga di halaman ini, atau hubungi tim dukungan kami.';

export const FALLBACK_REPLY_GENERIC =
  'Maaf, terjadi kendala saat memproses jawaban asisten AI. Silakan coba kirim kembali pertanyaan Anda beberapa saat lagi.';

export function formatHistory(
  history?: ChatMessage[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  const formatted: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const item of history.slice(-10)) {
    if (!item) continue;
    let role: 'user' | 'model' = 'user';
    if (
      item.role === 'model' ||
      item.role === 'assistant' ||
      item.sender === 'bot' ||
      item.sender === 'model'
    ) {
      role = 'model';
    }

    let text = '';
    if (typeof item.text === 'string') {
      text = item.text.trim();
    } else if (typeof item.content === 'string') {
      text = item.content.trim();
    } else if (
      Array.isArray(item.parts) &&
      item.parts.length > 0 &&
      typeof item.parts[0]?.text === 'string'
    ) {
      text = item.parts[0].text.trim();
    }

    if (text.length > 0) {
      // Proteksi anti-abuse: potong teks riwayat maksimal 1000 karakter per pesan
      const sanitizedText = text.length > 1000 ? text.slice(0, 1000) : text;
      formatted.push({
        role,
        parts: [{ text: sanitizedText }],
      });
    }
  }

  // Ensure alternating sequence and starting with 'user'
  const sanitized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const item of formatted) {
    if (sanitized.length === 0) {
      if (item.role === 'user') {
        sanitized.push(item);
      }
    } else {
      const prev = sanitized[sanitized.length - 1];
      if (prev.role !== item.role) {
        sanitized.push(item);
      }
    }
  }

  // If the last history message is 'user', pop it so appending the current user message doesn't repeat 'user'
  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') {
    sanitized.pop();
  }

  return sanitized;
}

export function buildGeminiPayload(message: string, history?: ChatMessage[]) {
  const formattedHistory = formatHistory(history);
  const contents = [
    ...formattedHistory,
    {
      role: 'user',
      parts: [{ text: message.trim() }],
    },
  ];

  return {
    contents,
    systemInstruction: {
      parts: [{ text: RESTOLINK_SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
    },
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'GEMINI_API_KEY belum dikonfigurasi pada server.',
    });
  }

  try {
    const body = await parseJsonBody<ChatRequestPayload>(req);
    const rawMessage = body?.message;

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return sendJson(res, 400, {
        error: 'Pesan chat tidak boleh kosong.',
      });
    }

    const message = rawMessage.trim();
    if (message.length > 1000) {
      return sendJson(res, 400, {
        error: 'Pesan terlalu panjang. Maksimal 1000 karakter.',
      });
    }

    const payload = buildGeminiPayload(message, body.history);
    const model = process.env.GEMINI_MODEL || (process.env.NODE_ENV === 'test' ? 'gemini-1.5-flash' : 'gemini-3.8-flash');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      // 429 Too Many Requests / Quota Exceeded -> Berikan fallback santun agar UI tidak crash
      if (geminiRes.status === 429) {
        return sendJson(res, 200, {
          reply: FALLBACK_REPLY_QUOTA,
          fallback: true,
        });
      }

      const errText = await geminiRes.text().catch(() => '');
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Gemini API Error (${geminiRes.status}):`, errText);
      }

      return sendJson(res, 200, {
        reply: FALLBACK_REPLY_GENERIC,
        fallback: true,
      });
    }

    const data = await geminiRes.json();
    const candidate = data?.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;

    if (!replyText || typeof replyText !== 'string' || !replyText.trim()) {
      return sendJson(res, 200, {
        reply: FALLBACK_REPLY_GENERIC,
        fallback: true,
      });
    }

    return sendJson(res, 200, {
      reply: replyText.trim(),
    });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Gemini Chat Handler Exception:', err);
    }
    return sendJson(res, 200, {
      reply: FALLBACK_REPLY_GENERIC,
      fallback: true,
    });
  }
}
