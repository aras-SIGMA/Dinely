/**
 * ============================================================================
 * RESTOLINK - Formatter Utilities
 * ============================================================================
 * Pemformatan standar Indonesia untuk mata uang Rupiah dan tanggal/waktu.
 * ============================================================================
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  } catch {
    return dateString;
  }
}
