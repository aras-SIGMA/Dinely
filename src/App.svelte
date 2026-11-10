<script lang="ts">
  import { Router } from 'sv-router';
  import Toast from '@/components/ui/Toast.svelte';
  import LoadingScreen from '@/components/ui/LoadingScreen.svelte';
  import { host } from '@/lib/host';
  import { router } from '@/lib/router';
  import { tenantStore } from '@/stores/tenant.svelte';
  import { authStore } from '@/stores/auth.svelte';
  import { setPlatformNavigate } from '@/lib/guards';

  // Inisialisasi sesi auth & navigator saat berada di platform utama
  if (!host.slug) {
    setPlatformNavigate(router.navigate);
    authStore.init();
  }

  // Eager prefetch data tenant saat berada di subdomain / query tenant
  if (host.slug) {
    tenantStore.fetchTenant(host.slug);
  }

  const isAppLoading = $derived(
    host.slug ? tenantStore.loading : authStore.loading
  );
</script>

<LoadingScreen loading={isAppLoading} />
<Router />
<Toast />
