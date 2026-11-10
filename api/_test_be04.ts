import handler, {
  buildGeminiPayload,
  formatHistory,
  DINELY_SYSTEM_PROMPT,
  FALLBACK_REPLY_QUOTA,
  FALLBACK_REPLY_GENERIC,
} from './gemini/chat';
import type { ApiRequest, ApiResponse } from './_types';

function createMockRes(): {
  res: ApiResponse;
  getData: () => { statusCode: number; jsonBody: any };
} {
  let statusCode = 200;
  let jsonBody: any = null;

  const res = {
    statusCode: 200,
    setHeader: () => res,
    end: (chunk?: any) => {
      if (chunk) {
        try {
          jsonBody = JSON.parse(chunk);
        } catch {
          jsonBody = chunk;
        }
      }
      return res;
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonBody = data;
      return res;
    },
    send: (data: any) => {
      jsonBody = data;
      return res;
    },
  } as unknown as ApiResponse;

  return {
    res,
    getData: () => ({ statusCode, jsonBody }),
  };
}

async function runTests() {
  console.log('--- TEST SUITE: BE-04 (api/gemini/chat.ts) ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, actual?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(
        `[FAIL] ${testName}`,
        actual !== undefined ? `Actual: ${JSON.stringify(actual)}` : ''
      );
      failed++;
    }
  }

  const originalFetch = global.fetch;

  // TC-01: Method GET ditolak 405
  {
    const req = { method: 'GET', headers: {} } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 405 && jsonBody?.error?.includes('POST'),
      'TC-01: Method GET ditolak 405',
      { statusCode, jsonBody }
    );
  }

  // Setup GEMINI_API_KEY
  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'mock-gemini-api-key-12345';

  // TC-02: Body tanpa field message ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {},
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('tidak boleh kosong'),
      'TC-02: Body tanpa field message ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-03: Pesan hanya spasi kosong ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: '    ' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('tidak boleh kosong'),
      'TC-03: Pesan hanya spasi kosong ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-04: Pesan melebihi 1000 karakter ditolak 400
  {
    const longMessage = 'a'.repeat(1001);
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: longMessage },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('1000 karakter'),
      'TC-04: Pesan melebihi 1000 karakter ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-05: Missing GEMINI_API_KEY menghasilkan 500
  {
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo Dinely' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    process.env.GEMINI_API_KEY = savedKey;

    assert(
      statusCode === 500 && jsonBody?.error?.includes('GEMINI_API_KEY'),
      'TC-05: Missing GEMINI_API_KEY menghasilkan 500',
      { statusCode, jsonBody }
    );
  }

  // TC-06: Request normal berhasil memproksi ke Gemini dan mengembalikan reply 200 OK
  {
    let capturedUrl = '';
    let capturedBody: any = null;

    global.fetch = (async (url: string, init?: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init?.body || '{}');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Halo! Dinely adalah platform pusat kendali UMKM kuliner.',
                  },
                ],
              },
            },
          ],
        }),
      } as any;
    }) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Apa itu Dinely?' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.reply === 'Halo! Dinely adalah platform pusat kendali UMKM kuliner.' &&
      capturedUrl.includes('gemini-3.5-flash') &&
      capturedUrl.includes('key=mock-gemini-api-key-12345') &&
      capturedBody?.contents?.[0]?.parts?.[0]?.text === 'Apa itu Dinely?',
      'TC-06: Request normal berhasil memproksi ke Gemini dengan balasan reply terstruktur',
      { statusCode, jsonBody, capturedUrl }
    );
  }

  // TC-07: Formatting history multi-turn tersanitasi bergantian (user -> model -> user)
  {
    const history = [
      { role: 'user', text: 'Halo' },
      { role: 'model', text: 'Halo! Ada yang bisa saya bantu seputar Dinely?' },
      { sender: 'user', text: 'Berapa harga paket mikro?' },
      { sender: 'bot', text: 'Paket mikro Rp 49.000 per bulan.' },
    ];

    const payload = buildGeminiPayload('Bagaimana cara daftarnya?', history);
    const contents = payload.contents;

    const sequenceRoles = contents.map((c) => c.role);
    const expectedRoles = ['user', 'model', 'user', 'model', 'user'];

    assert(
      JSON.stringify(sequenceRoles) === JSON.stringify(expectedRoles) &&
      contents[contents.length - 1].parts[0].text === 'Bagaimana cara daftarnya?',
      'TC-07: History multi-turn terurut bergantian user -> model -> user',
      { sequenceRoles, expectedRoles }
    );
  }

  // TC-08: History yang berakhir dengan pesan user dibersihkan agar tidak menduplikasi role user
  {
    const history = [
      { role: 'user', text: 'Pertanyaan 1' },
      { role: 'model', text: 'Jawaban 1' },
      { role: 'user', text: 'Pertanyaan yang belum terjawab' },
    ];

    const payload = buildGeminiPayload('Pertanyaan terkini', history);
    const sequenceRoles = payload.contents.map((c) => c.role);
    const expectedRoles = ['user', 'model', 'user'];

    assert(
      JSON.stringify(sequenceRoles) === JSON.stringify(expectedRoles) &&
      payload.contents[payload.contents.length - 1].parts[0].text === 'Pertanyaan terkini',
      'TC-08: History berujung user dinormalisasi agar tidak melanggar aturan role Gemini',
      { sequenceRoles, expectedRoles }
    );
  }

  // TC-09: Gemini 429 (Quota Exceeded / Rate Limit) menghasilkan fallback ramah (200 OK)
  {
    global.fetch = (async () => ({
      ok: false,
      status: 429,
      text: async () => 'Resource has been exhausted (e.g. check quota).',
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Apakah bisa pakai domain sendiri?' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.fallback === true &&
      jsonBody?.reply === FALLBACK_REPLY_QUOTA,
      'TC-09: Gemini 429 (kuota habis) ditangani dengan respon fallback santun (200 OK)',
      { statusCode, jsonBody }
    );
  }

  // TC-10: Gemini 500 / Error Server menghasilkan fallback generik (200 OK)
  {
    global.fetch = (async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Google Error',
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.fallback === true &&
      jsonBody?.reply === FALLBACK_REPLY_GENERIC,
      'TC-10: Gemini 500 server error ditangani dengan fallback generik (200 OK)',
      { statusCode, jsonBody }
    );
  }

  // TC-11: Network exception / timeout ditangani dengan fallback (200 OK)
  {
    global.fetch = (async () => {
      throw new Error('Network socket disconnected');
    }) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.fallback === true &&
      jsonBody?.reply === FALLBACK_REPLY_GENERIC,
      'TC-11: Network exception / timeout ditangani aman dengan fallback',
      { statusCode, jsonBody }
    );
  }

  // TC-12: Gemini candidate kosong atau tanpa text mengembalikan fallback
  {
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [],
      }),
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.fallback === true &&
      jsonBody?.reply === FALLBACK_REPLY_GENERIC,
      'TC-12: Candidates respons Gemini kosong ditangani dengan fallback',
      { statusCode, jsonBody }
    );
  }

  // TC-13: System prompt memuat seluruh klausul wajib (fitur, paket Rp 49.000, cara daftar, penolakan off-topic)
  {
    const prompt = DINELY_SYSTEM_PROMPT;
    const hasFitur = prompt.includes('subdomain unik') && prompt.includes('QR Code');
    const hasPaket = prompt.includes('49.000') && prompt.includes('Paket Mikro');
    const hasDaftar = prompt.includes('Daftar') && prompt.includes('Dashboard');
    const hasOfftopic = prompt.includes('di luar topik Dinely') && prompt.includes('tolak dengan sopan');

    assert(
      hasFitur && hasPaket && hasDaftar && hasOfftopic,
      'TC-13: System prompt memuat informasi fitur, paket Mikro, alur daftar, dan aturan penolakan off-topic',
      { hasFitur, hasPaket, hasDaftar, hasOfftopic }
    );
  }

  // TC-14: History item teks melebihi 1000 karakter dipotong aman (Anti-DoS token limit)
  {
    const giantText = 'X'.repeat(5000);
    const history = [
      { role: 'user', text: giantText },
      { role: 'model', text: 'Balasan model' },
    ];
    const formatted = formatHistory(history);
    const userItemText = formatted[0]?.parts[0]?.text;

    assert(
      formatted.length === 2 && userItemText.length === 1000,
      'TC-14: History item teks melebihi 1000 karakter dipotong aman ke 1000 karakter',
      { originalLength: giantText.length, sanitizedLength: userItemText?.length }
    );
  }

  // TC-15: Model utama gagal (503) otomatis beralih ke model sekunder (gemini-3.5-flash-lite) dengan auth header
  {
    const capturedCalls: { url: string; headers: any }[] = [];
    global.fetch = (async (url: string, opts: any) => {
      capturedCalls.push({ url, headers: opts?.headers });
      if (url.includes('gemini-3.5-flash:generateContent')) {
        return {
          ok: false,
          status: 503,
          text: async () => 'Service Unavailable / Overloaded',
        };
      }
      if (url.includes('gemini-3.5-flash-lite:generateContent')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Balasan sukses dari secondary fallback model.' }],
                },
              },
            ],
          }),
        };
      }
      return { ok: false, status: 500 };
    }) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Pertanyaan saat server utama overload' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const fallbackCall = capturedCalls.find((c) => c.url.includes('gemini-3.5-flash-lite'));
    const hasHeaderKey = fallbackCall?.headers?.['x-goog-api-key'] === 'mock-gemini-api-key-12345';

    assert(
      statusCode === 200 &&
      jsonBody?.reply === 'Balasan sukses dari secondary fallback model.' &&
      fallbackCall !== undefined &&
      hasHeaderKey,
      'TC-15: Model utama 503 otomatis beralih ke secondary fallback dengan auth header aman',
      { statusCode, jsonBody, capturedCalls }
    );
  }

  // Helper: mock response yang menangkap SSE yang ditulis handler
  function createSseMockRes(): { res: ApiResponse; getWritten: () => string } {
    let written = '';
    const res = {
      statusCode: 200,
      setHeader: () => res,
      flushHeaders: () => {},
      write: (chunk: any) => {
        written += typeof chunk === 'string' ? chunk : String(chunk);
        return true;
      },
      end: () => res,
      status: () => res,
      json: (data: any) => {
        written += `JSON:${JSON.stringify(data)}`;
        return res;
      },
      send: () => res,
    } as unknown as ApiResponse;
    return { res, getWritten: () => written };
  }

  // Helper: bangun ReadableStream dari potongan string SSE
  function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  }

  function extractClientText(written: string): string {
    return written
      .split(/\r?\n\r?\n/)
      .filter((block) => block.startsWith('data:'))
      .map((block) => block.slice(5).trim())
      .filter((payload) => payload && payload !== '[DONE]')
      .map((payload) => {
        try {
          return JSON.parse(payload).text || '';
        } catch {
          return '';
        }
      })
      .join('');
  }

  // TC-16: Streaming SSE dengan pemisah CRLF (\r\n\r\n) harus mengalirkan delta teks (regression: parser)
  {
    const deltaText = 'Dinely adalah platform menu digital untuk UMKM kuliner.';
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      body: streamFromChunks([
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Dinely adalah ' }] } }] })}\r\n\r\n`,
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'platform menu digital ' }] } }] })}\r\n\r\n`,
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'untuk UMKM kuliner.' }] } }] })}\r\n\r\n`,
      ]),
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Apa itu Dinely?', stream: true },
    } as unknown as ApiRequest;

    const { res, getWritten } = createSseMockRes();
    await handler(req, res);
    const written = getWritten();
    const clientText = extractClientText(written);

    assert(
      clientText === deltaText &&
        written.includes('[DONE]') &&
        !written.includes(FALLBACK_REPLY_GENERIC),
      'TC-16: Stream SSE ber-CRLF mengalirkan delta teks utuh (bukan fallback)',
      { clientText, written: written.slice(0, 200) }
    );
  }

  // TC-17: Streaming SSE dengan pemisah LF (\n\n) juga harus terekstrak
  {
    const deltaText = 'Kode verifikasi dikirim ke email Anda.';
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      body: streamFromChunks([
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Kode verifikasi ' }] } }] })}\n\n`,
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'dikirim ke email Anda.' }] } }] })}\n\n`,
      ]),
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Bagaimana verifikasi OTP?', stream: true },
    } as unknown as ApiRequest;

    const { res, getWritten } = createSseMockRes();
    await handler(req, res);
    const clientText = extractClientText(getWritten());

    assert(
      clientText === deltaText,
      'TC-17: Stream SSE ber-LF mengalirkan delta teks utuh',
      { clientText }
    );
  }

  // TC-18: Delta SSE terpecah di tengah event antar-chunk tetap ditangani (buffering)
  {
    const deltaText = 'Halo dari Linka.';
    const body1 = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Halo ' }] } }] })}\r`;
    const body2 = `\n\r\ndata: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'dari Linka.' }] } }] })}\r\n\r\n`;

    global.fetch = (async () => ({
      ok: true,
      status: 200,
      body: streamFromChunks([body1, body2]),
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo', stream: true },
    } as unknown as ApiRequest;

    const { res, getWritten } = createSseMockRes();
    await handler(req, res);
    const clientText = extractClientText(getWritten());

    assert(
      clientText === deltaText,
      'TC-18: Delta SSE terpecah antar-chunk tetap dirangkai dengan benar',
      { clientText }
    );
  }

  // TC-19: Stream tanpa delta (kandidat kosong) menghasilkan fallback generik
  {
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      body: streamFromChunks([`data: ${JSON.stringify({ candidates: [] })}\r\n\r\n`]),
    })) as any;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Halo', stream: true },
    } as unknown as ApiRequest;

    const { res, getWritten } = createSseMockRes();
    await handler(req, res);
    const written = getWritten();

    assert(
      written.includes(FALLBACK_REPLY_GENERIC) && written.includes('[DONE]'),
      'TC-19: Stream tanpa delta teks menghasilkan fallback generik + [DONE]',
      { written: written.slice(0, 200) }
    );
  }

  // Restore fetch
  global.fetch = originalFetch;

  // TC-20: Konfigurasi generasi dioptimalkan untuk latensi rendah (jawaban ringkas & cepat)
  {
    const payload = buildGeminiPayload('Berapa harga paket Mikro?');
    const config = payload.generationConfig as any;

    assert(
      config?.maxOutputTokens === 600 &&
      config?.thinkingConfig?.thinkingLevel === 'LOW',
      'TC-20: generationConfig memakai maxOutputTokens 600 + thinkingLevel LOW untuk respons ringkas & cepat',
      { config }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
