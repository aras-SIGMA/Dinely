<script lang="ts">
  import { createRouter, Router } from 'sv-router';
  import Toast from '@/components/ui/Toast.svelte';
  import { host } from '@/lib/host';
  import { platformRoutes } from '@/routes/platform';
  import { tenantRoutes } from '@/routes/tenant';
  import { tenantStore } from '@/stores/tenant.svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { setPlatformNavigate } from '@/lib/guards';

  const routes = host.slug ? tenantRoutes : platformRoutes;

  const { navigate } = createRouter(routes);

  // Inisialisasi sesi auth & navigator saat berada di platform utama
  if (!host.slug) {
    setPlatformNavigate(navigate);
    authStore.init();
  }

  // Eager prefetch data tenant saat berada di subdomain / query tenant
  if (host.slug) {
    tenantStore.fetchTenant(host.slug);
  }
</script>

<Router />
<Toast />
