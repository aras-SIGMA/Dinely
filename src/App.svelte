<script lang="ts">
  import { createRouter, Router } from 'sv-router';
  import Toast from '@/components/ui/Toast.svelte';
  import { host } from '@/lib/host';
  import { platformRoutes } from '@/routes/platform';
  import { tenantRoutes } from '@/routes/tenant';

  const routes = host.slug ? tenantRoutes : platformRoutes;

  createRouter(routes);
</script>

<Router />
<Toast />
