import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL tidak ditemukan pada environment variable.');
  }
  return url;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak ditemukan pada environment variable.');
  }
  adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return adminClient;
}

export function getSupabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = getSupabaseUrl();
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY tidak ditemukan pada environment variable.');
  }
  anonClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return anonClient;
}
