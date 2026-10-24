import type { ApiRequest, ApiResponse } from '../_types';

/**
 * ============================================================================
 * ENDPOINT: POST /api/r2/sign-upload
 * ============================================================================
 * FUNGSI:
 * Menghasilkan Presigned PUT URL dari Cloudflare R2 untuk upload gambar menu atau logo usaha.
 * Gambar dikompresi ke format WebP di browser terlebih dahulu sebelum diunggah.
 *
 * VARIABEL LINGKUNGAN (.env) YANG DIGUNAKAN:
 * - R2_ACCOUNT_ID        : Account ID Cloudflare
 * - R2_ACCESS_KEY_ID     : Access Key Token R2
 * - R2_SECRET_ACCESS_KEY : Secret Access Key Token R2
 * - R2_BUCKET            : Nama bucket R2 (misal: restolink-assets)
 * - R2_PUBLIC_BASE_URL   : Domain publik akses file (misal: https://pub-xxx.r2.dev)
 *
 * PAYLOAD REQUEST DARI FRONTEND:
 * {
 *   "file_name": "foto-menu-ayam.webp",
 *   "content_type": "image/webp",
 *   "tenant_id": "uuid-tenant"
 * }
 *
 * OUTPUT RESPONSE KE FRONTEND:
 * {
 *   "upload_url": "https://<account_id>.r2.cloudflarestorage.com/...",
 *   "public_url": "https://pub-xxx.r2.dev/tenants/<tenant_id>/<unique_id>.webp"
 * }
 * ============================================================================
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  // TODO (Milestone 5):
  // 1. Validasi sesi pemilik usaha via JWT Supabase
  // 2. Buat path key unik: `tenants/${tenant_id}/menu-${Date.now()}.webp`
  // 3. Gunakan @aws-sdk/client-s3 (PutObjectCommand) + getSignedUrl (expiresIn: 300 detik)
  // 4. Kembalikan upload_url (untuk upload direct dari browser) dan public_url (disimpan ke DB)

  return res.status(501).json({
    message: 'Endpoint siap diimplementasikan pada Milestone 5 (Upload R2).'
  });
}
