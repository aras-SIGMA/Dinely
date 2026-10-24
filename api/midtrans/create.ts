import type { ApiRequest, ApiResponse } from '../_types';

/**
 * ============================================================================
 * ENDPOINT: POST /api/midtrans/create
 * ============================================================================
 * FUNGSI:
 * Membuat transaksi baru di Midtrans Snap dan database Supabase saat pemilik
 * memilih paket langganan di dashboard atau registrasi.
 *
 * VARIABEL LINGKUNGAN (.env) YANG DIGUNAKAN:
 * - MIDTRANS_SERVER_KEY     : Kunci autentikasi server Midtrans
 * - MIDTRANS_IS_PRODUCTION  : 'false' (sandbox) atau 'true' (production)
 * - SUPABASE_URL            : URL project Supabase
 * - SUPABASE_SERVICE_ROLE_KEY: Akses bypass RLS untuk insert tabel transactions
 *
 * PAYLOAD REQUEST YANG DIHARAPKAN DARI FRONTEND:
 * {
 *   "tenant_id": "uuid-tenant",
 *   "package_id": "uuid-package",
 *   "billing_cycle": "monthly" | "6_months" | "yearly"
 * }
 *
 * OUTPUT RESPONSE KE FRONTEND:
 * {
 *   "token": "snap-token-midtrans",
 *   "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
 * }
 * ============================================================================
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  // TODO (Milestone 4):
  // 1. Validasi token session user dari header Authorization (Bearer <jwt>)
  // 2. Ambil data paket dari tabel packages
  // 3. Buat order_id unik: `RESTO-${Date.now()}-${tenant_id.slice(0, 4)}`
  // 4. Request snap token ke API Midtrans: https://app.sandbox.midtrans.com/snap/v1/transactions
  // 5. Simpan transaksi ke tabel `transactions` dengan status 'pending'
  // 6. Kembalikan snap token ke client

  return res.status(501).json({
    message: 'Endpoint siap diimplementasikan pada Milestone 4 (Pembayaran Midtrans).'
  });
}
