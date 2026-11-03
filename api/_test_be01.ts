import handler from './midtrans/create';
import type { ApiRequest, ApiResponse } from './_types';
import { getSupabaseAnon } from './_lib/supabase';

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
  console.log('--- TEST SUITE: BE-01 (api/midtrans/create.ts) ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, actual?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, actual !== undefined ? `Actual: ${JSON.stringify(actual)}` : '');
      failed++;
    }
  }

  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'mock-anon-key';

  // TC-01: Method GET ditolak dengan 405
  {
    const req = { method: 'GET', headers: {} } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 405 && jsonBody?.error?.includes('POST'), 'TC-01: Method GET ditolak 405', { statusCode, jsonBody });
  }

  // TC-02: Header Authorization kosong ditolak dengan 401
  {
    const req = { method: 'POST', headers: {} } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 401 && jsonBody?.error?.includes('Authorization'), 'TC-02: Header Authorization kosong ditolak 401', { statusCode, jsonBody });
  }

  // TC-03: Bearer token tanpa isi ditolak dengan 401
  {
    const req = { method: 'POST', headers: { authorization: 'Bearer   ' } } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 401 && jsonBody?.error?.includes('kosong'), 'TC-03: Bearer token kosong ditolak 401', { statusCode, jsonBody });
  }

  // TC-04: Bearer token palsu ditolak dengan 401 (verifikasi ke Supabase Anon)
  {
    const req = { method: 'POST', headers: { authorization: 'Bearer token-palsu-123' } } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 401, 'TC-04: Bearer token tidak valid ditolak 401', { statusCode, jsonBody });
  }

  // Mock valid user login for input validation checks
  const anon = getSupabaseAnon();
  anon.auth.getUser = async (token: string) => {
    if (token === 'valid-owner-jwt') {
      return {
        data: {
          user: {
            id: 'owner-uuid-123',
            email: 'owner@restolink.test',
            user_metadata: { full_name: 'Owner Resto' },
          },
        },
        error: null,
      } as any;
    }
    return { data: { user: null }, error: { message: 'Invalid JWT' } } as any;
  };

  // TC-05: Payload body kosong atau tidak lengkap ditolak dengan 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: { tenant_id: 'tenant-123' }, // missing package_id and billing_cycle
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('wajib diisi'), 'TC-05: Field body tidak lengkap ditolak 400', { statusCode, jsonBody });
  }

  // TC-06: billing_cycle tidak valid ditolak dengan 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: 'tenant-123',
        package_id: 'pkg-123',
        billing_cycle: 'unlimited',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('billing_cycle tidak valid'), 'TC-06: billing_cycle tidak valid ditolak 400', { statusCode, jsonBody });
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
