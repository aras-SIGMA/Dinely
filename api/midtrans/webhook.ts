import type { ApiRequest, ApiResponse } from '../_types';
import { createHash, timingSafeEqual } from 'node:crypto';
import { parseJsonBody, sendJson } from '../_lib/http';
import { getSupabaseAdmin } from '../_lib/supabase';

interface MidtransWebhookPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  [key: string]: any;
}

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  if (!orderId || !statusCode || !grossAmount || !serverKey || !signatureKey) {
    return false;
  }
  const payloadString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculated = createHash('sha512').update(payloadString).digest('hex');

  if (calculated.length !== signatureKey.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(calculated, 'utf8'),
    Buffer.from(signatureKey, 'utf8')
  );
}

export function calculateSubscriptionExtension(
  existingEndsAt: string | null | undefined,
  billingCycle: string
): string {
  const now = new Date();
  let baseDate = now;

  if (existingEndsAt) {
    const parsed = new Date(existingEndsAt);
    if (!isNaN(parsed.getTime()) && parsed.getTime() > now.getTime()) {
      baseDate = parsed;
    }
  }

  let daysToAdd = 30;
  if (billingCycle === '6_months') {
    daysToAdd = 180;
  } else if (billingCycle === 'yearly') {
    daysToAdd = 365;
  } else {
    daysToAdd = 30; // 'trial' or 'monthly' or default
  }

  const newEndsAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return newEndsAt.toISOString();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return sendJson(res, 500, {
      error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi pada server.',
    });
  }

  try {
    const body = await parseJsonBody<MidtransWebhookPayload>(req);
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
    } = body || {};

    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      return sendJson(res, 400, {
        error: 'Payload webhook tidak lengkap. Field wajib: order_id, status_code, gross_amount, signature_key, transaction_status.',
      });
    }

    // 1. Verifikasi Keaslian Signature (SHA-512)
    const isSignatureValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      serverKey,
      signature_key
    );

    if (!isSignatureValid) {
      return sendJson(res, 403, {
        error: 'Verifikasi signature webhook Midtrans gagal.',
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Cari transaksi terkait berdasarkan midtrans_order_id
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, tenant_id, package_id, status, billing_cycle, amount')
      .eq('midtrans_order_id', order_id)
      .maybeSingle();

    if (txError) {
      return sendJson(res, 500, {
        error: `Database error saat mencari transaksi: ${txError.message}`,
      });
    }

    if (!tx) {
      return sendJson(res, 404, {
        error: `Transaksi dengan order_id '${order_id}' tidak ditemukan.`,
      });
    }

    // Validasi kesesuaian gross_amount terhadap database tagihan
    if (tx.amount != null) {
      const payloadAmount = Math.round(Number(gross_amount));
      const txAmount = Math.round(Number(tx.amount));
      if (!isNaN(payloadAmount) && !isNaN(txAmount) && payloadAmount !== txAmount) {
        return sendJson(res, 400, {
          error: `Nominal pembayaran tidak sesuai. Payload: ${payloadAmount}, Tagihan: ${txAmount}.`,
        });
      }
    }

    // 3. Idempotency Check & Partial Failure Recovery
    if (tx.status === 'settlement' || tx.status === 'capture') {
      const { data: currentTenant, error: tenantCheckErr } = await supabaseAdmin
        .from('tenants')
        .select('id, status, subscription_ends_at')
        .eq('id', tx.tenant_id)
        .maybeSingle();

      // Jika sebelumnya tenant gagal diaktifkan (partial failure), pulihkan di sini
      if (
        !tenantCheckErr &&
        currentTenant &&
        (currentTenant.status !== 'active' || !currentTenant.subscription_ends_at)
      ) {
        const recoveredEndsAt = calculateSubscriptionExtension(
          currentTenant.subscription_ends_at,
          tx.billing_cycle
        );

        await supabaseAdmin
          .from('tenants')
          .update({
            status: 'active',
            current_package_id: tx.package_id,
            subscription_ends_at: recoveredEndsAt,
            trial_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tx.tenant_id);
      }

      return sendJson(res, 200, {
        status: 'ok',
        message: 'Transaksi sudah diselesaikan sebelumnya (idempotent).',
        order_id,
      });
    }

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const isDenied =
      transaction_status === 'deny' ||
      (transaction_status === 'capture' && fraud_status === 'deny');

    const isFailure =
      isDenied || ['cancel', 'expire', 'failure'].includes(transaction_status);

    // 4. Update transaksi & tenant sesuai status
    if (isSuccess) {
      const now = new Date();

      // Ambil tenant untuk kalkulasi sisa durasi langganan (akumulatif)
      const { data: targetTenant, error: getTenantErr } = await supabaseAdmin
        .from('tenants')
        .select('id, status, subscription_ends_at')
        .eq('id', tx.tenant_id)
        .maybeSingle();

      if (getTenantErr || !targetTenant) {
        return sendJson(res, 500, {
          error: `Gagal membaca data tenant: ${getTenantErr?.message || 'Tenant tidak ditemukan'}`,
        });
      }

      const subscriptionEndsAt = calculateSubscriptionExtension(
        targetTenant.subscription_ends_at,
        tx.billing_cycle
      );

      // LANGKAH 1: Update status tenant terlebih dahulu (mencegah kondisi paid but inactive)
      const { error: updateTenantError } = await supabaseAdmin
        .from('tenants')
        .update({
          status: 'active',
          current_package_id: tx.package_id,
          subscription_ends_at: subscriptionEndsAt,
          trial_ends_at: null,
          updated_at: now.toISOString(),
        })
        .eq('id', tx.tenant_id);

      if (updateTenantError) {
        return sendJson(res, 500, {
          error: `Gagal mengaktifkan tenant: ${updateTenantError.message}`,
        });
      }

      // LANGKAH 2: Tandai status transaksi sebagai settlement
      const { error: updateTxError } = await supabaseAdmin
        .from('transactions')
        .update({
          status: 'settlement',
          settled_at: now.toISOString(),
          midtrans_transaction_id: transaction_id || null,
          raw_notification: body,
        })
        .eq('id', tx.id);

      if (updateTxError) {
        return sendJson(res, 500, {
          error: `Gagal memperbarui status transaksi: ${updateTxError.message}`,
        });
      }

      return sendJson(res, 200, {
        status: 'ok',
        message: 'Pembayaran berhasil diverifikasi. Tenant berhasil diaktifkan.',
        order_id,
      });
    } else if (isFailure) {
      const mappedStatus = isDenied
        ? 'deny'
        : (['cancel', 'expire', 'failure'].includes(transaction_status)
            ? transaction_status
            : 'failure') as 'deny' | 'cancel' | 'expire' | 'failure';

      const { error: updateTxError } = await supabaseAdmin
        .from('transactions')
        .update({
          status: mappedStatus,
          raw_notification: body,
        })
        .eq('id', tx.id);

      if (updateTxError) {
        return sendJson(res, 500, {
          error: `Gagal mencatat status pembatalan/kegagalan transaksi: ${updateTxError.message}`,
        });
      }

      return sendJson(res, 200, {
        status: 'ok',
        message: `Status transaksi diperbarui menjadi ${mappedStatus}. Tenant tidak diaktifkan.`,
        order_id,
      });
    } else {
      // Status pending atau event notifikasi lainnya
      const { error: updateRawError } = await supabaseAdmin
        .from('transactions')
        .update({
          raw_notification: body,
        })
        .eq('id', tx.id);

      if (updateRawError) {
        return sendJson(res, 500, {
          error: `Gagal menyimpan notifikasi transaksi: ${updateRawError.message}`,
        });
      }

      return sendJson(res, 200, {
        status: 'ok',
        message: `Notifikasi dengan status '${transaction_status}' diterima.`,
        order_id,
      });
    }
  } catch (err: any) {
    return sendJson(res, 500, {
      error: `Internal Server Error: ${err?.message || 'Terjadi kesalahan tidak terduga.'}`,
    });
  }
}
