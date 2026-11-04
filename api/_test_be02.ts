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
  let failNextTenantUpdate = false;
  let failNextTenantSelect = false;

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
              if (failNextTenantSelect) {
                return { data: null, error: { message: 'Database read error' } };
              }
              const tenant = mockTenants[val];
              return { data: tenant ? { ...tenant } : null, error: null };
            },
          }),
        }),
        update: (fields: any) => ({
          eq: async (col: string, val: string) => {
            if (failNextTenantUpdate) {
              return { error: { message: 'Simulated tenant update failure' } };
            }
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

  // TC-05: Ketat - Valid settlement: delta 30 hari (+/- 60 detik), settled_at, midtrans_tx_id, trial_ends_at=null
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
      status: 'settlement',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-003',
    };
    mockTenants['tenant-uuid-3'] = {
      id: 'tenant-uuid-3',
      status: 'pending',
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
    const grossAmount = '10000.00';
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

  // TC-13 (H1 Regression): Anti-Double Extension saat attempt 1 gagal update tenant
  {
    mockTransactions['RL-TEST-008'] = {
      id: 'tx-uuid-8',
      tenant_id: 'tenant-uuid-8',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-008',
    };
    mockTenants['tenant-uuid-8'] = {
      id: 'tenant-uuid-8',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-008';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    // Attempt 1: Tx sukses jadi settlement, tapi tenant update gagal -> return 500
    failNextTenantUpdate = true;
    const req1 = {
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

    const res1 = createMockRes();
    await handler(req1, res1.res);
    const result1 = res1.getData();
    failNextTenantUpdate = false;

    // Attempt 2: Midtrans retry -> masuk recovery -> tenant diaktifkan + 30 hari -> return 200
    const res2 = createMockRes();
    await handler(req1, res2.res);
    const result2 = res2.getData();

    // Attempt 3: Midtrans retry duplikat lagi -> idempotent -> return 200
    const res3 = createMockRes();
    await handler(req1, res3.res);
    const result3 = res3.getData();

    const tenant8 = mockTenants['tenant-uuid-8'];
    const nowTime = Date.now();
    const endsTime = new Date(tenant8.subscription_ends_at).getTime();
    const totalDaysAdded = (endsTime - nowTime) / (1000 * 60 * 60 * 24);

    assert(
      result1.statusCode === 500 &&
      result2.statusCode === 200 &&
      result3.statusCode === 200 &&
      tenant8.status === 'active' &&
      Math.abs(totalDaysAdded - 30) < 0.1, // Strictly 30 hari, BUKAN 60 hari!
      'TC-13: Anti-Double Extension terbukti (Attempt 1 gagal 500, retry 200, total durasi tepat 30 hari)',
      { result1Code: result1.statusCode, totalDaysAdded }
    );
  }

  // TC-14 (H2 Regression): Error di blok recovery dilempar sebagai HTTP 500 (bukan ditelan 200)
  {
    mockTransactions['RL-TEST-009'] = {
      id: 'tx-uuid-9',
      tenant_id: 'tenant-uuid-9',
      package_id: 'pkg-uuid-1',
      status: 'settlement', // Transaksi sudah settlement
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-009',
    };
    mockTenants['tenant-uuid-9'] = {
      id: 'tenant-uuid-9',
      status: 'pending', // Butuh recovery
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-009';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    failNextTenantUpdate = true; // Simulasikan database error saat recovery update
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
    failNextTenantUpdate = false;

    assert(
      statusCode === 500 && jsonBody?.error?.includes('Gagal memulihkan aktivasi tenant'),
      'TC-14: Kegagalan DB pada recovery guard menghasilkan 500 (memicu retry Midtrans)',
      { statusCode, jsonBody }
    );
  }

  // TC-15 (H3 Regression): Suspended tenant tidak boleh teraktivasi kembali
  {
    mockTransactions['RL-TEST-010'] = {
      id: 'tx-uuid-10',
      tenant_id: 'tenant-uuid-10',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-010',
    };
    mockTenants['tenant-uuid-10'] = {
      id: 'tenant-uuid-10',
      status: 'suspended', // Suspended oleh admin
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-010';
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

    const tenant10 = mockTenants['tenant-uuid-10'];
    const tx10 = mockTransactions['RL-TEST-010'];

    assert(
      statusCode === 200 &&
      tx10.status === 'settlement' &&
      tenant10.status === 'suspended',
      'TC-15: Suspended tenant tetap suspended saat pembayaran settlement masuk',
      { statusCode, tenantStatus: tenant10.status, txStatus: tx10.status }
    );
  }

  // TC-16 (R1 Regression): Perpanjangan tenant aktif saat update tenant gagal di percobaan 1
  {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    mockTransactions['RL-TEST-011'] = {
      id: 'tx-uuid-11',
      tenant_id: 'tenant-uuid-11',
      package_id: 'pkg-uuid-1',
      status: 'pending',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-011',
    };
    mockTenants['tenant-uuid-11'] = {
      id: 'tenant-uuid-11',
      status: 'active', // Tenant sudah aktif (punya sisa 10 hari)
      current_package_id: 'pkg-uuid-1',
      subscription_ends_at: futureDate,
    };

    const orderId = 'RL-TEST-011';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    // Attempt 1: Tx berhasil jadi settlement, tapi tenant update gagal -> return 500
    failNextTenantUpdate = true;
    const req1 = {
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

    const res1 = createMockRes();
    await handler(req1, res1.res);
    const result1 = res1.getData();
    failNextTenantUpdate = false;

    // Tenant belum ter-update di attempt 1 (masih futureDate / +10 hari)
    assert(
      result1.statusCode === 500 &&
      mockTenants['tenant-uuid-11'].subscription_ends_at === futureDate,
      'TC-16a: Attempt 1 gagal update tenant menghasilkan HTTP 500'
    );

    // Attempt 2: Midtrans retry -> masuk recovery blok -> deteksi _extension_applied false / behind target -> terapkan target (+40 hari)
    const res2 = createMockRes();
    await handler(req1, res2.res);
    const result2 = res2.getData();

    const tenant11 = mockTenants['tenant-uuid-11'];
    const expectedTime = new Date(futureDate).getTime() + 30 * 24 * 60 * 60 * 1000;
    const actualTime = new Date(tenant11.subscription_ends_at).getTime();
    const diffSec = Math.abs(actualTime - expectedTime) / 1000;

    assert(
      result2.statusCode === 200 && diffSec < 60,
      'TC-16b: Retry memulihkan perpanjangan secara presisi (+10 hari sisa + 30 hari = 40 hari, bukan 10 hari)',
      { diffSec, actual: tenant11.subscription_ends_at }
    );

    // Attempt 3: Retry duplikat lanjutan -> idempotent -> sisa masa aktif tetap tepat 40 hari (tidak jadi 70 hari)
    const res3 = createMockRes();
    await handler(req1, res3.res);
    const result3 = res3.getData();

    const actualTime3 = new Date(tenant11.subscription_ends_at).getTime();
    const diffSec3 = Math.abs(actualTime3 - expectedTime) / 1000;

    assert(
      result3.statusCode === 200 && diffSec3 < 60,
      'TC-16c: Retry duplikat lanjutan tidak menambah durasi ganda (tetap tepat 40 hari)',
      { diffSec3 }
    );
  }

  // TC-17: Error database saat pembacaan tenant di blok recovery menghasilkan 500
  {
    mockTransactions['RL-TEST-012'] = {
      id: 'tx-uuid-12',
      tenant_id: 'tenant-uuid-12',
      package_id: 'pkg-uuid-1',
      status: 'settlement',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-012',
    };
    mockTenants['tenant-uuid-12'] = {
      id: 'tenant-uuid-12',
      status: 'pending',
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-012';
    const statusCodeStr = '200';
    const grossAmount = '49000.00';
    const signature = computeSignature(orderId, statusCodeStr, grossAmount, serverKey);

    failNextTenantSelect = true; // Simulasikan database select error pada tenant
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
    failNextTenantSelect = false;

    assert(
      statusCode === 500 && jsonBody?.error?.includes('Gagal memverifikasi status tenant saat recovery'),
      'TC-17: Error select tenant di blok recovery menghasilkan HTTP 500',
      { statusCode, jsonBody }
    );
  }

  // TC-18: Suspended tenant pada jalur recovery tetap suspended
  {
    mockTransactions['RL-TEST-013'] = {
      id: 'tx-uuid-13',
      tenant_id: 'tenant-uuid-13',
      package_id: 'pkg-uuid-1',
      status: 'settlement',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-013',
      raw_notification: {
        _extension_applied: false,
      },
    };
    mockTenants['tenant-uuid-13'] = {
      id: 'tenant-uuid-13',
      status: 'suspended', // Sengaja di-suspend admin
      current_package_id: null,
      subscription_ends_at: null,
    };

    const orderId = 'RL-TEST-013';
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

    const tenant13 = mockTenants['tenant-uuid-13'];

    assert(
      statusCode === 200 &&
      tenant13.status === 'suspended' &&
      tenant13.subscription_ends_at === null,
      'TC-18: Suspended tenant pada jalur recovery tetap berstatus suspended',
      { statusCode, tenantStatus: tenant13.status }
    );
  }

  // TC-19 (E1 Regression): Transaksi legacy tanpa metadata tidak menambah durasi tenant aktif
  {
    const initialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockTransactions['RL-TEST-014'] = {
      id: 'tx-uuid-14',
      tenant_id: 'tenant-uuid-14',
      package_id: 'pkg-uuid-1',
      status: 'settlement',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-014',
      raw_notification: {
        order_id: 'RL-TEST-014',
        transaction_status: 'settlement',
        // Tidak ada _target_subscription_ends_at maupun _extension_applied (legacy row)
      },
    };
    mockTenants['tenant-uuid-14'] = {
      id: 'tenant-uuid-14',
      status: 'active',
      current_package_id: 'pkg-uuid-1',
      subscription_ends_at: initialEndsAt,
    };

    const orderId = 'RL-TEST-014';
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

    const tenant14 = mockTenants['tenant-uuid-14'];
    const tx14 = mockTransactions['RL-TEST-014'];

    assert(
      statusCode === 200 &&
      tenant14.subscription_ends_at === initialEndsAt &&
      tx14.raw_notification?._extension_applied === true,
      'TC-19: Transaksi legacy tanpa metadata tidak menggandakan masa aktif tenant aktif (E1 fix)',
      { statusCode, endsAt: tenant14.subscription_ends_at, initialEndsAt }
    );
  }

  // TC-20 (E2 Regression): Retry transaksi tertunda tidak memendekkan masa aktif tenant yang sudah lebih maju
  {
    const targetOldDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
    const moreAdvancedDate = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString();

    mockTransactions['RL-TEST-015'] = {
      id: 'tx-uuid-15',
      tenant_id: 'tenant-uuid-15',
      package_id: 'pkg-uuid-1',
      status: 'settlement',
      billing_cycle: 'monthly',
      amount: 49000,
      midtrans_order_id: 'RL-TEST-015',
      raw_notification: {
        order_id: 'RL-TEST-015',
        _extension_applied: false, // Sempat gagal menandai diterapkan
        _target_subscription_ends_at: targetOldDate, // Target transaksi ini: 40 hari
      },
    };
    mockTenants['tenant-uuid-15'] = {
      id: 'tenant-uuid-15',
      status: 'active',
      current_package_id: 'pkg-uuid-1',
      subscription_ends_at: moreAdvancedDate, // Tenant sudah diperpanjang transaksi lain sampai 70 hari
    };

    const orderId = 'RL-TEST-015';
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

    const tenant15 = mockTenants['tenant-uuid-15'];
    const tx15 = mockTransactions['RL-TEST-015'];

    assert(
      statusCode === 200 &&
      tenant15.subscription_ends_at === moreAdvancedDate &&
      tx15.raw_notification?._extension_applied === true,
      'TC-20: Retry transaksi tertunda tidak memendekkan masa aktif yang sudah lebih maju (E2 fix)',
      { statusCode, tenantEndsAt: tenant15.subscription_ends_at, expected: moreAdvancedDate }
    );
  }

  console.log(`\nHasil: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
