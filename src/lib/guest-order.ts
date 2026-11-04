/**
 * ============================================================================
 * RESTOLINK - Guest Order Service (FS-12 / Milestone 6)
 * ============================================================================
 * Menyediakan fungsi pemesanan pelanggan (guest) tanpa login dan pelacakan status
 * pesanan via PostgreSQL RPC:
 * 1. `create_guest_order` - Eksekusi pembuatan pesanan dengan kalkulasi harga di server
 * 2. `get_guest_order_status` - Pelacakan status rincian pesanan dengan proteksi PII
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import type {
  CreateGuestOrderResult,
  GetGuestOrderStatusResult,
  GuestOrderItemPayload
} from '@/types';

export interface SubmitGuestOrderInput {
  tenantId: string;
  buyerName: string;
  buyerContact?: string | null;
  note?: string | null;
  items: GuestOrderItemPayload[];
}

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi awal input data pemesan di sisi client sebelum memanggil RPC Postgres.
 */
export function validateGuestOrderInput(input: SubmitGuestOrderInput): OrderValidationResult {
  if (!input.tenantId) {
    return { valid: false, error: 'ID resto (tenant) tidak valid.' };
  }

  const cleanName = (input.buyerName || '').trim();
  if (cleanName.length < 2) {
    return { valid: false, error: 'Nama pemesan minimal 2 karakter.' };
  }

  if (cleanName.length > 100) {
    return { valid: false, error: 'Nama pemesan maksimal 100 karakter.' };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { valid: false, error: 'Keranjang belanja masih kosong.' };
  }

  if (input.items.length > 50) {
    return { valid: false, error: 'Jumlah jenis menu dalam keranjang maksimal 50.' };
  }

  for (const item of input.items) {
    if (!item.menu_item_id) {
      return { valid: false, error: 'ID menu tidak valid.' };
    }
    if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
      return { valid: false, error: 'Kuantitas per menu harus antara 1 hingga 99.' };
    }
  }

  if (input.note && input.note.length > 500) {
    return { valid: false, error: 'Catatan pesanan maksimal 500 karakter.' };
  }

  return { valid: true };
}

/**
 * Mengirimkan pesanan guest ke RPC Postgres `create_guest_order`.
 * Harga dihitung ulang secara aman di server untuk mencegah manipulasi client-side.
 */
export async function submitGuestOrder(
  input: SubmitGuestOrderInput
): Promise<CreateGuestOrderResult> {
  const validation = validateGuestOrderInput(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'Data pesanan tidak valid.');
  }

  const { data, error } = await supabase.rpc('create_guest_order', {
    p_tenant_id: input.tenantId,
    p_buyer_name: input.buyerName.trim(),
    p_buyer_contact: input.buyerContact ? input.buyerContact.trim() : null,
    p_note: input.note ? input.note.trim() : null,
    p_items: input.items
  });

  if (error) {
    console.error('[guest-order] Error RPC create_guest_order:', error.message);
    throw new Error(error.message || 'Gagal memproses pesanan. Silakan coba lagi.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Format respon pesanan dari server tidak dikenali.');
  }

  const result = data as CreateGuestOrderResult;
  if (!result.success || !result.order_code) {
    throw new Error('Pesanan gagal diproses oleh server database.');
  }

  // Simpan kode pesanan terakhir ke LocalStorage agar pembeli tidak kehilangan bukti
  saveLastOrderCode(input.tenantId, result.order_code);

  return result;
}

/**
 * Mengambil detail & status pesanan guest via RPC Postgres `get_guest_order_status`.
 */
export async function fetchGuestOrderStatus(
  tenantId: string,
  orderCode: string
): Promise<GetGuestOrderStatusResult> {
  if (!tenantId || !orderCode) {
    return { success: false, message: 'ID resto dan kode pesanan wajib disertakan.' };
  }

  const cleanCode = orderCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('get_guest_order_status', {
    p_tenant_id: tenantId,
    p_order_code: cleanCode
  });

  if (error) {
    console.error('[guest-order] Error RPC get_guest_order_status:', error.message);
    return { success: false, message: error.message || 'Gagal memuat status pesanan.' };
  }

  if (!data || typeof data !== 'object') {
    return { success: false, message: 'Respon status pesanan tidak valid.' };
  }

  return data as GetGuestOrderStatusResult;
}

/**
 * Menyimpan kode pesanan terakhir pelanggan di LocalStorage per tenant.
 */
export function saveLastOrderCode(tenantId: string, orderCode: string): void {
  if (typeof window === 'undefined' || !window.localStorage || !tenantId || !orderCode) return;
  try {
    window.localStorage.setItem(`restolink_last_order_${tenantId}`, orderCode.trim().toUpperCase());
  } catch (err) {
    console.warn('[guest-order] Gagal menyimpan lastOrderCode:', err);
  }
}

/**
 * Membaca kode pesanan terakhir pelanggan dari LocalStorage per tenant.
 */
export function getLastOrderCode(tenantId: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage || !tenantId) return null;
  try {
    return window.localStorage.getItem(`restolink_last_order_${tenantId}`);
  } catch {
    return null;
  }
}

/**
 * Menghapus catatan kode pesanan terakhir dari LocalStorage.
 */
export function clearLastOrderCode(tenantId: string): void {
  if (typeof window === 'undefined' || !window.localStorage || !tenantId) return;
  try {
    window.localStorage.removeItem(`restolink_last_order_${tenantId}`);
  } catch (err) {
    console.warn('[guest-order] Gagal menghapus lastOrderCode:', err);
  }
}
