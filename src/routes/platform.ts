import type { Routes } from 'sv-router';
import { guardAdminRoute, guardGuestOnlyRoute, guardOwnerRoute } from '@/lib/guards';

export const platformRoutes: Routes = {
  '/': () => import('@/apps/landing/routes/Home.svelte'),
  '/fitur': () => import('@/apps/landing/routes/Features.svelte'),
  '/hardware': () => import('@/apps/landing/routes/Hardware.svelte'),
  '/tentang-kami': () => import('@/apps/landing/routes/About.svelte'),
  '/hubungi-kami': () => import('@/apps/landing/routes/Contact.svelte'),

  '/daftar': {
    hooks: {
      beforeLoad: guardGuestOnlyRoute
    },
    '/': () => import('@/apps/landing/routes/Register.svelte')
  },

  '/masuk': {
    hooks: {
      beforeLoad: guardGuestOnlyRoute
    },
    '/': () => import('@/apps/landing/routes/Login.svelte')
  },

  '/dashboard': {
    layout: () => import('@/apps/dashboard/DashboardLayout.svelte'),
    hooks: {
      beforeLoad: guardOwnerRoute
    },
    '/': () => import('@/apps/dashboard/routes/Overview.svelte'),
    '/menu': () => import('@/apps/dashboard/routes/MenuManagement.svelte'),
    '/pesanan': () => import('@/apps/dashboard/routes/Orders.svelte'),
    '/profil': () => import('@/apps/dashboard/routes/Profile.svelte'),
    '/langganan': () => import('@/apps/dashboard/routes/Subscription.svelte')
  },

  '/admin': {
    layout: () => import('@/apps/admin/AdminLayout.svelte'),
    hooks: {
      beforeLoad: guardAdminRoute
    },
    '/': () => import('@/apps/admin/routes/Tenants.svelte'),
    '/transaksi': () => import('@/apps/admin/routes/Transactions.svelte')
  },

  '*': () => import('@/apps/landing/routes/NotFound.svelte')
};
