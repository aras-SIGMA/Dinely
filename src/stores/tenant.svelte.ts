import { supabase } from '@/lib/supabase';
import type { PublicTenant } from '@/types';

class TenantStore {
  loading = $state(false);
  tenant = $state<PublicTenant | null>(null);
  slug = $state<string | null>(null);
  error = $state<string | null>(null);

  get notFound(): boolean {
    return !this.loading && this.slug !== null && this.tenant === null;
  }

  get isReady(): boolean {
    return !this.loading && this.tenant !== null;
  }

  get primaryColor(): string {
    return this.tenant?.primary_color ?? '#ea580c';
  }

  get businessName(): string {
    return this.tenant?.business_name ?? '';
  }

  /**
   * Mengambil data profil publik tenant dari view `public_tenants` di Supabase.
   * View `public_tenants` secara otomatis memfilter tenant yang statusnya aktif/trial
   * dan belum melewati batas masa berlangganan.
   */
  async fetchTenant(slug: string | null, force = false): Promise<PublicTenant | null> {
    if (!slug) {
      this.reset();
      return null;
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Hindari request duplikat jika tenant dengan slug yang sama sudah berhasil dimuat
    if (!force && this.slug === normalizedSlug && this.tenant !== null) {
      return this.tenant;
    }

    this.loading = true;
    this.error = null;
    this.slug = normalizedSlug;

    try {
      const { data, error } = await supabase
        .from('public_tenants')
        .select(
          'id, business_name, subdomain, logo_url, description, contact_phone, contact_whatsapp, address, primary_color, status'
        )
        .eq('subdomain', normalizedSlug)
        .maybeSingle();

      if (error) {
        console.error('[RestoLink] Gagal memuat data tenant:', error.message);
        this.error = error.message;
        this.tenant = null;
      } else {
        this.tenant = data as PublicTenant | null;
      }
    } catch (err: any) {
      const message = err?.message ?? 'Terjadi kesalahan jaringan saat memuat tenant';
      console.error('[RestoLink] Exception saat memuat tenant:', err);
      this.error = message;
      this.tenant = null;
    } finally {
      this.loading = false;
    }

    return this.tenant;
  }

  reset(): void {
    this.loading = false;
    this.tenant = null;
    this.slug = null;
    this.error = null;
  }
}

export const tenantStore = new TenantStore();
