import handler from './midtrans/webhook';
import type { ApiRequest, ApiResponse } from './_types';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from './_lib/supabase';

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

function computeSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest('hex');
}

async function runTests() {
  console.log('--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) ---');
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

  const serverKey = 'SB-Mid-server-testkey-12345';
  process.env.MIDTRANS_SERVER_KEY = serverKey;
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';

  // TC-01: Method GET ditolak 405
  {
    const req = { method: 'GET', headers: {} } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 405 && jsonBody?.error?.includes('POST'), 'TC-01: Method GET ditolak 405', { statusCode, jsonBody });
  }

  // TC-02: Payload tidak lengkap ditolak 400
  {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { order_id: 'ORDER-123' }, // missing signature_key, status_code, etc.
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 400 && jsonBody?.error?.includes('tidak lengkap'), 'TC-02: Payload tidak lengkap ditolak 400', { statusCode, jsonBody });
  }

  // TC-03: Signature key palsu ditolak 403
  {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: 'ORDER-123',
        status_code: '200',
        gross_amount: '49000.00',
        signature_key: 'palsu_signature_hash_123',
        transaction_status: 'settlement',
      },
    } as unknown as ApiRequest;
    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 403 && jsonBody?.error?.includes('signature'), 'TC-03: Signature palsu ditolak 403', { statusCode, jsonBody });
  }

  // Mock in-memory state for Supabase
  let mockTransactions: Record<string, any> = {
    'RL-TEST-001': {
      id: 'tx-uuid-1',
      tenant_id: 'tenant-uuid-1',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      midtrans_order_id: 'RL-TEST-001',
    },
  };

  let mockTenants: Record<string, any> = {
    'tenant-uuid-1': {
      id: 'tenant-uuid-1',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
    },
  };

  const adminClient = getSupabaseAdmin();
  adminClient.from = ((tableName: string) => {
    if (tableName === 'transactions') {
      return {
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: async () => {
              const tx = Object.values(mockTransactions).find((t: any) => t[col] === val);
              return { data: tx ? { ...tx } : null, error: null };
            },
          }),
        }),
        update: (fields: any) => ({
          eq: async (col: string, val: string) => {
            const tx = Object.values(mockTransactions).find((t: any) => t[col] === val);
            if (tx) {
              Object.assign(tx, fields);
            }
            return { error: null };
          },
        }),
      } as any;
    }

    if (tableName === 'tenants') {
      return {
        update: (fields: any) => ({
          eq: async (col: string, val: string) => {
            const tenant = mockTenants[val];
            if (tenant) {
              Object.assign(tenant, fields);
            }
            return { error: null };
          },
        }),
      } as any;
    }

    return {} as any;
  }) as any;

  // TC-04: Transaksi tidak ditemukan di DB ditolak 404
  {
    const orderId = 'RL-NONEXISTENT';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: orderId,
        status_code: statusCodeStr,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'settlement',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    assert(statusCode === 404 && jsonBody?.error?.includes('tidak ditemukan'), 'TC-04: Transaksi tidak ditemukan mengembalikan 404', { statusCode, jsonBody });
  }

  // TC-05: Signature sah & settlement -> transaksi updated, tenant status active
  {
    const orderId = 'RL-TEST-001';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: orderId,
        status_code: statusCodeStr,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'settlement',
        transaction_id: 'midtrans-tx-001',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const tenant = mockTenants['tenant-uuid-1'];
    const tx = mockTransactions['RL-TEST-001'];

    assert(
      statusCode === 200 &&
      tx.status === 'settlement' &&
      tenant.status === 'active' &&
      tenant.current_package_id === 'pkg-uuid-1' &&
      tenant.subscription_ends_at !== null,
      'TC-05: Valid settlement webhook mengaktifkan tenant dan status transaksi settlement',
      { statusCode, txStatus: tx?.status, tenantStatus: tenant?.status }
    );
  }

  // TC-06: Idempotency: Webhook duplikat dengan order_id yang sudah settlement mengembalikan 200 tanpa error
  {
    const orderId = 'RL-TEST-001';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    const prevSubscriptionEndsAt = mockTenants['tenant-uuid-1'].subscription_ends_at;

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: orderId,
        status_code: statusCodeStr,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'settlement',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();

    const currSubscriptionEndsAt = mockTenants['tenant-uuid-1'].subscription_ends_at;

    assert(
      statusCode === 200 &&
      jsonBody?.message?.includes('idempotent') &&
      prevSubscriptionEndsAt === currSubscriptionEndsAt,
      'TC-06: Webhook settlement duplikat ditangani secara idempotent (200 OK)',
      { statusCode, jsonBody }
    );
  }

  // TC-07: Webhook cancel/expire/deny -> update status transaksi, tenant TIDAK diaktifkan
  {
    mockTransactions['RL-TEST-002'] = {
      id: 'tx-uuid-2',
      tenant_id: 'tenant-uuid-2',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      midtrans_order_id: 'RL-TEST-002',
    };
    mockTenants['tenant-uuid-2'] = {
      id: 'tenant-uuid-2',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-002';
    const statusCodeStr = '202';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: orderId,
        status_code: statusCodeStr,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'expire',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode } = getData();

    const tx = mockTransactions['RL-TEST-002'];
    const tenant = mockTenants['tenant-uuid-2'];

    assert(
      statusCode === 200 &&
      tx.status === 'expire' &&
      tenant.status === 'pending',
      'TC-07: Webhook expire mengubah transaksi jadi expire dan tenant tetap pending',
      { statusCode, txStatus: tx?.status, tenantStatus: tenant?.status }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
