import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Browser Client (Frontend)
 *
 * KREDENSIAL YANG DIBUTUHKAN DI FILE .env:
 * - VITE_SUPABASE_URL     : URL project Supabase
 * - VITE_SUPABASE_ANON_KEY: Kunci publik anon
 *
 * Client ini aman digunakan di sisi browser karena dilindungi oleh Row Level Security (RLS).
 * Jika variabel belum diisi di .env, client akan fallback ke nilai placeholder
 * dan memunculkan peringatan di console browser.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Dinely] Variabel VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi di file .env. ' +
    'Silakan salin .env.example menjadi .env dan isi kredensial Supabase Anda.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'missing-anon-key'
);
