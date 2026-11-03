import type { ApiRequest } from '../_types';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAnon } from './supabase';

export interface AuthSession {
  user: User;
  token: string;
}

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}

export async function authenticateUser(req: ApiRequest): Promise<AuthSession> {
  const authHeader = req.headers?.authorization || req.headers?.['Authorization'];
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    throw new HttpError(401, 'Autentikasi gagal: Header Authorization Bearer token wajib disertakan.');
  }

  const token = headerValue.slice(7).trim();
  if (!token) {
    throw new HttpError(401, 'Autentikasi gagal: Bearer token tidak boleh kosong.');
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new HttpError(401, `Sesi login tidak valid atau sudah kedaluwarsa: ${error?.message || 'User tidak ditemukan'}`);
  }

  return {
    user: data.user,
    token,
  };
}
