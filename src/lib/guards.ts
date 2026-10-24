import type { UserRole } from '@/types';

export const DASHBOARD_HOME = '/dashboard';
export const ADMIN_HOME = '/admin';
export const LOGIN_PATH = '/masuk';

export function homePathForRole(role: UserRole | null): string {
  if (role === 'platform_admin') return ADMIN_HOME;
  if (role === 'owner') return DASHBOARD_HOME;
  return LOGIN_PATH;
}
