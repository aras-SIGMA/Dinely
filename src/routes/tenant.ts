import type { Routes } from 'sv-router';

export const tenantRoutes: Routes = {
  layout: () => import('@/apps/tenant-site/TenantShell.svelte'),
  '/': () => import('@/apps/tenant-site/routes/TenantHome.svelte'),
  '*': () => import('@/apps/tenant-site/routes/NotFound.svelte')
};
