import { supabase } from '@/lib/supabase';
import { checkSubdomainAvailability } from '@/lib/subdomain-validator';
import type { Profile, Tenant, UserRole } from '@/types';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  businessName: string;
  subdomain: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  session?: boolean;
  role?: UserRole;
}

class AuthStore {
  loading = $state(true);
  profile = $state<Profile | null>(null);
  tenant = $state<Tenant | null>(null);

  #ready: Promise<void>;
  #resolveReady!: () => void;
  #initialized = false;

  constructor() {
    this.#ready = new Promise((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  get role(): UserRole | null {
    return this.profile?.role ?? null;
  }

  get isAuthenticated(): boolean {
    return this.profile !== null;
  }

  get isOwner(): boolean {
    return this.profile?.role === 'owner';
  }

  get isPlatformAdmin(): boolean {
    return this.profile?.role === 'platform_admin';
  }

  get hasActiveTenant(): boolean {
    return (
      this.tenant !== null &&
      (this.tenant.status === 'active' || this.tenant.status === 'trial')
    );
  }

  waitUntilReady(): Promise<void> {
    return this.#ready;
  }

  async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;

    this.loading = true;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await Promise.all([
          this.loadProfile(data.session.user.id),
          this.loadTenant(data.session.user.id)
        ]);
      }
    } catch (err) {
      console.error('[authStore] Failed to initialize session:', err);
    } finally {
      this.loading = false;
      this.#resolveReady();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await Promise.all([
          this.loadProfile(session.user.id),
          this.loadTenant(session.user.id)
        ]);
      } else {
        this.profile = null;
        this.tenant = null;
      }
    });
  }

  async loadProfile(userId: string): Promise<void> {
    let { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (!data && !error) {
      // Retry 1x jika trigger on_auth_user_created membutuhkan jeda eksekusi
      await new Promise((res) => setTimeout(res, 250));
      const retry = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, created_at')
        .eq('id', userId)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    this.profile = error ? null : (data as Profile | null);
  }

  async loadTenant(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.tenant = error ? null : (data as Tenant | null);
  }

  async refreshTenant(): Promise<void> {
    if (this.profile?.id) {
      await this.loadTenant(this.profile.id);
    }
  }

  async signUp(params: SignUpParams): Promise<AuthActionResult> {
    const { email, password, fullName, phone, businessName, subdomain } = params;

    // 1. Verifikasi ketersediaan subdomain di database
    const subCheck = await checkSubdomainAvailability(subdomain);
    if (!subCheck.available) {
      return {
        success: false,
        error: subCheck.error || 'Subdomain tidak valid atau sudah digunakan.'
      };
    }

    // 2. Daftarkan akun auth di Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
          business_name: businessName.trim(),
          subdomain: subdomain.trim().toLowerCase()
        }
      }
    });

    if (authError) {
      return {
        success: false,
        error: authError.message
      };
    }

    const user = authData.user;
    if (!user) {
      return {
        success: false,
        error: 'Pendaftaran akun gagal diproses.'
      };
    }

    // 3. Jika sesi auth aktif langsung tersedia
    if (authData.session) {
      await this.loadProfile(user.id);

      // Provision tenant baru status 'pending'
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          owner_id: user.id,
          business_name: businessName.trim(),
          subdomain: subdomain.trim().toLowerCase(),
          status: 'pending',
          primary_color: '#ea580c'
        })
        .select()
        .single();

      if (tenantError) {
        console.error('[authStore] Failed to insert tenant:', tenantError);
        return {
          success: false,
          error: `Akun dibuat namun gagal mendaftarkan resto: ${tenantError.message}`
        };
      }

      this.tenant = tenantData as Tenant;
      return {
        success: true,
        session: true,
        role: this.role ?? 'owner'
      };
    }

    // Kasus jika project Supabase mengaktifkan konfirmasi email
    return {
      success: true,
      session: false,
      error: 'Pendaftaran berhasil. Silakan periksa inbox email Anda untuk verifikasi.'
    };
  }

  async signIn(params: SignInParams): Promise<AuthActionResult> {
    const { email, password } = params;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Data pengguna tidak ditemukan.'
      };
    }

    await Promise.all([
      this.loadProfile(data.user.id),
      this.loadTenant(data.user.id)
    ]);

    return {
      success: true,
      session: true,
      role: this.role ?? undefined
    };
  }

  async verifyOtp(params: { email: string; token: string; type?: 'email' | 'signup' }): Promise<AuthActionResult> {
    const { email, token, type = 'email' } = params;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: type as 'email' | 'signup'
      });

      if (error) {
        // Fallback ke custom Gmail OTP endpoint jika Kevin mengimplementasikannya di API
        try {
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), otp: token.trim() })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.session || json.success) {
              return { success: true, session: true, role: this.role ?? 'owner' };
            }
          }
        } catch {
          // endpoint custom belum aktif
        }

        return {
          success: false,
          error: error.message || 'Kode OTP tidak valid atau telah kedaluwarsa.'
        };
      }

      if (data.user) {
        await Promise.all([
          this.loadProfile(data.user.id),
          this.loadTenant(data.user.id)
        ]);
      }

      return {
        success: true,
        session: !!data.session,
        role: this.role ?? 'owner'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal memverifikasi kode OTP.'
      };
    }
  }

  async resendOtp(params: { email: string; type?: 'signup' | 'email' }): Promise<{ success: boolean; error?: string }> {
    const { email, type = 'signup' } = params;
    try {
      const { error } = await supabase.auth.resend({
        type: (type === 'email' ? 'email_change' : 'signup') as 'signup' | 'email_change',
        email: email.trim()
      });

      if (error) {
        // Fallback ke custom Gmail OTP endpoint
        try {
          const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() })
          });
          if (res.ok) return { success: true };
        } catch {
          // endpoint custom belum aktif
        }

        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim ulang kode OTP.' };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.profile = null;
    this.tenant = null;
  }
}

export const authStore = new AuthStore();
