import { APP_DOMAIN, isReservedSubdomain } from './config';

export type HostInfo = {
  slug: string | null;
  isPlatformHost: boolean;
  hostname: string;
};

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

function stripPort(hostname: string): string {
  return hostname.replace(/:\d+$/, '').toLowerCase();
}

function sanitizeSlug(value: string): string | null {
  const slug = value.trim().toLowerCase();
  if (!slug) return null;
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (slug.startsWith('-') || slug.endsWith('-')) return null;
  return slug;
}

/**
 * Extract the tenant slug from a hostname.
 * Returns `null` when the host belongs to the platform itself, a preview
 * deployment, or a hostname that cannot map to a single tenant.
 */
export function resolveTenantSlug(hostname: string): string | null {
  const host = stripPort(hostname);

  if (!host || host === 'localhost' || IPV4.test(host) || host === '[::1]') return null;

  if (host.endsWith(`.${APP_DOMAIN}`)) {
    const slug = sanitizeSlug(host.slice(0, -(APP_DOMAIN.length + 1)));
    return slug && !isReservedSubdomain(slug) ? slug : null;
  }

  if (host === APP_DOMAIN) return null;

  if (host.endsWith('.localhost')) {
    const slug = sanitizeSlug(host.slice(0, -'.localhost'.length));
    return slug && !isReservedSubdomain(slug) ? slug : null;
  }

  if (host.endsWith('.vercel.app')) return null;

  const parts = host.split('.');
  if (parts.length <= 2) return null;

  const slug = sanitizeSlug(parts.slice(0, -2).join('.'));
  return slug && !isReservedSubdomain(slug) ? slug : null;
}

export function resolveHost(hostname: string): HostInfo {
  const host = stripPort(hostname);
  const slug = resolveTenantSlug(hostname);
  return { slug, isPlatformHost: slug === null, hostname: host };
}
