import type { ApiRequest, ApiResponse } from '../_types';
import { randomBytes } from 'node:crypto';
import { authenticateUser, HttpError } from '../_lib/auth';
import { parseJsonBody, sendJson } from '../_lib/http';
import { getSupabaseAdmin } from '../_lib/supabase';

interface CreateTransactionBody {
  tenant_id: string;
  package_id: string;
  billing_cycle: 'trial' | 'monthly' | '6_months' | 'yearly';
}

const TRIAL_AMOUNT = 49000;

function generateOrderId(subdomain: string): string {
  const cleanSubdomain = (subdomain || 'resto')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomBytes(3).toString('hex').toUpperCase();
  return `RL-${cleanSubdomain}-${timePart}-${randomPart}`.slice(0, 50);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  try {
    // 1. Verifikasi autentikasi user (Owner)
    const { user } = await authenticateUser(req);

    // 2. Baca payload body
    const body = await parseJsonBody<CreateTransactionBody>(req);
    const { tenant_id, package_id, billing_cycle } = body || {};

    if (!tenant_id || !package_id || !billing_cycle) {
      return sendJson(res, 400, {
        error: 'Field tenant_id, package_id, dan billing_cycle wajib diisi.',
      });
    }

    const validCycles = ['trial', 'monthly', '6_months', 'yearly'];
    if (!validCycles.includes(billing_cycle)) {
      return sendJson(res, 400, {
        error: `billing_cycle tidak valid. Pilihan yang tersedia: ${validCycles.join(', ')}.`,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 3. Validasi kepemilikan tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, owner_id, business_name, subdomain, status, contact_phone, contact_whatsapp')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError) {
      return sendJson(res, 500, { error: `Gagal memverifikasi tenant: ${tenantError.message}` });
    }

    if (!tenant) {
      return sendJson(res, 404, { error: 'Tenant tidak ditemukan.' });
    }

    if (tenant.owner_id !== user.id) {
      return sendJson(res, 403, { error: 'Akses ditolak: Usaha kuliner bukan milik akun Anda.' });
    }

    if (tenant.status === 'suspended') {
      return sendJson(res, 403, {
        error: 'Akun usaha kuliner Anda sedang ditangguhkan. Silakan hubungi admin platform.',
      });
    }

    // 4. Ambil informasi paket
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('id, name, tier, price_monthly, price_6_months, price_yearly, is_active')
      .eq('id', package_id)
      .maybeSingle();

    if (pkgError) {
      return sendJson(res, 500, { error: `Gagal memverifikasi paket: ${pkgError.message}` });
    }

    if (!pkg || !pkg.is_active) {
      return sendJson(res, 404, { error: 'Paket langganan tidak ditemukan atau sudah tidak aktif.' });
    }

    // 5. Kalkulasi nominal transaksi
    let amount: number;
    if (billing_cycle === 'trial') {
      amount = TRIAL_AMOUNT;
    } else if (billing_cycle === 'monthly') {
      amount = Number(pkg.price_monthly);
    } else if (billing_cycle === '6_months') {
      amount = Number(pkg.price_6_months);
    } else if (billing_cycle === 'yearly') {
      amount = Number(pkg.price_yearly);
    } else {
      amount = 0;
    }

    if (!amount || amount <= 0 || isNaN(amount)) {
      return sendJson(res, 400, { error: 'Nominal pembayaran paket tidak valid.' });
    }

    // 6. Validasi kredensial Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return sendJson(res, 500, {
        error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi pada server.',
      });
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransSnapUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const orderId = generateOrderId(tenant.subdomain);

    // 7. Request Snap Token ke Midtrans API
    const authString = Buffer.from(`${serverKey}:`).toString('base64');
    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      item_details: [
        {
          id: pkg.id,
          price: Math.round(amount),
          quantity: 1,
          name: `RestoLink ${pkg.name} (${billing_cycle})`.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: (user.user_metadata?.full_name as string) || tenant.business_name || 'Owner RestoLink',
        email: user.email,
        phone: tenant.contact_whatsapp || tenant.contact_phone || undefined,
      },
    };

    const midtransRes = await fetch(midtransSnapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransData = (await midtransRes.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!midtransRes.ok || !midtransData.token) {
      const errorMsg = Array.isArray(midtransData.error_messages)
        ? midtransData.error_messages.join(', ')
        : 'Gagal membuat transaksi di Midtrans.';
      return sendJson(res, 502, {
        error: `Midtrans Snap Error: ${errorMsg}`,
      });
    }

    // 8. Catat transaksi ke tabel transactions di Supabase
    const { error: insertTxError } = await supabaseAdmin.from('transactions').insert({
      tenant_id: tenant.id,
      package_id: pkg.id,
      billing_cycle,
      amount: Math.round(amount),
      midtrans_order_id: orderId,
      status: 'pending',
    });

    if (insertTxError) {
      return sendJson(res, 500, {
        error: `Gagal mencatat transaksi ke database: ${insertTxError.message}`,
      });
    }

    // 9. Berikan respon sukses berisi snap token & redirect url
    return sendJson(res, 201, {
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      order_id: orderId,
      amount: Math.round(amount),
      billing_cycle,
    });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    return sendJson(res, 500, {
      error: `Internal Server Error: ${err?.message || 'Terjadi kesalahan tidak terduga.'}`,
    });
  }
}
