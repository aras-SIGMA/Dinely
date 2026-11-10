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
    let { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data && !error) {
      // Retry 1x dengan jeda 350ms jika trigger handle_new_user membutuhkan jeda eksekusi
      await new Promise((res) => setTimeout(res, 350));
      const retry = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    this.tenant = error ? null : (data as Tenant | null);
  }

  /**
   * Fallback defense-in-depth jika trigger database tertunda atau belum membuat tenant
   */
  async ensureTenantExists(user: { id: string; user_metadata?: Record<string, any> }): Promise<void> {
    if (this.tenant) return;
    const meta = user.user_metadata;
    if (meta?.subdomain && meta?.business_name) {
      const { data: fallbackTenant, error: insertError } = await supabase
        .from('tenants')
        .insert({
          owner_id: user.id,
          business_name: String(meta.business_name).trim(),
          subdomain: String(meta.subdomain).trim().toLowerCase(),
          status: 'pending',
          primary_color: '#ea580c'
        })
        .select()
        .maybeSingle();

      if (!insertError && fallbackTenant) {
        this.tenant = fallbackTenant as Tenant;
      }
    }
  }

  async refreshTenant(): Promise<void> {
    if (this.profile?.id) {
      await this.loadTenant(this.profile.id);
    }
  }

  async signUp(params: SignUpParams): Promise<AuthActionResult> {
    const { email, password, fullName, phone, businessName, subdomain } = params;

    // 0. Batas panjang input (defense-in-depth anti payload bloat)
    if (fullName.trim().length > 100) {
      return { success: false, error: 'Nama lengkap maksimal 100 karakter.' };
    }
    if (phone && phone.trim().length > 20) {
      return { success: false, error: 'Nomor WhatsApp maksimal 20 karakter.' };
    }
    if (businessName.trim().length > 100) {
      return { success: false, error: 'Nama usaha maksimal 100 karakter.' };
    }

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

    // 3. Jika sesi auth aktif langsung tersedia (tanpa konfirmasi email)
    if (authData.session) {
      await Promise.all([
        this.loadProfile(user.id),
        this.loadTenant(user.id)
      ]);

      if (!this.tenant) {
        await this.ensureTenantExists(user);
      }

      return {
        success: true,
        session: true,
        role: this.role ?? 'owner'
      };
    }

    // Kasus jika project Supabase mengaktifkan konfirmasi email OTP
    return {
      success: true,
      session: false,
      error: 'Pendaftaran berhasil. Silakan periksa inbox email Anda untuk kode verifikasi 6-digit.'
    };
  }

  /**
   * Verifikasi 6-Digit Email OTP dari Supabase Auth
   * Ref: https://supabase.com/docs/reference/javascript/auth-verifyotp
   */
  async verifyEmailOtp(email: string, token: string): Promise<AuthActionResult> {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'signup'
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
        error: 'Sesi gagal dibuat setelah verifikasi kode.'
      };
    }

    await Promise.all([
      this.loadProfile(data.user.id),
      this.loadTenant(data.user.id)
    ]);

    if (!this.tenant) {
      await this.ensureTenantExists(data.user);
    }

    return {
      success: true,
      session: true,
      role: this.role ?? 'owner'
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

    if (!this.tenant) {
      await this.ensureTenantExists(data.user);
    }

    return {
      success: true,
      session: true,
      role: this.role ?? undefined
    };
  }

  async verifyOtp(params: { email: string; token: string; type?: 'email' | 'signup' }): Promise<AuthActionResult> {
    const { email, token, type = 'signup' } = params;
    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: (type === 'email' ? 'signup' : type) as 'signup' | 'email'
      });

      // Fallback: jika type pertama gagal, coba type alternatif ('signup' vs 'email')
      if (error && (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('expired'))) {
        const altType = (type === 'signup' ? 'email' : 'signup') as 'signup' | 'email';
        const alt = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: altType
        });
        if (!alt.error && alt.data?.user) {
          data = alt.data;
          error = null;
        }
      }

      if (error) {
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

        if (!this.tenant) {
          await this.ensureTenantExists(data.user);
        }
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

  async resendOtp(
    emailOrParams: string | { email: string; type?: 'signup' | 'email' }
  ): Promise<{ success: boolean; error?: string }> {
    const emailRaw = typeof emailOrParams === 'string' ? emailOrParams : emailOrParams.email;
    const type = typeof emailOrParams === 'string' ? 'signup' : emailOrParams.type ?? 'signup';
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';
    if (!email) {
      return { success: false, error: 'Email tidak boleh kosong.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: (type === 'email' ? 'signup' : type) as 'signup' | 'email_change',
        email
      });

      if (error) {
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
