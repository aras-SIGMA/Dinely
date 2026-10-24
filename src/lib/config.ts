/**
 * Konfigurasi Domain Utama Platform
 *
 * - Saat tahap produksi: ubah ke domain live Anda, misalnya 'restolink.site'.
 * - Saat tahap development lokal: resolver otomatis mendukung 'slug.localhost' (contoh: dapur-nia.localhost:5173).
 * - Jika menggunakan domain lain di Vercel (misal: 'restolink.vercel.app' atau custom domain lomba), sesuaikan nilai di sini.
 */
export const APP_DOMAIN = 'restolink.site';

/**
 * Daftar Subdomain yang Dipesan (Reserved Subdomains)
 *
 * Subdomain-subdomain di bawah ini dilarang didaftarkan oleh tenant UMKM
 * untuk mencegah bentrok dengan rute sistem platform, DNS, atau modul internal.
 */
export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'admin',
  'api',
  'app',
  'auth',
  'mail',
  'dashboard',
  'static',
  'assets',
  'cdn',
  'status',
  'docs'
]);

/**
 * Memeriksa apakah suatu slug termasuk subdomain yang dilarang/dipesan.
 */
export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}
