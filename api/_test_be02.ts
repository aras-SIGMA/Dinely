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
  console.log('--- TEST SUITE: BE-02 (api/midtrans/webhook.ts) [HARDENED] ---');
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
      body: { order_id: 'ORDER-123' },
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
      billing_cycle: 'trial',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-001',
    },
  };

  let mockTenants: Record<string, any> = {
    'tenant-uuid-1': {
      id: 'tenant-uuid-1',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
      trial_ends_at: '2026-11-01T00:00:00.000Z',
    },
  };

  let failNextPendingUpdate = false;

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
            if (failNextPendingUpdate) {
              return { error: { message: 'Database write error' } };
            }
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
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: async () => {
              const tenant = mockTenants[val];
              return { data: tenant ? { ...tenant } : null, error: null };
            },
          }),
        }),
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

  // TC-05: Ketat - Valid settlement: delta 30 hari (+/- 60 detik), settled_at, midtrans_transaction_id, trial_ends_at=null
  {
    const orderId = 'RL-TEST-001';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    const beforeCall = Date.now();
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
    const { statusCode } = getData();

    const tenant = mockTenants['tenant-uuid-1'];
    const tx = mockTransactions['RL-TEST-001'];

    const subEndsTime = new Date(tenant.subscription_ends_at).getTime();
    const expectedTime = beforeCall + 30 * 24 * 60 * 60 * 1000;
    const diffSec = Math.abs(subEndsTime - expectedTime) / 1000;

    assert(
      statusCode === 200 &&
      tx.status === 'settlement' &&
      tx.settled_at !== null &&
      tx.midtrans_transaction_id === 'midtrans-tx-001' &&
      tx.raw_notification !== null &&
      tenant.status === 'active' &&
      tenant.trial_ends_at === null &&
      tenant.current_package_id === 'pkg-uuid-1' &&
      diffSec < 60,
      'TC-05: Asersi ketat valid settlement (delta 30 hari, settled_at, midtrans_tx_id, trial=null)',
      { diffSec, tx, tenant }
    );
  }

  // TC-06: Idempotency: Webhook duplikat dengan order_id settlement
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

  // TC-07: Webhook expire -> status expire, tenant tetap pending
  {
    mockTransactions['RL-TEST-002'] = {
      id: 'tx-uuid-2',
      tenant_id: 'tenant-uuid-2',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
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

  // TC-08: Partial failure recovery (tx settlement tapi tenant tertinggal pending/null)
  {
    mockTransactions['RL-TEST-003'] = {
      id: 'tx-uuid-3',
      tenant_id: 'tenant-uuid-3',
      package_id: 'pkg-uuid-1',
      status: 'settlement', // Transaksi sudah settlement
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-003',
    };
    mockTenants['tenant-uuid-3'] = {
      id: 'tenant-uuid-3',
      status: 'pending', // Tenant belum aktif karena partial failure
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-003';
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
    const { statusCode } = getData();

    const tenant = mockTenants['tenant-uuid-3'];

    assert(
      statusCode === 200 &&
      tenant.status === 'active' &&
      tenant.subscription_ends_at !== null,
      'TC-08: Partial failure recovery berhasil mengaktifkan tenant pada retry',
      { statusCode, tenant }
    );
  }

  // TC-09: capture + fraud_status: 'deny' difinalkan ke status 'deny'
  {
    mockTransactions['RL-TEST-004'] = {
      id: 'tx-uuid-4',
      tenant_id: 'tenant-uuid-4',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-004',
    };
    mockTenants['tenant-uuid-4'] = {
      id: 'tenant-uuid-4',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-004';
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
        transaction_status: 'capture',
        fraud_status: 'deny',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode } = getData();

    const tx = mockTransactions['RL-TEST-004'];
    const tenant = mockTenants['tenant-uuid-4'];

    assert(
      statusCode === 200 &&
      tx.status === 'deny' &&
      tenant.status === 'pending',
      'TC-09: capture + fraud_status deny difinalkan ke status deny',
      { statusCode, txStatus: tx?.status, tenantStatus: tenant?.status }
    );
  }

  // TC-10: Akumulasi sisa masa aktif (10 hari sisa + 30 hari = 40 hari)
  {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    mockTransactions['RL-TEST-005'] = {
      id: 'tx-uuid-5',
      tenant_id: 'tenant-uuid-5',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-005',
    };
    mockTenants['tenant-uuid-5'] = {
      id: 'tenant-uuid-5',
      status: 'active',
      current_package_id: 'pkg-uuid-1',
      subscription_ends_at: futureDate,
    };

    const orderId = 'RL-TEST-005';
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
    const { statusCode } = getData();

    const tenant = mockTenants['tenant-uuid-5'];
    const expectedTime = new Date(futureDate).getTime() + 30 * 24 * 60 * 60 * 1000;
    const actualTime = new Date(tenant.subscription_ends_at).getTime();
    const diffSec = Math.abs(actualTime - expectedTime) / 1000;

    assert(
      statusCode === 200 && diffSec < 60,
      'TC-10: Perpanjangan mengakumulasi sisa hari aktif (10 hari sisa + 30 hari = 40 hari)',
      { diffSec, actual: tenant.subscription_ends_at }
    );
  }

  // TC-11: Nominal gross_amount tidak sesuai ditolak 400
  {
    mockTransactions['RL-TEST-006'] = {
      id: 'tx-uuid-6',
      tenant_id: 'tenant-uuid-6',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-006',
    };

    const orderId = 'RL-TEST-006';
    const statusCodeStr = '200';
    const grossAmount = '10000.00'; // Selisih nominal (Rp 10.000 vs Rp 49.000)
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
    assert(
      statusCode === 400 && jsonBody?.error?.includes('Nominal pembayaran tidak sesuai'),
      'TC-11: Selisih nominal gross_amount vs tx.amount ditolak 400',
      { statusCode, jsonBody }
    );
  }

  // TC-12: Error database pada cabang pending mengembalikan 500
  {
    mockTransactions['RL-TEST-007'] = {
      id: 'tx-uuid-7',
      tenant_id: 'tenant-uuid-7',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-007',
    };

    const orderId = 'RL-TEST-007';
    const statusCodeStr = '201';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    failNextPendingUpdate = true;
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        order_id: orderId,
        status_code: statusCodeStr,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'pending',
      },
    } as unknown as ApiRequest;

    const { res, getData } = createMockRes();
    await handler(req, res);
    const { statusCode, jsonBody } = getData();
    failNextPendingUpdate = false;

    assert(
      statusCode === 500 && jsonBody?.error?.includes('Gagal menyimpan notifikasi transaksi'),
      'TC-12: Error DB pada cabang pending ditangani dengan 500',
      { statusCode, jsonBody }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
