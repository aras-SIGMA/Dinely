<script lang="ts">
  import { host } from '@/lib/host';
</script>

<main
  class="mx-auto min-h-screen max-w-3xl px-6 py-16"
  style="--brand-primary: {host.slug ? 'var(--brand-primary)' : 'var(--brand-primary)'}"
>
  <h1 class="text-3xl font-bold text-slate-900">Website tenant</h1>
  <p class="mt-3 text-slate-600">
    Tenant <code class="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{host.slug}</code> terdeteksi.
    Tampilan menu publik akan diisi pada Milestone 6.
  </p>
</main>
