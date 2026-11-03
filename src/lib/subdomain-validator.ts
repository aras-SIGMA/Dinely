import { isReservedSubdomain } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export interface SubdomainValidationResult {
  valid: boolean;
  error?: string;
}

export interface SubdomainAvailabilityResult {
  available: boolean;
  error?: string;
}

/**
 * Mengubah nama bisnis menjadi kandidat slug subdomain yang bersih.
 * Contoh: "Warung Kopi & Bakso Pak Joko 88!" -> "warung-kopi-bakso-pak-joko-88"
 */
export function slugify(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Hapus aksen diakritik
    .replace(/[^a-z0-9]+/g, '-') // Ganti karakter non-alfanumerik dengan tanda hubung
    .replace(/^-+|-+$/g, '') // Hapus tanda hubung di awal dan akhir
    .slice(0, 63);
}

/**
 * Validasi sintaks dan aturan reserved subdomain di sisi client tanpa request network.
 */
export function validateSubdomainFormat(slug: string): SubdomainValidationResult {
  const normalized = (typeof slug === 'string' ? slug : '').trim().toLowerCase();

  if (!normalized) {
    return { valid: false, error: 'Subdomain tidak boleh kosong.' };
  }

  if (normalized.length < 3) {
    return { valid: false, error: 'Subdomain minimal 3 karakter.' };
  }

  if (normalized.length > 63) {
    return { valid: false, error: 'Subdomain maksimal 63 karakter.' };
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomain hanya boleh berisi huruf kecil (a-z), angka (0-9), dan tanda hubung (-).'
    };
  }

  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return {
      valid: false,
      error: 'Subdomain tidak boleh diawali atau diakhiri tanda hubung (-).'
    };
  }

  if (isReservedSubdomain(normalized)) {
    return {
      valid: false,
      error: `Subdomain "${normalized}" dicadangkan oleh sistem dan tidak dapat digunakan.`
    };
  }

  return { valid: true };
}

/**
 * Memeriksa ketersediaan subdomain via RPC Postgres `is_subdomain_available`.
 * Otomatis memvalidasi format lokal terlebih dahulu sebelum menghubungi server.
 */
export async function checkSubdomainAvailability(
  slug: string
): Promise<SubdomainAvailabilityResult> {
  const formatCheck = validateSubdomainFormat(slug);
  if (!formatCheck.valid) {
    return { available: false, error: formatCheck.error };
  }

  const normalized = slug.trim().toLowerCase();

  try {
    const { data, error } = await supabase.rpc('is_subdomain_available', {
      subdomain_input: normalized
    });

    if (error) {
      console.error('[subdomain-validator] Error RPC is_subdomain_available:', error.message);
      return {
        available: false,
        error: 'Gagal memeriksa ketersediaan subdomain. Silakan coba beberapa saat lagi.'
      };
    }

    if (data === true) {
      return { available: true };
    }

    return {
      available: false,
      error: `Subdomain "${normalized}" sudah digunakan oleh UMKM lain.`
    };
  } catch (err) {
    console.error('[subdomain-validator] Network exception:', err);
    return {
      available: false,
      error: 'Koneksi terganggu saat memverifikasi subdomain.'
    };
  }
}
