import type { ApiRequest, ApiResponse } from '../_types';

/**
 * ============================================================================
 * ENDPOINT: POST /api/midtrans/webhook
 * ============================================================================
 * FUNGSI:
 * Menerima notifikasi status pembayaran asinkron (webhook HTTP POST) dari server Midtrans.
 * TITIK PALING KRITIS: Aktivasi tenant hanya boleh terjadi setelah webhook ini
 * memverifikasi keaslian signature notifikasi dengan Server Key rahasia!
 *
 * VARIABEL LINGKUNGAN (.env) YANG DIGUNAKAN:
 * - MIDTRANS_SERVER_KEY     : Digunakan untuk hash SHA-512 verifikasi signature
 * - SUPABASE_URL            : URL project Supabase
 * - SUPABASE_SERVICE_ROLE_KEY: Untuk update transaksi & aktifkan status tenant
 *
 * ALUR VERIFIKASI SIGNATURE:
 * SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY) === signature_key
 *
 * TRANSISI STATUS:
 * - Jika status 'settlement' / 'capture' (fraud_status: 'accept'):
 *   1. Update `transactions.status = 'settlement'`
 *   2. Update `tenants.status = 'active'` (atau 'trial')
 *   3. Set `tenants.current_package_id`
 * - Jika status 'expire' / 'cancel' / 'deny':
 *   Update `transactions.status` sesuai event, jangan aktifkan tenant.
 * ============================================================================
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  // TODO (Milestone 4):
  // 1. Baca payload webhook: order_id, status_code, gross_amount, signature_key, transaction_status
  // 2. Hitung hash SHA-512 dengan MIDTRANS_SERVER_KEY
  // 3. Bandingkan hash dengan signature_key. Jika tidak cocok -> Tolak (HTTP 403)
  // 4. Periksa idempotency (apakah transaksi ini sudah settled sebelumnya)
  // 5. Update tabel `transactions` & `tenants` via Supabase Service Role
  // 6. Respon HTTP 200 OK ke server Midtrans agar tidak mengirim notifikasi berulang

  return res.status(501).json({
    message: 'Endpoint siap diimplementasikan pada Milestone 4 (Webhook Midtrans).'
  });
}
