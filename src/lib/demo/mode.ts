/**
 * ============================================================================
 * DINELY - Demo Mode Controller
 * ============================================================================
 * Satu-satunya sumber kebenaran status Mode Demo.
 * Mode demo adalah sesi bayangan lokal: tidak menyentuh Supabase Auth.
 * ============================================================================
 */

import { DEMO_FLAG_KEY } from './store';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** True bila mode demo aktif (flag localStorage atau query `?demo=1` / `?tenant=demo`). */
export function isDemoMode(): boolean {
  if (!hasWindow()) return false;
  try {
    if (window.localStorage.getItem(DEMO_FLAG_KEY) === '1') return true;
  } catch {
    // localStorage diblokir
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') {
    // Simpan flag agar mode demo bertahan setelah redirect ke /dashboard.
    try {
      window.localStorage.setItem(DEMO_FLAG_KEY, '1');
    } catch {
      // abaikan
    }
    return true;
  }

  // Membuka website tenant demo secara langsung juga mengaktifkan mode demo.
  // Tidak dipersist: pengunjung biasa tidak boleh masuk dashboard demo.
  return params.get('tenant') === 'demo';
}

/** Mengaktifkan mode demo lalu membuka dashboard. */
export function enterDemo(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(DEMO_FLAG_KEY, '1');
  } catch (err) {
    console.warn('[demo] Gagal menyimpan flag demo:', err);
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  url.pathname = '/dashboard';
  window.location.assign(url.toString());
}

/** Keluar dari mode demo tanpa menghapus data demo (agar bisa dilanjutkan). */
export function exitDemo(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(DEMO_FLAG_KEY);
  } catch {
    // abaikan
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  url.pathname = '/masuk';
  url.search = '';
  window.location.assign(url.toString());
}
