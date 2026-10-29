<script lang="ts">
  import { createRouter, Router } from 'sv-router';
  import Toast from '@/components/ui/Toast.svelte';
  import { host } from '@/lib/host';
  import { platformRoutes } from '@/routes/platform';
  import { tenantRoutes } from '@/routes/tenant';
  import { tenantStore } from '@/stores/tenant.svelte';

  const routes = host.slug ? tenantRoutes : platformRoutes;

  createRouter(routes);

  // Eager prefetch data tenant saat berada di subdomain / query tenant
  if (host.slug) {
    tenantStore.fetchTenant(host.slug);
  }
</script>

<Router />
<Toast />
