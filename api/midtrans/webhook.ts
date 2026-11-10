import type { ApiRequest, ApiResponse } from '../_types';
import { createHash, timingSafeEqual } from 'node:crypto';
import { HttpError } from '../_lib/auth';
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
  if (
    typeof orderId !== 'string' ||
    typeof statusCode !== 'string' ||
    typeof grossAmount !== 'string' ||
    typeof serverKey !== 'string' ||
    typeof signatureKey !== 'string' ||
    !orderId ||
    !statusCode ||
    !grossAmount ||
    !serverKey ||
    !signatureKey
  ) {
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

  const contentType = req.headers?.['content-type'] || req.headers?.['Content-Type'];
  if (contentType && !contentType.includes('application/json')) {
    return sendJson(res, 415, { error: 'Content-Type harus application/json.' });
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
      .select('id, tenant_id, package_id, status, billing_cycle, amount, raw_notification')
      .eq('midtrans_order_id', order_id)
      .maybeSingle();

    if (txError) {
      console.error('[BE-02] Database error searching transaction:', txError);
      return sendJson(res, 500, {
        error: 'Database error saat mencari transaksi: Terjadi kesalahan internal database.',
      });
    }

    if (!tx) {
      return sendJson(res, 404, {
        error: `Transaksi dengan order_id '${order_id}' tidak ditemukan.`,
      });
    }

    // Validasi kesesuaian gross_amount terhadap database tagihan
    const payloadAmount = Math.round(Number(gross_amount));
    if (isNaN(payloadAmount) || payloadAmount <= 0) {
      return sendJson(res, 400, {
        error: 'Format gross_amount tidak valid atau bernilai <= 0.',
      });
    }

    if (tx.amount != null) {
      const txAmount = Math.round(Number(tx.amount));
      if (payloadAmount !== txAmount) {
        return sendJson(res, 400, {
          error: `Nominal pembayaran tidak sesuai. Payload: ${payloadAmount}, Tagihan: ${txAmount}.`,
        });
      }
    }

    // 3. Idempotency Check & Partial Failure Recovery (H1, H2, H3, R1, E1, E2)
    if (tx.status === 'settlement' || tx.status === 'capture') {
      const { data: currentTenant, error: tenantCheckErr } = await supabaseAdmin
        .from('tenants')
        .select('id, status, subscription_ends_at')
        .eq('id', tx.tenant_id)
        .maybeSingle();

      if (tenantCheckErr) {
        console.error('[BE-02] Database error verifying tenant on recovery:', tenantCheckErr);
        return sendJson(res, 500, {
          error: 'Gagal memverifikasi status tenant saat recovery: Terjadi kesalahan internal database.',
        });
      }

      if (!currentTenant) {
        return sendJson(res, 404, {
          error: 'Tenant yang terkait dengan transaksi ini tidak ditemukan.',
        });
      }

      // H3: Jangan aktifkan kembali tenant yang sengaja di-suspend oleh admin
      if (currentTenant.status === 'suspended') {
        return sendJson(res, 200, {
          status: 'ok',
          message: 'Transaksi sudah settlement, namun tenant berstatus suspended oleh admin.',
          order_id,
        });
      }

      const rawNotif = (tx.raw_notification && typeof tx.raw_notification === 'object')
        ? (tx.raw_notification as Record<string, any>)
        : {};
      const isExtensionApplied = rawNotif._extension_applied === true;
      const targetEndsAt = typeof rawNotif._target_subscription_ends_at === 'string'
        ? rawNotif._target_subscription_ends_at
        : null;

      const isTenantInactive = currentTenant.status !== 'active' || !currentTenant.subscription_ends_at;

      // E2: Hanya boleh memperpanjang jika masa aktif saat ini tertinggal dari target (anti-pemendekan)
      const isEndsAtBehindTarget = Boolean(
        targetEndsAt &&
        (!currentTenant.subscription_ends_at ||
          new Date(currentTenant.subscription_ends_at).getTime() < new Date(targetEndsAt).getTime())
      );

      // E1 & E2:
      // - Jika ada targetEndsAt: perbarui tenant HANYA jika inaktif atau tertinggal dari target.
      // - Jika transaksi legacy tanpa metadata (targetEndsAt null): HANYA pulihkan jika tenant inaktif (anti-ekstensi ganda).
      const needsTenantUpdate = targetEndsAt
        ? (isTenantInactive || isEndsAtBehindTarget)
        : isTenantInactive;

      if (needsTenantUpdate) {
        const recoveredEndsAt =
          targetEndsAt ||
          calculateSubscriptionExtension(
            currentTenant.subscription_ends_at,
            tx.billing_cycle
          );

        const { error: recoveryErr } = await supabaseAdmin
          .from('tenants')
          .update({
            status: 'active',
            current_package_id: tx.package_id,
            subscription_ends_at: recoveredEndsAt,
            trial_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tx.tenant_id);

        if (recoveryErr) {
          console.error('[BE-02] Database error restoring tenant on recovery:', recoveryErr);
          return sendJson(res, 500, {
            error: 'Gagal memulihkan aktivasi tenant pada retry: Terjadi kesalahan internal database.',
          });
        }

        // Tandai bahwa ekstensi untuk transaksi ini sudah diterapkan
        const { error: markErr } = await supabaseAdmin
          .from('transactions')
          .update({
            raw_notification: {
              ...rawNotif,
              _extension_applied: true,
              _target_subscription_ends_at: recoveredEndsAt,
            },
          })
          .eq('id', tx.id);

        if (markErr) {
          console.error('[BE-02] Database error marking transaction on recovery:', markErr);
          return sendJson(res, 500, {
            error: 'Gagal menandai finalisasi transaksi pada recovery: Terjadi kesalahan internal database.',
          });
        }
      } else if (!isExtensionApplied) {
        // E1 & E2: Tenant sudah aktif dan sudah mencapai/melampaui target masa aktif.
        // Cukup tandai _extension_applied: true tanpa mengubah masa aktif tenant.
        const { error: markErr } = await supabaseAdmin
          .from('transactions')
          .update({
            raw_notification: {
              ...rawNotif,
              _extension_applied: true,
              ...(targetEndsAt ? { _target_subscription_ends_at: targetEndsAt } : {}),
            },
          })
          .eq('id', tx.id);

        if (markErr) {
          console.error('[BE-02] Database error marking finalized transaction:', markErr);
          return sendJson(res, 500, {
            error: 'Gagal menandai finalisasi transaksi: Terjadi kesalahan internal database.',
          });
        }
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

      // Ambil tenant untuk kalkulasi target masa aktif (akumulatif)
      const { data: targetTenant, error: getTenantErr } = await supabaseAdmin
        .from('tenants')
        .select('id, status, subscription_ends_at')
        .eq('id', tx.tenant_id)
        .maybeSingle();

      if (getTenantErr || !targetTenant) {
        console.error('[BE-02] Database error fetching target tenant:', getTenantErr);
        return sendJson(res, 500, {
          error: 'Gagal membaca data tenant: Terjadi kesalahan internal database.',
        });
      }

      const targetSubscriptionEndsAt = calculateSubscriptionExtension(
        targetTenant.subscription_ends_at,
        tx.billing_cycle
      );

      // LANGKAH 1 (H1 & R1): Kunci status transaksi sebagai 'settlement' dan catat target ends at.
      // _extension_applied disetel false sampai update tenant tuntas berhasil.
      const { error: updateTxError } = await supabaseAdmin
        .from('transactions')
        .update({
          status: 'settlement',
          settled_at: now.toISOString(),
          midtrans_transaction_id: transaction_id || null,
          raw_notification: {
            ...body,
            _extension_applied: false,
            _target_subscription_ends_at: targetSubscriptionEndsAt,
          },
        })
        .eq('id', tx.id);

      if (updateTxError) {
        console.error('[BE-02] Database error locking transaction to settlement:', updateTxError);
        return sendJson(res, 500, {
          error: 'Gagal memperbarui status transaksi: Terjadi kesalahan internal database.',
        });
      }

      // H3: Jika tenant berstatus suspended, jangan ubah status menjadi active
      if (targetTenant.status === 'suspended') {
        return sendJson(res, 200, {
          status: 'ok',
          message: 'Pembayaran settlement dicatat, namun status tenant tetap suspended.',
          order_id,
        });
      }

      // LANGKAH 2: Terapkan aktivasi / perpanjangan pada tenant
      const { error: updateTenantError } = await supabaseAdmin
        .from('tenants')
        .update({
          status: 'active',
          current_package_id: tx.package_id,
          subscription_ends_at: targetSubscriptionEndsAt,
          trial_ends_at: null,
          updated_at: now.toISOString(),
        })
        .eq('id', tx.tenant_id);

      // Jika update tenant gagal di sini, respon 500 memicu retry Midtrans,
      // dan retry otomatis masuk ke blok idempotency recovery (R1) dengan target yang sudah tercatat!
      if (updateTenantError) {
        console.error('[BE-02] Database error activating tenant:', updateTenantError);
        return sendJson(res, 500, {
          error: 'Gagal mengaktifkan tenant: Terjadi kesalahan internal database.',
        });
      }

      // LANGKAH 3 (R1 & E2): Tandai _extension_applied: true
      const { error: markSuccessError } = await supabaseAdmin
        .from('transactions')
        .update({
          raw_notification: {
            ...body,
            _extension_applied: true,
            _target_subscription_ends_at: targetSubscriptionEndsAt,
          },
        })
        .eq('id', tx.id);

      if (markSuccessError) {
        console.error('[BE-02] Database error marking transaction success:', markSuccessError);
        return sendJson(res, 500, {
          error: 'Gagal menandai status transaksi: Terjadi kesalahan internal database.',
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
        console.error('[BE-02] Database error updating failure status:', updateTxError);
        return sendJson(res, 500, {
          error: 'Gagal mencatat status pembatalan/kegagalan transaksi: Terjadi kesalahan internal database.',
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
        console.error('[BE-02] Database error storing raw notification:', updateRawError);
        return sendJson(res, 500, {
          error: 'Gagal menyimpan notifikasi transaksi: Terjadi kesalahan internal database.',
        });
      }

      return sendJson(res, 200, {
        status: 'ok',
        message: `Notifikasi dengan status '${transaction_status}' diterima.`,
        order_id,
      });
    }
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    return sendJson(res, 500, {
      error: 'Internal Server Error: Terjadi kesalahan tidak terduga pada server webhook.',
    });
  }
}
