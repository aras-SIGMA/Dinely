import { APP_DOMAIN, DEMO_SUBDOMAIN, isValidSubdomain } from './config';

export type HostInfo = {
  slug: string | null;
  isPlatformHost: boolean;
  hostname: string;
};

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

function stripPort(hostname: string): string {
  return hostname.replace(/:\d+$/, '').toLowerCase();
}

export function sanitizeSlug(value: string): string | null {
  const slug = value.trim().toLowerCase();
  // Subdomain demo sengaja dikecualikan dari larangan reserved agar mode demo bisa dibuka.
  if (slug === DEMO_SUBDOMAIN) return slug;
  return isValidSubdomain(slug) ? slug : null;
}

/**
 * Extract the tenant slug from a hostname and optional search query.
 *
 * Evaluation Order:
 * 1. Query parameter override (`?tenant=slug` or `?t=slug`) for development & preview.
 * 2. Production domain (`slug.dinely.site`).
 * 3. Localhost development (`slug.localhost`).
 * 4. Generic multi-level domain (`slug.customdomain.com`).
 *
 * Returns `null` when the host belongs to the platform itself, a preview
 * deployment without query override, or a hostname that cannot map to a single tenant.
 */
export function resolveTenantSlug(hostname: string, search?: string): string | null {
  // 1. Explicit query parameter override (ideal for local dev & Vercel preview environments)
  if (search) {
    try {
      const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
      const params = new URLSearchParams(cleanSearch);
      const queryCandidate = params.get('tenant') ?? params.get('t');
      if (queryCandidate) {
        const slug = sanitizeSlug(queryCandidate);
        if (slug) return slug;
      }
    } catch {
      // Abaikan jika search string tidak valid
    }
  }

  const host = stripPort(hostname);

  if (!host || host === 'localhost' || IPV4.test(host) || host === '[::1]') return null;

  if (host.endsWith(`.${APP_DOMAIN}`)) {
    return sanitizeSlug(host.slice(0, -(APP_DOMAIN.length + 1)));
  }

  if (host === APP_DOMAIN) return null;

  if (host.endsWith('.localhost')) {
    return sanitizeSlug(host.slice(0, -'.localhost'.length));
  }

  // Hindari mem-parse subdomain preview internal Vercel (gunakan ?tenant=slug di preview)
  if (host.endsWith('.vercel.app')) return null;

  const parts = host.split('.');
  if (parts.length <= 2) return null;

  return sanitizeSlug(parts.slice(0, -2).join('.'));
}

export function resolveHost(hostname: string, search?: string): HostInfo {
  const host = stripPort(hostname);
  const slug = resolveTenantSlug(hostname, search);
  return { slug, isPlatformHost: slug === null, hostname: host };
}
