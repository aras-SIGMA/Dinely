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
      .select('id, tenant_id, package_id, status')
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

    // 3. Idempotency Check: jika transaksi sudah berstatus final settlement/capture, abaikan
    if (tx.status === 'settlement' || tx.status === 'capture') {
      return sendJson(res, 200, {
        status: 'ok',
        message: 'Transaksi sudah diselesaikan sebelumnya (idempotent).',
        order_id,
      });
    }

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const isFailure = ['deny', 'cancel', 'expire', 'failure'].includes(transaction_status);

    // 4. Update transaksi & tenant sesuai status
    if (isSuccess) {
      const now = new Date();
      const subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Update transaksi menjadi settlement
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

      // Update status tenant menjadi 'active' + perpanjang subscription
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

      return sendJson(res, 200, {
        status: 'ok',
        message: 'Pembayaran berhasil diverifikasi. Tenant berhasil diaktifkan.',
        order_id,
      });
    } else if (isFailure) {
      const mappedStatus = transaction_status as 'deny' | 'cancel' | 'expire' | 'failure';

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
        message: `Status transaksi diperbarui menjadi ${transaction_status}. Tenant tidak diaktifkan.`,
        order_id,
      });
    } else {
      // Status pending atau event notifikasi lainnya
      await supabaseAdmin
        .from('transactions')
        .update({
          raw_notification: body,
        })
        .eq('id', tx.id);

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
