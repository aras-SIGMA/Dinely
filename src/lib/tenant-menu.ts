import { supabase } from '@/lib/supabase';
import { isDemoMode } from '@/lib/demo/mode';
import { demoStore } from '@/lib/demo/store';
import type { Category, MenuItem } from '@/types';

export interface TenantMenuData {
  categories: Category[];
  items: MenuItem[];
}

/**
 * Mengambil daftar kategori dan menu aktif untuk website publik tenant.
 * Mendukung dual-strategy:
 * 1. PostgREST RLS (akses langsung via Supabase client anon)
 * 2. Fallback otomatis ke `/api/tenant/menu` jika RLS database belum di-override di cloud
 */
export async function fetchTenantMenu(tenantId: string): Promise<TenantMenuData> {
  if (!tenantId) {
    return { categories: [], items: [] };
  }

  // Mode demo: katalog publik dilayani dari sandbox lokal.
  if (isDemoMode()) {
    return {
      categories: demoStore.categories,
      items: demoStore.menuItems.filter((item) => item.is_available)
    };
  }

  // 1. Coba fetch langsung via Supabase client (PostgREST)
  try {
    const [categoriesRes, menuRes] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
    ]);

    if (!categoriesRes.error && !menuRes.error && menuRes.data && menuRes.data.length > 0) {
      return {
        categories: (categoriesRes.data as Category[]) || [],
        items: (menuRes.data as MenuItem[]) || []
      };
    }
  } catch (err) {
    console.warn('[fetchTenantMenu] Supabase query fallback ke endpoint API:', err);
  }

  // 2. Fallback ke endpoint Serverless `/api/tenant/menu`
  try {
    const res = await fetch(`/api/tenant/menu?tenantId=${encodeURIComponent(tenantId)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        categories: (data.categories as Category[]) || [],
        items: (data.items as MenuItem[]) || []
      };
    }
  } catch (apiErr) {
    console.error('[fetchTenantMenu] Endpoint API error:', apiErr);
  }

  return { categories: [], items: [] };
}
