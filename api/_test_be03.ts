import handler, { generateCloudinarySignature } from './cloudinary/sign-upload';
import type { ApiRequest, ApiResponse } from './_types';
import { createHash } from 'node:crypto';
import { getSupabaseAnon, getSupabaseAdmin } from './_lib/supabase';

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
  console.log('--- TEST SUITE: BE-03 (api/cloudinary/sign-upload.ts) ---');
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

  // Setup environment variables
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  process.env.CLOUDINARY_CLOUD_NAME = 'restolink-cloud';
  process.env.CLOUDINARY_API_KEY = '123456789012345';
  process.env.CLOUDINARY_API_SECRET = 'mock_secret_abcdef123456';

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

  // TC-02: Header Authorization kosong ditolak 401
  {
    const req = { method: 'POST', headers: {} } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 401 && jsonBody?.error?.includes('Authorization'),
      'TC-02: Header Authorization kosong ditolak 401',
      { statusCode, jsonBody }
    );
  }

  // TC-03: Bearer token kosong ditolak 401
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer   ' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 401 && jsonBody?.error?.includes('kosong'),
      'TC-03: Bearer token kosong ditolak 401',
      { statusCode, jsonBody }
    );
  }

  // TC-04: Bearer token tidak valid ditolak 401
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-invalid-xyz' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode } = getData();
    assert(statusCode === 401, 'TC-04: Bearer token tidak valid ditolak 401', {
      statusCode,
    });
  }

  // Mock state untuk Supabase Auth & DB
  const mockUsers: Record<string, any> = {
    'token-owner-1': { id: 'user-owner-1', email: 'owner1@restolink.site' },
    'token-owner-2': { id: 'user-owner-2', email: 'owner2@restolink.site' },
    'token-no-tenant': { id: 'user-lonely', email: 'lonely@restolink.site' },
    'token-admin': { id: 'user-admin-1', email: 'admin@restolink.site' },
  };

  const mockProfiles: Record<string, any> = {
    'user-owner-1': { id: 'user-owner-1', role: 'owner' },
    'user-owner-2': { id: 'user-owner-2', role: 'owner' },
    'user-lonely': { id: 'user-lonely', role: 'owner' },
    'user-admin-1': { id: 'user-admin-1', role: 'platform_admin' },
  };

  const mockTenants: Record<string, any> = {
    'tenant-1': {
      id: 'tenant-1',
      owner_id: 'user-owner-1',
      business_name: 'Warung Bu Siti',
      status: 'active',
    },
    'tenant-suspended': {
      id: 'tenant-suspended',
      owner_id: 'user-owner-1',
      business_name: 'Warung Nasi Uduk',
      status: 'suspended',
    },
    'tenant-2': {
      id: 'tenant-2',
      owner_id: 'user-owner-2',
      business_name: 'Bakso Mas Joko',
      status: 'active',
    },
  };

  const anonClient = getSupabaseAnon();
  anonClient.auth.getUser = (async (token: string) => {
    const user = mockUsers[token];
    if (user) {
      return { data: { user }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid JWT Token' } };
  }) as any;

  const adminClient = getSupabaseAdmin();
  adminClient.from = ((tableName: string) => {
    if (tableName === 'users') {
      return {
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: async () => {
              const u = Object.values(mockProfiles).find((p: any) => p[col] === val);
              return { data: u ? { ...u } : null, error: null };
            },
          }),
        }),
      } as any;
    }

    if (tableName === 'tenants') {
      return {
        select: () => ({
          eq: (col: string, val: string) => {
            const matches = Object.values(mockTenants).filter((t: any) => t[col] === val);
            return {
              maybeSingle: async () => ({
                data: matches.length > 0 ? { ...matches[0] } : null,
                error: null,
              }),
              then: (resolve: any) => resolve({ data: matches.map((m) => ({ ...m })), error: null }),
            };
          },
        }),
      } as any;
    }

    return {} as any;
  }) as any;

  // TC-05: Kategori upload type tidak valid ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'invalid_type' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('type'),
      'TC-05: Kategori upload type tidak valid ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-06: Custom folder dengan path traversal (..) ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'menu', folder: '../../etc/passwd' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('traversal'),
      'TC-06: Custom folder dengan path traversal (..) ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-07: Custom folder dengan karakter ilegal ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'menu', folder: 'restolink/menu*&^%' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 400 && jsonBody?.error?.includes('berbahaya'),
      'TC-07: Custom folder dengan karakter ilegal ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-08: Kredensial server Cloudinary belum lengkap mengembalikan 500
  {
    const savedSecret = process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_API_SECRET;

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'menu' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    process.env.CLOUDINARY_API_SECRET = savedSecret;

    assert(
      statusCode === 500 && jsonBody?.error?.includes('Kredensial Cloudinary'),
      'TC-08: Kredensial server Cloudinary belum lengkap mengembalikan 500',
      { statusCode, jsonBody }
    );
  }

  // TC-09: tenant_id eksplisit tidak ditemukan mengembalikan 404
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { tenant_id: 'tenant-nonexistent', type: 'menu' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 404 && jsonBody?.error?.includes('tidak ditemukan'),
      'TC-09: tenant_id eksplisit tidak ditemukan mengembalikan 404',
      { statusCode, jsonBody }
    );
  }

  // TC-10: tenant_id milik akun lain ditolak 403 Forbidden
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { tenant_id: 'tenant-2', type: 'menu' }, // tenant-2 milik user-owner-2
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 403 && jsonBody?.error?.includes('bukan milik akun Anda'),
      'TC-10: tenant_id milik orang lain ditolak 403',
      { statusCode, jsonBody }
    );
  }

  // TC-11: Tenant berstatus suspended ditolak 403 Forbidden
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { tenant_id: 'tenant-suspended', type: 'menu' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 403 && jsonBody?.error?.includes('ditangguhkan'),
      'TC-11: Tenant suspended ditolak 403',
      { statusCode, jsonBody }
    );
  }

  // TC-12: Akun tanpa tenant dan bukan admin ditolak 403
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-no-tenant' },
      body: { type: 'menu' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 403 && jsonBody?.error?.includes('belum memiliki usaha'),
      'TC-12: Akun tanpa tenant dan bukan admin ditolak 403',
      { statusCode, jsonBody }
    );
  }

  // TC-13: Generate signature valid untuk type: 'menu' (default folder restolink/tenants/{id}/menus)
  {
    const nowSec = Math.floor(Date.now() / 1000);
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'menu' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const expectedFolder = 'restolink/tenants/tenant-1/menus';
    const expectedHash = createHash('sha1')
      .update(`folder=${expectedFolder}&timestamp=${jsonBody?.timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    assert(
      statusCode === 200 &&
      jsonBody?.folder === expectedFolder &&
      jsonBody?.apiKey === process.env.CLOUDINARY_API_KEY &&
      jsonBody?.cloudName === process.env.CLOUDINARY_CLOUD_NAME &&
      jsonBody?.signature === expectedHash &&
      Math.abs(jsonBody?.timestamp - nowSec) <= 5,
      'TC-13: Generate signature menu valid dengan SHA-1 akurat dan default tenant folder',
      { jsonBody }
    );
  }

  // TC-14: Generate signature valid untuk type: 'logo' (default folder restolink/tenants/{id}/logos)
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'logo' },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const expectedFolder = 'restolink/tenants/tenant-1/logos';
    const expectedHash = createHash('sha1')
      .update(`folder=${expectedFolder}&timestamp=${jsonBody?.timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    assert(
      statusCode === 200 &&
      jsonBody?.folder === expectedFolder &&
      jsonBody?.signature === expectedHash,
      'TC-14: Generate signature logo valid dengan folder logos yang benar',
      { jsonBody }
    );
  }

  // TC-15: Generate signature dengan custom folder yang valid
  {
    const customFolder = 'restolink/tenants/tenant-1/promos';
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: { type: 'menu', folder: customFolder },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const expectedHash = createHash('sha1')
      .update(`folder=${customFolder}&timestamp=${jsonBody?.timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    assert(
      statusCode === 200 &&
      jsonBody?.folder === customFolder &&
      jsonBody?.signature === expectedHash,
      'TC-15: Custom folder valid diintegrasikan ke signature SHA-1',
      { jsonBody }
    );
  }

  // TC-16: Akses platform_admin diizinkan membuat signature untuk tenant mana pun
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-admin' },
      body: { tenant_id: 'tenant-2', type: 'menu' }, // Admin mengakses tenant-2
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(
      statusCode === 200 && jsonBody?.folder?.includes('tenant-2'),
      'TC-16: Platform admin diizinkan generate signature untuk tenant mana pun',
      { statusCode, jsonBody }
    );
  }

  // TC-17: Verifikasi algoritma generator: parameter sorting alfabetis akurat
  {
    const ts = 1730764800;
    const secret = 'test_secret_123';
    const result = generateCloudinarySignature(
      { timestamp: ts, folder: 'restolink/menus' },
      secret
    );

    const manualHash = createHash('sha1')
      .update(`folder=restolink/menus&timestamp=${ts}${secret}`)
      .digest('hex');

    assert(
      result.signature === manualHash && result.timestamp === ts,
      'TC-17: Generator signature mengurutkan parameter alfabetis sesuai spesifikasi Cloudinary',
      { result, manualHash }
    );
  }

  // TC-18: Kontrak respons JSON selaras dengan client uploader (src/lib/cloudinary-upload.ts)
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-owner-1' },
      body: {},
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const hasAllFields =
      typeof jsonBody?.signature === 'string' &&
      typeof jsonBody?.timestamp === 'number' &&
      typeof jsonBody?.apiKey === 'string' &&
      typeof jsonBody?.cloudName === 'string' &&
      typeof jsonBody?.folder === 'string';

    assert(
      statusCode === 200 && hasAllFields,
      'TC-18: Kontrak respons JSON 100% kompatibel dengan requestUploadSignature client',
      { jsonBody }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
