import type { ApiRequest, ApiResponse } from '../_types';
import { createHash } from 'node:crypto';

/**
 * ============================================================================
 * ENDPOINT: POST /api/cloudinary/sign-upload
 * ============================================================================
 * FUNGSI:
 * Menghasilkan Signature terotentikasi untuk direct upload gambar menu atau logo
 * dari browser ke Cloudinary tanpa mengekspos API Secret ke client.
 *
 * VARIABEL LINGKUNGAN (.env) YANG DIGUNAKAN:
 * - CLOUDINARY_CLOUD_NAME  : Nama cloud Cloudinary akun Anda
 * - CLOUDINARY_API_KEY     : API Key publik Cloudinary
 * - CLOUDINARY_API_SECRET  : API Secret rahasia Cloudinary (HANYA di backend)
 *
 * ALUR DIRECT UPLOAD CLIENT-SIDE:
 * 1. Client meminta signature ke endpoint ini: POST /api/cloudinary/sign-upload
 * 2. Endpoint merespons: { signature, timestamp, apiKey, cloudName, folder }
 * 3. Client mengunggah file langsung ke Cloudinary API via multipart/form-data:
 *    POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload
 * 4. Cloudinary mengembalikan URL gambar (secure_url).
 * ============================================================================
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: 'Kredensial Cloudinary belum dikonfigurasi di server (.env).'
    });
  }

  // TODO (Milestone 5):
  // 1. Validasi sesi owner via Supabase Auth Bearer Token
  // 2. Tentukan folder target berdasarkan jenis upload (misal: 'restolink/menu' atau 'restolink/logos')
  // 3. Generate timestamp saat ini (detik): Math.round(Date.now() / 1000)
  // 4. Buat signature string: `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  // 5. Hash dengan SHA-1: createHash('sha1').update(signatureString).digest('hex')
  // 6. Kembalikan response json

  return res.status(501).json({
    message: 'Endpoint siap diimplementasikan pada Milestone 5 (Upload Cloudinary).'
  });
}
