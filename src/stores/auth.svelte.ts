import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

class AuthStore {
  loading = $state(true);
  profile = $state<Profile | null>(null);

  #ready: Promise<void>;
  #resolveReady!: () => void;

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

  waitUntilReady(): Promise<void> {
    return this.#ready;
  }

  async init(): Promise<void> {
    this.loading = true;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await this.loadProfile(data.session.user.id);
      }
    } finally {
      this.loading = false;
      this.#resolveReady();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.profile = null;
      }
    });
  }

  async loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    this.profile = error ? null : (data as Profile | null);
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.profile = null;
  }
}

export const authStore = new AuthStore();
