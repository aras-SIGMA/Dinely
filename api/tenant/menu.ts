import type { ApiRequest, ApiResponse } from '../_types';
import { sendJson } from '../_lib/http';
import { getSupabaseAdmin } from '../_lib/supabase';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Hanya izinkan metode GET
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed. Gunakan GET.' });
  }

  const url = new URL(req.url || '', 'http://localhost');
  const tenantId = url.searchParams.get('tenantId') || url.searchParams.get('tenant_id');

  if (!tenantId) {
    return sendJson(res, 400, { error: 'Parameter tenantId wajib disertakan.' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verifikasi apakah tenant berstatus aktif / trial
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('public_tenants')
      .select('id, business_name, status')
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error('[API /api/tenant/menu] Error verifikasi tenant:', tenantError);
      return sendJson(res, 500, { error: 'Gagal memverifikasi tenant.' });
    }

    if (!tenant) {
      return sendJson(res, 404, { error: 'Restoran tidak ditemukan atau sedang tidak aktif.' });
    }

    // 2. Ambil data kategori dan menu items secara paralel
    const [categoriesRes, menuRes] = await Promise.all([
      supabaseAdmin
        .from('categories')
        .select('id, tenant_id, name, sort_order')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('menu_items')
        .select('id, tenant_id, category_id, name, description, price, image_url, is_available, sort_order')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
    ]);

    if (categoriesRes.error) {
      console.error('[API /api/tenant/menu] Error fetch categories:', categoriesRes.error);
      return sendJson(res, 500, { error: 'Gagal memuat kategori menu.' });
    }

    if (menuRes.error) {
      console.error('[API /api/tenant/menu] Error fetch menu_items:', menuRes.error);
      return sendJson(res, 500, { error: 'Gagal memuat daftar menu.' });
    }

    // Set cache header untuk performa
    res.setHeader?.('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return sendJson(res, 200, {
      categories: categoriesRes.data || [],
      items: menuRes.data || []
    });
  } catch (err: any) {
    console.error('[API /api/tenant/menu] Internal server error:', err);
    return sendJson(res, 500, { error: err?.message || 'Terjadi kesalahan pada server.' });
  }
}
