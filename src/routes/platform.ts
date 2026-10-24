import type { Routes } from 'sv-router';

export const platformRoutes: Routes = {
  '/': () => import('@/apps/landing/routes/Home.svelte'),
  '/fitur': () => import('@/apps/landing/routes/Features.svelte'),
  '/harga': () => import('@/apps/landing/routes/Pricing.svelte'),
  '/daftar': () => import('@/apps/landing/routes/Register.svelte'),
  '/masuk': () => import('@/apps/landing/routes/Login.svelte'),

  '/dashboard': {
    layout: () => import('@/apps/dashboard/DashboardLayout.svelte'),
    '/': () => import('@/apps/dashboard/routes/Overview.svelte'),
    '/menu': () => import('@/apps/dashboard/routes/MenuManagement.svelte'),
    '/pesanan': () => import('@/apps/dashboard/routes/Orders.svelte'),
    '/profil': () => import('@/apps/dashboard/routes/Profile.svelte'),
    '/langganan': () => import('@/apps/dashboard/routes/Subscription.svelte')
  },

  '/admin': {
    layout: () => import('@/apps/admin/AdminLayout.svelte'),
    '/': () => import('@/apps/admin/routes/Tenants.svelte'),
    '/transaksi': () => import('@/apps/admin/routes/Transactions.svelte')
  },

  '*': () => import('@/apps/landing/routes/NotFound.svelte')
};
