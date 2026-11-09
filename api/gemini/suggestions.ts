import type { ApiRequest, ApiResponse } from '../_types';
import { HttpError } from '../_lib/auth';
import { parseJsonBody, sendJson } from '../_lib/http';
import { PLATFORM_NAME, ASSISTANT_NAME } from './knowledge';

export interface SuggestionsPayload {
  question?: string;
  reply?: string;
  history?: Array<{ role?: string; sender?: string; text?: string }>;
}

const SUGGESTION_SYSTEM_PROMPT = `Anda adalah mesin penyusun pertanyaan lanjutan untuk asisten AI bernama ${ASSISTANT_NAME} pada platform ${PLATFORM_NAME}.
Tugas Anda: berdasarkan jawaban terakhir asisten, hasilkan TEPAT 3 pertanyaan lanjutan singkat yang kemungkinan besar ingin ditanyakan pengguna berikutnya.
Aturan:
- Pertanyaan seputar ${PLATFORM_NAME} (fitur, paket/harga, cara daftar, cara pakai, QR Code, pembayaran).
- Maksimal 8 kata per pertanyaan.
- Bahasa Indonesia, tanpa penomoran, tanpa tanda tanya ganda.
- Jangan mengulang pertanyaan yang sudah ada di riwayat.`;

const FALLBACK_SUGGESTIONS = [
  'Berapa harga paket Mikro?',
  'Bagaimana cara daftarnya?',
  'Apakah ada komisi per pesanan?'
];

export function parseSuggestions(rawText: string): string[] {
  if (!rawText) return [];
  let text = rawText.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.suggestions)
    ? parsed.suggestions
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : [];

  const cleaned = list
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/^[-*\d.\s]+/, '').trim())
    .filter((item) => item.length > 0 && item.length <= 80);

  return cleaned.slice(0, 3);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 200, { suggestions: FALLBACK_SUGGESTIONS });
  }

  try {
    const body = await parseJsonBody<SuggestionsPayload>(req);
    const reply = typeof body?.reply === 'string' ? body.reply.trim().slice(0, 2000) : '';
    const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 1000) : '';

    if (!reply && !question) {
      return sendJson(res, 200, { suggestions: FALLBACK_SUGGESTIONS });
    }

    const recentHistory = Array.isArray(body?.history)
      ? body.history
          .slice(-6)
          .map((h) => {
            const role = h?.role === 'model' || h?.sender === 'bot' || h?.sender === 'model' ? 'Asisten' : 'Pengguna';
            const text = typeof h?.text === 'string' ? h.text.slice(0, 400) : '';
            return text ? `${role}: ${text}` : '';
          })
          .filter(Boolean)
          .join('\n')
      : '';

    const userContent = `Pertanyaan pengguna terakhir: ${question || '(tidak ada)'}
Jawaban asisten terakhir: ${reply || '(tidak ada)'}
${recentHistory ? `\nRiwayat singkat:\n${recentHistory}` : ''}

Hasilkan 3 pertanyaan lanjutan dalam format JSON: {"suggestions": ["...", "...", "..."]}`;

    const model = process.env.GEMINI_SUGGESTION_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: SUGGESTION_SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 200,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!geminiRes.ok) {
      return sendJson(res, 200, { suggestions: FALLBACK_SUGGESTIONS });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const suggestions = parseSuggestions(typeof rawText === 'string' ? rawText : '');

    return sendJson(res, 200, {
      suggestions: suggestions.length > 0 ? suggestions : FALLBACK_SUGGESTIONS
    });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    if (process.env.NODE_ENV !== 'test') {
      console.error('Gemini Suggestions Handler Exception:', err);
    }
    return sendJson(res, 200, { suggestions: FALLBACK_SUGGESTIONS });
  }
}
