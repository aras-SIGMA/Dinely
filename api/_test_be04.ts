import handler, {
  buildGeminiPayload,
  formatHistory,
  RESTOLINK_SYSTEM_PROMPT,
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
      body: { message: 'Halo RestoLink' },
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
                    text: 'Halo! RestoLink adalah platform pusat kendali UMKM kuliner.',
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
      body: { message: 'Apa itu RestoLink?' },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    assert(
      statusCode === 200 &&
      jsonBody?.reply === 'Halo! RestoLink adalah platform pusat kendali UMKM kuliner.' &&
      capturedUrl.includes('gemini-1.5-flash') &&
      capturedUrl.includes('key=mock-gemini-api-key-12345') &&
      capturedBody?.contents?.[0]?.parts?.[0]?.text === 'Apa itu RestoLink?',
      'TC-06: Request normal berhasil memproksi ke Gemini dengan balasan reply terstruktur',
      { statusCode, jsonBody, capturedUrl }
    );
  }

  // TC-07: Formatting history multi-turn tersanitasi bergantian (user -> model -> user)
  {
    const history = [
      { role: 'user', text: 'Halo' },
      { role: 'model', text: 'Halo! Ada yang bisa saya bantu seputar RestoLink?' },
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
    const prompt = RESTOLINK_SYSTEM_PROMPT;
    const hasFitur = prompt.includes('subdomain unik') && prompt.includes('QR Code');
    const hasPaket = prompt.includes('49.000') && prompt.includes('Paket Mikro');
    const hasDaftar = prompt.includes('Daftar') && prompt.includes('Dashboard');
    const hasOfftopic = prompt.includes('di luar topik RestoLink') && prompt.includes('tolak dengan sopan');

    assert(
      hasFitur && hasPaket && hasDaftar && hasOfftopic,
      'TC-13: System prompt memuat informasi fitur, paket Mikro, alur daftar, dan aturan penolakan off-topic',
      { hasFitur, hasPaket, hasDaftar, hasOfftopic }
    );
  }

  // Restore fetch
  global.fetch = originalFetch;

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
