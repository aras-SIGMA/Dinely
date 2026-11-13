/**
 * ============================================================================
 * DINELY - Reports & Analytics: Data Fetching
 * ============================================================================
 * Lapisan I/O dipisahkan dari agregasi murni agar fungsi laporan dapat
 * diverifikasi tanpa menyentuh Supabase.
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/types';
import type { ReportRange } from '@/lib/reports';
import { isDemoMode } from '@/lib/demo/mode';
import { demoStore } from '@/lib/demo/store';

/**
 * Mengambil pesanan beserta rincian item dalam satu rentang tanggal.
 * Batas baris dibatasi agar satu query tidak menarik seluruh riwayat tenant.
 */
export async function fetchReportOrders(
  tenantId: string,
  range: ReportRange,
  limit = 2000
): Promise<OrderWithItems[]> {
  if (!tenantId) return [];

  // Mode demo: saring sandbox lokal, tanpa query Supabase.
  if (isDemoMode()) {
    const start = new Date(range.startISO).getTime();
    const end = new Date(range.endISO).getTime();
    return demoStore.orders.filter((order) => {
      const created = new Date(order.created_at).getTime();
      return created >= start && created <= end;
    });
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      tenant_id,
      order_code,
      buyer_name,
      buyer_contact,
      note,
      status,
      total_amount,
      created_at,
      updated_at,
      order_items (
        id,
        order_id,
        menu_item_id,
        menu_item_name_snapshot,
        price_snapshot,
        quantity,
        subtotal
      )
    `)
    .eq('tenant_id', tenantId)
    .gte('created_at', range.startISO)
    .lte('created_at', range.endISO)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[reports] Gagal memuat data pesanan:', error.message);
    throw new Error(error.message);
  }

  return (data as OrderWithItems[]) || [];
}
