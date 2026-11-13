/**
 * Konfigurasi Domain Utama Platform
 *
 * - Saat tahap produksi: ubah ke domain live Anda, misalnya 'dinely.site'.
 * - Saat tahap development lokal: resolver otomatis mendukung 'slug.localhost' (contoh: dapur-nia.localhost:5173).
 * - Jika menggunakan domain lain di Vercel (misal: 'dinely.vercel.app' atau custom domain lomba), sesuaikan nilai di sini.
 */
export const APP_DOMAIN = 'dinely.site';

/**
 * Kontak Dukungan Resmi Platform
 * Sinkron dengan modal bantuan pada halaman Login.
 */
export const SUPPORT_EMAIL = 'stefanohari2@gmail.com';
export const SUPPORT_WHATSAPP_DISPLAY = '+62 812-3456-7890';
export const SUPPORT_WHATSAPP_NUMBER = '6281234567890';

/**
 * Membangun tautan WhatsApp untuk handoff percakapan ke tim dukungan.
 */
export function buildSupportWhatsAppLink(context?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;
  if (!context) return base;
  return `${base}?text=${encodeURIComponent(context)}`;
}

/**
 * Daftar Subdomain yang Dipesan (Reserved Subdomains)
 *
 * Sinkron 100% dengan constraint database check_subdomain_reserved pada 001_initial_schema.sql.
 * Subdomain-subdomain di bawah ini dilarang didaftarkan oleh tenant UMKM
 * untuk mencegah bentrok dengan rute sistem platform, DNS, atau modul internal.
 */
export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'dashboard',
  'cdn',
  'mail',
  'support',
  'billing',
  'static',
  'status',
  'assets',
  'docs',
  'demo'
]);

/**
 * Subdomain khusus Mode Demo. Dicadangkan agar tidak dapat didaftarkan tenant
 * sungguhan, namun tetap boleh dipakai sebagai target resolusi host.
 */
export const DEMO_SUBDOMAIN = 'demo';

/**
 * Sakelar sementara untuk verifikasi OTP saat login.
 * Setel kembali ke `true` sebelum rilis produksi.
 */
export const OTP_LOGIN_ENABLED = false;

/**
 * Memeriksa apakah suatu slug termasuk subdomain yang dilarang/dipesan.
 */
export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase().trim());
}

/**
 * Memeriksa apakah format dan nilai subdomain valid sesuai aturan platform & database.
 * Aturan:
 * - Panjang 3 - 63 karakter
 * - Hanya karakter a-z, 0-9, dan dash (-)
 * - Tidak diawali atau diakhiri tanda dash (-)
 * - Bukan anggota RESERVED_SUBDOMAINS
 */
export function isValidSubdomain(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 63) return false;
  if (!/^[a-z0-9-]+$/.test(normalized)) return false;
  if (normalized.startsWith('-') || normalized.endsWith('-')) return false;
  return !isReservedSubdomain(normalized);
}
