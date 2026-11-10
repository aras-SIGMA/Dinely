import { authStore } from '@/stores/auth.svelte';
import type { UserRole } from '@/types';

export const DASHBOARD_HOME = '/dashboard';
export const ADMIN_HOME = '/admin';
export const LOGIN_PATH = '/masuk';
export const REGISTER_PATH = '/daftar';

type NavigateFn = (path: `/${string}`) => Promise<unknown> | unknown;
let platformNavigate: NavigateFn | null = null;

export function setPlatformNavigate(fn: NavigateFn): void {
  platformNavigate = fn;
}

export function redirectRoute(target: string): false {
  if (platformNavigate) {
    platformNavigate(target as `/${string}`);
  } else if (typeof window !== 'undefined') {
    window.location.replace(target);
  }
  return false;
}

export function homePathForRole(role: UserRole | null): string {
  if (role === 'platform_admin') return ADMIN_HOME;
  if (role === 'owner') return DASHBOARD_HOME;
  return LOGIN_PATH;
}

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string };

/**
 * Evaluasi murni logika otorisasi (RBAC) untuk unit testing dan route guarding.
 */
export function evaluateAccess(
  requiredRole: UserRole,
  currentRole: UserRole | null,
  isAuthenticated: boolean
): AccessDecision {
  if (!isAuthenticated) {
    return { allowed: false, redirectTo: LOGIN_PATH };
  }

  if (requiredRole === 'owner') {
    if (currentRole === 'owner') return { allowed: true };
    if (currentRole === 'platform_admin') return { allowed: false, redirectTo: ADMIN_HOME };
    return { allowed: false, redirectTo: LOGIN_PATH };
  }

  if (requiredRole === 'platform_admin') {
    if (currentRole === 'platform_admin') return { allowed: true };
    if (currentRole === 'owner') return { allowed: false, redirectTo: DASHBOARD_HOME };
    return { allowed: false, redirectTo: LOGIN_PATH };
  }

  return { allowed: false, redirectTo: LOGIN_PATH };
}

/**
 * Route guard hook sebelum memuat rute '/dashboard/*'.
 * Hanya dapat diakses oleh user login dengan role 'owner'.
 */
export async function guardOwnerRoute(): Promise<void | boolean> {
  await authStore.waitUntilReady();
  const decision = evaluateAccess('owner', authStore.role, authStore.isAuthenticated);
  if (!decision.allowed) {
    return redirectRoute(decision.redirectTo);
  }
}

/**
 * Route guard hook sebelum memuat rute '/admin/*'.
 * Hanya dapat diakses oleh user login dengan role 'platform_admin'.
 */
export async function guardAdminRoute(): Promise<void | boolean> {
  await authStore.waitUntilReady();
  const decision = evaluateAccess('platform_admin', authStore.role, authStore.isAuthenticated);
  if (!decision.allowed) {
    return redirectRoute(decision.redirectTo);
  }
}

/**
 * Route guard hook untuk rute tamu ('/masuk', '/daftar').
 * Jika user sudah login, otomatis diarahkan ke halaman utama sesuai perannya.
 */
export async function guardGuestOnlyRoute(): Promise<void | boolean> {
  await authStore.waitUntilReady();
  if (authStore.isAuthenticated) {
    const target = homePathForRole(authStore.role);
    return redirectRoute(target);
  }
}
