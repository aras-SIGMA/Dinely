import type { ApiRequest, ApiResponse } from '../_types';
import { createHash } from 'node:crypto';
import { parseJsonBody, sendJson } from '../_lib/http';
import { authenticateUser, HttpError } from '../_lib/auth';
import { getSupabaseAdmin } from '../_lib/supabase';

export interface SignUploadPayload {
  type?: 'menu' | 'logo';
  folder?: string;
  tenant_id?: string;
}

export function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): { signature: string; timestamp: number } {
  const filteredKeys = Object.keys(params)
    .filter((k) => !['file', 'cloud_name', 'resource_type', 'api_key', 'signature'].includes(k))
    .filter((k) => params[k] !== undefined && params[k] !== null && String(params[k]).length > 0)
    .sort();

  const paramString = filteredKeys.map((k) => `${k}=${params[k]}`).join('&');
  const toSign = `${paramString}${apiSecret}`;
  const signature = createHash('sha1').update(toSign).digest('hex');

  const ts =
    typeof params.timestamp === 'number'
      ? params.timestamp
      : parseInt(String(params.timestamp), 10) || Math.floor(Date.now() / 1000);

  return { signature, timestamp: ts };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan POST.' });
  }

  const contentType = req.headers?.['content-type'] || req.headers?.['Content-Type'];
  if (contentType && !contentType.includes('application/json')) {
    return sendJson(res, 415, { error: 'Content-Type harus application/json.' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return sendJson(res, 500, {
      error: 'Kredensial Cloudinary belum dikonfigurasi pada server (.env).',
    });
  }

  // 1. Validasi Autentikasi Pemilik Sesi
  let authSession;
  try {
    authSession = await authenticateUser(req);
  } catch (err: any) {
    const statusCode = err?.statusCode || 401;
    return sendJson(res, statusCode, {
      error: err?.message || 'Autentikasi gagal.',
    });
  }

  const { user } = authSession;

  try {
    const body = await parseJsonBody<SignUploadPayload>(req);
    const { type, folder, tenant_id } = body || {};

    if (folder !== undefined && typeof folder !== 'string') {
      return sendJson(res, 400, {
        error: 'Format parameter folder tidak valid (harus string).',
      });
    }

    if (tenant_id !== undefined && typeof tenant_id !== 'string') {
      return sendJson(res, 400, {
        error: 'Format parameter tenant_id tidak valid (harus string).',
      });
    }

    // 2. Validasi Kategori Upload (type)
    const uploadType = type || 'menu';
    if (!['menu', 'logo'].includes(uploadType)) {
      return sendJson(res, 400, {
        error: "Kategori upload 'type' tidak valid. Pilihan yang tersedia: 'menu' atau 'logo'.",
      });
    }

    // 3. Sanitasi Custom Folder (Cegah Path Traversal)
    if (folder && typeof folder === 'string') {
      const trimmed = folder.trim();
      if (trimmed.includes('..') || !/^[a-zA-Z0-9_\-\/]+$/.test(trimmed)) {
        return sendJson(res, 400, {
          error: 'Format folder tidak valid atau mengandung karakter berbahaya / path traversal.',
        });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Cek Role Pengguna (owner vs platform_admin)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[BE-03] Database profile verification error:', profileError);
      return sendJson(res, 500, {
        error: 'Gagal memverifikasi profil user: Terjadi kesalahan internal database.',
      });
    }

    const isPlatformAdmin = userProfile?.role === 'platform_admin';

    // 4. Verifikasi Kepemilikan & Status Tenant
    let targetTenant: { id: string; owner_id: string; status: string } | null = null;

    if (tenant_id) {
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('id, owner_id, status')
        .eq('id', tenant_id)
        .maybeSingle();

      if (tenantError) {
        console.error('[BE-03] Database tenant verification error:', tenantError);
        return sendJson(res, 500, {
          error: 'Gagal memverifikasi tenant: Terjadi kesalahan internal database.',
        });
      }

      if (!tenant) {
        return sendJson(res, 404, { error: 'Tenant tidak ditemukan.' });
      }

      if (!isPlatformAdmin && tenant.owner_id !== user.id) {
        return sendJson(res, 403, {
          error: 'Akses ditolak: Usaha kuliner bukan milik akun Anda.',
        });
      }

      if (tenant.status === 'suspended') {
        return sendJson(res, 403, {
          error: 'Akun usaha kuliner Anda sedang ditangguhkan. Silakan hubungi admin platform.',
        });
      }

      targetTenant = tenant;
    } else {
      // Jika tenant_id tidak dikirim, ambil tenant milik akun ini
      const { data: userTenants, error: tenantsError } = await supabaseAdmin
        .from('tenants')
        .select('id, owner_id, status')
        .eq('owner_id', user.id);

      if (tenantsError) {
        console.error('[BE-03] Database user tenants read error:', tenantsError);
        return sendJson(res, 500, {
          error: 'Gagal membaca tenant akun: Terjadi kesalahan internal database.',
        });
      }

      if (userTenants && userTenants.length > 0) {
        const activeTenant = userTenants.find((t) => t.status !== 'suspended') || userTenants[0];

        if (userTenants.every((t) => t.status === 'suspended')) {
          return sendJson(res, 403, {
            error: 'Akun usaha kuliner Anda sedang ditangguhkan. Silakan hubungi admin platform.',
          });
        }

        targetTenant = activeTenant;
      } else if (!isPlatformAdmin) {
        return sendJson(res, 403, {
          error: 'Akses ditolak: Akun Anda belum memiliki usaha kuliner terdaftar.',
        });
      }
    }

    // 5. Resolusi Target Folder di Cloudinary & Isolasi Tenant Sandbox
    let targetFolder: string;
    if (folder && typeof folder === 'string' && folder.trim().length > 0) {
      const cleanedFolder = folder.trim().replace(/^\/+|\/+$/g, '');

      if (!isPlatformAdmin && targetTenant) {
        // Enforce tenant boundary: non-admin dilarang mengakses/membuat folder tenant lain
        const tenantPrefix = `restolink/tenants/${targetTenant.id}`;
        if (cleanedFolder.startsWith('restolink/tenants/')) {
          if (cleanedFolder !== tenantPrefix && !cleanedFolder.startsWith(`${tenantPrefix}/`)) {
            return sendJson(res, 403, {
              error: 'Akses ditolak: Tidak dapat membuat folder di luar ruang tenant Anda.',
            });
          }
          targetFolder = cleanedFolder;
        } else {
          // Otomatis sandboxing ke direktori tenant jika path relatif dikirim
          targetFolder = `${tenantPrefix}/${cleanedFolder}`;
        }
      } else {
        targetFolder = cleanedFolder;
      }
    } else {
      const sub = uploadType === 'logo' ? 'logos' : 'menus';
      targetFolder = targetTenant
        ? `restolink/tenants/${targetTenant.id}/${sub}`
        : `restolink/${sub}`;
    }

    // 6. Generate Timestamp & SHA-1 Signature Berbatas Waktu
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      folder: targetFolder,
      timestamp,
    };

    const { signature } = generateCloudinarySignature(paramsToSign, apiSecret);

    // 7. Response JSON untuk Direct Upload Client
    return sendJson(res, 200, {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: targetFolder,
    });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    return sendJson(res, 500, {
      error: 'Internal Server Error: Terjadi kesalahan tidak terduga pada server.',
    });
  }
}
