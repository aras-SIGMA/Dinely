import handler from './midtrans/create';
import type { ApiRequest, ApiResponse } from './_types';
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
  console.log('--- TEST SUITE: BE-01 (api/midtrans/create.ts) [HARDENED] ---');
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
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-testkey-12345';

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
      body: { tenant_id: 'c0a80123-0000-0000-0000-000000000001' },
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
        tenant_id: 'c0a80123-0000-0000-0000-000000000001',
        package_id: 'b0a80123-0000-0000-0000-000000000001',
        billing_cycle: 'unlimited',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('billing_cycle tidak valid'), 'TC-06: billing_cycle tidak valid ditolak 400', { statusCode, jsonBody });
  }

  // TC-07: Format UUID tenant_id atau package_id tidak valid ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: 'bukan-uuid',
        package_id: 'b0a80123-0000-0000-0000-000000000001',
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('UUID'), 'TC-07: Format UUID tidak valid ditolak 400', { statusCode, jsonBody });
  }

  // --- MOCK SUPABASE ADMIN ---
  const validTenantId = 'c0a80123-0000-0000-0000-000000000001';
  const otherOwnerTenantId = 'c0a80123-0000-0000-0000-000000000002';
  const suspendedTenantId = 'c0a80123-0000-0000-0000-000000000003';
  const notFoundTenantId = 'c0a80123-0000-0000-0000-000000000004';

  const validPackageId = 'b0a80123-0000-0000-0000-000000000001';
  const inactivePackageId = 'b0a80123-0000-0000-0000-000000000002';
  const zeroPricePackageId = 'b0a80123-0000-0000-0000-000000000003';
  const notFoundPackageId = 'b0a80123-0000-0000-0000-000000000004';

  const mockTenants: Record<string, any> = {
    [validTenantId]: {
      id: validTenantId,
      owner_id: 'owner-uuid-123',
      business_name: 'Warung Enak RestoLink',
      subdomain: 'warungenak',
      status: 'active',
      contact_phone: '081234567890',
      contact_whatsapp: '081234567890',
    },
    [otherOwnerTenantId]: {
      id: otherOwnerTenantId,
      owner_id: 'other-owner-uuid-999',
      business_name: 'Resto Tetangga',
      subdomain: 'tetangga',
      status: 'active',
    },
    [suspendedTenantId]: {
      id: suspendedTenantId,
      owner_id: 'owner-uuid-123',
      business_name: 'Resto Kena Suspend',
      subdomain: 'suspend',
      status: 'suspended',
    },
  };

  const mockPackages: Record<string, any> = {
    [validPackageId]: {
      id: validPackageId,
      name: 'Mikro',
      tier: 'mikro',
      price_monthly: 49000,
      price_6_months: 270000,
      price_yearly: 490000,
      is_active: true,
    },
    [inactivePackageId]: {
      id: inactivePackageId,
      name: 'Paket Lama',
      tier: 'mikro',
      price_monthly: 49000,
      price_6_months: 270000,
      price_yearly: 490000,
      is_active: false,
    },
    [zeroPricePackageId]: {
      id: zeroPricePackageId,
      name: 'Gratis Ilegal',
      tier: 'mikro',
      price_monthly: 0,
      price_6_months: 0,
      price_yearly: 0,
      is_active: true,
    },
  };

  const mockTransactions: Record<string, any> = {};

  let failTenantQuery = false;
  let failPackageQuery = false;
  let failTxInsert = false;

  const adminClient = getSupabaseAdmin();
  adminClient.from = ((tableName: string) => {
    if (tableName === 'tenants') {
      return {
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: async () => {
              if (failTenantQuery) {
                return { data: null, error: { message: 'Database read error for tenants' } };
              }
              const tenant = mockTenants[val];
              return { data: tenant ? { ...tenant } : null, error: null };
            },
          }),
        }),
      } as any;
    }

    if (tableName === 'packages') {
      return {
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: async () => {
              if (failPackageQuery) {
                return { data: null, error: { message: 'Database read error for packages' } };
              }
              const pkg = mockPackages[val];
              return { data: pkg ? { ...pkg } : null, error: null };
            },
          }),
        }),
      } as any;
    }

    if (tableName === 'transactions') {
      return {
        insert: async (row: any) => {
          if (failTxInsert) {
            return { error: { message: 'Database write error on insert transaction' } };
          }
          mockTransactions[row.midtrans_order_id] = { ...row };
          return { error: null };
        },
        update: (fields: any) => ({
          eq: async (col: string, val: string) => {
            if (mockTransactions[val]) {
              Object.assign(mockTransactions[val], fields);
            }
            return { error: null };
          },
        }),
      } as any;
    }

    return {} as any;
  }) as any;

  // TC-08: Tenant tidak ditemukan di DB ditolak 404
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: notFoundTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 404 && jsonBody?.error?.includes('Tenant tidak ditemukan'), 'TC-08: Tenant tidak ditemukan ditolak 404', { statusCode, jsonBody });
  }

  // TC-09: Tenant bukan milik user login ditolak 403
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: otherOwnerTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 403 && jsonBody?.error?.includes('bukan milik'), 'TC-09: Tenant bukan milik user login ditolak 403', { statusCode, jsonBody });
  }

  // TC-10: Tenant berstatus suspended ditolak 403
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: suspendedTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 403 && jsonBody?.error?.includes('ditangguhkan'), 'TC-10: Tenant status suspended ditolak 403', { statusCode, jsonBody });
  }

  // TC-11: Paket langganan tidak ditemukan / tidak aktif ditolak 404
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: inactivePackageId,
        billing_cycle: 'monthly',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 404 && jsonBody?.error?.includes('tidak aktif'), 'TC-11: Paket tidak aktif ditolak 404', { statusCode, jsonBody });
  }

  // TC-12: Paket nominal <= 0 ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: zeroPricePackageId,
        billing_cycle: 'monthly',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('Nominal pembayaran'), 'TC-12: Paket nominal <= 0 ditolak 400', { statusCode, jsonBody });
  }

  // TC-13: MIDTRANS_SERVER_KEY tidak diset ditolak 500
  {
    const originalKey = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 500 && jsonBody?.error?.includes('MIDTRANS_SERVER_KEY'), 'TC-13: MIDTRANS_SERVER_KEY kosong ditolak 500', { statusCode, jsonBody });

    process.env.MIDTRANS_SERVER_KEY = originalKey;
  }

  // TC-14: Database error pada query tenant ditangani 500
  {
    failTenantQuery = true;
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 500 && jsonBody?.error?.includes('Gagal memverifikasi tenant'), 'TC-14: Database error ditangani 500', { statusCode, jsonBody });
    failTenantQuery = false;
  }

  // TC-15: Database insert transaksi gagal ditangani 500
  {
    failTxInsert = true;
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 500 && jsonBody?.error?.includes('Gagal mencatat transaksi'), 'TC-15: Database insert error ditangani 500', { statusCode, jsonBody });
    failTxInsert = false;
  }

  // Mock global fetch for Midtrans interactions
  const originalFetch = globalThis.fetch;

  // TC-16: Midtrans API error upstream ditangani 502 & status transaksi di DB di-update ke 'failure'
  {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error_messages: ['Transaction rejected by upstream'] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    const recordedTx = Object.values(mockTransactions).pop();

    assert(
      statusCode === 502 &&
      jsonBody?.error?.includes('Transaction rejected') &&
      recordedTx?.status === 'failure',
      'TC-16: Midtrans API upstream error ditangani 502 & transaksi di-rollback ke failure',
      { statusCode, jsonBody, txStatus: recordedTx?.status }
    );
  }

  // TC-17: Midtrans API timeout ditangani 504 & status transaksi di DB di-update ke 'failure'
  {
    globalThis.fetch = async () => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    };

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    const recordedTx = Object.values(mockTransactions).pop();

    assert(
      statusCode === 504 &&
      jsonBody?.error?.includes('Gateway Timeout') &&
      recordedTx?.status === 'failure',
      'TC-17: Midtrans API timeout ditangani 504 & transaksi di-rollback ke failure',
      { statusCode, jsonBody, txStatus: recordedTx?.status }
    );
  }

  // TC-18: Happy path 201 Created — Snap Token terbuat, record pending tersimpan di DB
  {
    globalThis.fetch = async (_url: any, opts: any) => {
      const parsedBody = JSON.parse(opts.body);
      return new Response(
        JSON.stringify({
          token: 'mock-snap-token-abc123',
          redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${parsedBody.transaction_details.order_id}`,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-owner-jwt' },
      body: {
        tenant_id: validTenantId,
        package_id: validPackageId,
        billing_cycle: 'trial',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    const recordedTx = Object.values(mockTransactions).find(
      (t) => t.midtrans_order_id === jsonBody?.order_id
    );

    assert(
      statusCode === 201 &&
      jsonBody?.token === 'mock-snap-token-abc123' &&
      jsonBody?.amount === 49000 &&
      jsonBody?.billing_cycle === 'trial' &&
      recordedTx?.status === 'pending' &&
      recordedTx?.amount === 49000,
      'TC-18: Happy path 201 Created: Snap Token terbit dan transaksi pending tersimpan di DB',
      { statusCode, jsonBody, recordedTx }
    );
  }

  // Restore global fetch
  globalThis.fetch = originalFetch;

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
