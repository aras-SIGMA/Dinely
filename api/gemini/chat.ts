import type { ApiRequest, ApiResponse } from '../_types';
import { HttpError } from '../_lib/auth';
import { parseJsonBody, sendJson } from '../_lib/http';
import { buildRestoLinkSystemPrompt } from './knowledge';

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
  stream?: boolean;
}

export const RESTOLINK_SYSTEM_PROMPT = buildRestoLinkSystemPrompt();

export const FALLBACK_REPLY_QUOTA =
  'Maaf, Linka (asisten AI RestoLink) saat ini sedang mengalami lonjakan permintaan atau batas kuota layanan sementara. Silakan tinjau informasi fitur dan paket langganan langsung pada menu Fitur dan Harga di halaman ini, atau hubungi tim dukungan kami.';

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

export function extractTextDelta(chunk: any): string {
  const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text : '';
}

function initSse(res: ApiResponse): void {
  if (typeof (res as any).setHeader === 'function') {
    (res as any).setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    (res as any).setHeader('Cache-Control', 'no-cache, no-transform');
    (res as any).setHeader('Connection', 'keep-alive');
    (res as any).setHeader('X-Accel-Buffering', 'no');
  }
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }
}

function writeSse(res: ApiResponse, data: unknown): void {
  if (typeof (res as any).write === 'function') {
    (res as any).write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export function resolveModelEndpoint(
  model: string,
  method: 'generateContent' | 'streamGenerateContent',
  apiKey: string
): string {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${apiKey}`;
  return method === 'streamGenerateContent' ? `${base}&alt=sse` : base;
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
      maxOutputTokens: 1500,
    },
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  const contentType = req.headers?.['content-type'] || req.headers?.['Content-Type'];
  if (contentType && !contentType.includes('application/json')) {
    return sendJson(res, 415, { error: 'Content-Type harus application/json.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'GEMINI_API_KEY belum dikonfigurasi pada server.',
    });
  }

  let message: string;
  let history: ChatMessage[] | undefined;
  let wantsStream = false;

  try {
    const body = await parseJsonBody<ChatRequestPayload>(req);
    const rawMessage = body?.message;

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return sendJson(res, 400, {
        error: 'Pesan chat tidak boleh kosong.',
      });
    }

    message = rawMessage.trim();
    if (message.length > 1000) {
      return sendJson(res, 400, {
        error: 'Pesan terlalu panjang. Maksimal 1000 karakter.',
      });
    }

    history = body.history;
    wantsStream = body.stream === true;
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    return sendJson(res, 200, {
      reply: FALLBACK_REPLY_GENERIC,
      fallback: true,
    });
  }

  if (wantsStream) {
    return streamGeminiReply(res, apiKey, message, history);
  }

  return jsonGeminiReply(res, apiKey, message, history);
}

async function jsonGeminiReply(
  res: ApiResponse,
  apiKey: string,
  message: string,
  history?: ChatMessage[]
) {
  try {
    const payload = buildGeminiPayload(message, history);
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const geminiUrl = resolveModelEndpoint(primaryModel, 'generateContent', apiKey);

    let geminiRes: Response | null = null;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch (fetchErr: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Gemini primary (${primaryModel}) error:`, fetchErr?.message);
      }
    }

    // Jika model utama overload (503/timeout), fallback cepat ke model sekunder resmi
    if ((!geminiRes || !geminiRes.ok) && geminiRes?.status !== 429) {
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
      const fallbackUrl = resolveModelEndpoint(fallbackModel, 'generateContent', apiKey);
      try {
        geminiRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        });
      } catch (fallbackErr: any) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Gemini secondary fallback (${fallbackModel}) error:`, fallbackErr?.message);
        }
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      // 429 Too Many Requests / Quota Exceeded -> Berikan fallback santun agar UI tidak crash
      if (geminiRes?.status === 429) {
        return sendJson(res, 200, {
          reply: FALLBACK_REPLY_QUOTA,
          fallback: true,
        });
      }

      const errText = geminiRes
        ? await geminiRes.text().catch(() => '')
        : 'Network timeout / no response from Gemini service';
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Gemini API Error (${geminiRes?.status ?? 'TIMEOUT'}):`, errText);
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
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    if (process.env.NODE_ENV !== 'test') {
      console.error('Gemini Chat Handler Exception:', err);
    }
    return sendJson(res, 200, {
      reply: FALLBACK_REPLY_GENERIC,
      fallback: true,
    });
  }
}

function parseSseBuffer(buffer: string): { events: string[]; rest: string } {
  const events: string[] = [];
  let rest = buffer;
  const boundary = /\r?\n\r?\n/;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(rest)) !== null) {
    events.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }
  return { events, rest };
}

function extractSseDataLines(block: string): string[] {
  const lines = block.split('\n');
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  return dataLines;
}

async function streamGeminiReply(
  res: ApiResponse,
  apiKey: string,
  message: string,
  history?: ChatMessage[]
) {
  initSse(res);

  const payload = buildGeminiPayload(message, history);
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const url = resolveModelEndpoint(primaryModel, 'streamGenerateContent', apiKey);

  let geminiRes: Response | null = null;
  try {
    geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55000),
    });
  } catch (fetchErr: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`Gemini stream (${primaryModel}) error:`, fetchErr?.message);
    }
  }

  if (!geminiRes || !geminiRes.ok || !geminiRes.body) {
    if (geminiRes?.status === 429) {
      writeSse(res, { text: FALLBACK_REPLY_QUOTA, fallback: true });
    } else {
      const errText = geminiRes
        ? await geminiRes.text().catch(() => '')
        : 'Network timeout / no response from Gemini stream service';
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Gemini Stream Error (${geminiRes?.status ?? 'TIMEOUT'}):`, errText);
      }
      writeSse(res, { text: FALLBACK_REPLY_GENERIC, fallback: true });
    }
    writeSse(res, '[DONE]');
    if (typeof (res as any).end === 'function') (res as any).end();
    return;
  }

  const reader = (geminiRes.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;

      for (const block of events) {
        for (const dataLine of extractSseDataLines(block)) {
          if (!dataLine || dataLine === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataLine);
            const delta = extractTextDelta(parsed);
            if (delta) {
              emitted = true;
              writeSse(res, { text: delta });
            }
          } catch {
            // Lewati potongan SSE yang tidak bisa diparse
          }
        }
      }
    }
  } catch (streamErr: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Gemini stream read error:', streamErr?.message);
    }
  } finally {
    if (!emitted) {
      writeSse(res, { text: FALLBACK_REPLY_GENERIC, fallback: true });
    }
    writeSse(res, '[DONE]');
    if (typeof (res as any).end === 'function') (res as any).end();
  }
}
