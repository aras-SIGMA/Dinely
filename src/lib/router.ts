/**
 * ============================================================================
 * DINELY - Router Instance
 * ============================================================================
 * Instansiasi router tunggal sv-router untuk platform utama dan situs tenant.
 * Mengekspos state reaktif pathname dan fungsi navigasi.
 * ============================================================================
 */

import { createRouter } from 'sv-router';
import { host } from '@/lib/host';
import { platformRoutes } from '@/routes/platform';
import { tenantRoutes } from '@/routes/tenant';

export const routes = host.slug ? tenantRoutes : platformRoutes;
export const router = createRouter(routes);
