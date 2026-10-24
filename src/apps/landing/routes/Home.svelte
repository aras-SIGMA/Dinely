<script lang="ts">
  import Button from '@/components/ui/Button.svelte';
  import Card from '@/components/ui/Card.svelte';
</script>

<main class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
  <p class="text-sm font-semibold uppercase tracking-wide text-brand-600">RestoLink</p>
  <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
    Website menu digital untuk UMKM kuliner
  </h1>
  <p class="mt-4 max-w-2xl text-base text-slate-600">
    Satu dashboard untuk profil usaha, kategori, menu, harga, ketersediaan, dan pesanan. Website
    publik otomatis aktif di subdomain usaha Anda.
  </p>
  <div class="mt-8 flex flex-wrap gap-3">
    <Button size="lg">Mulai trial 30 hari</Button>
    <Button size="lg" variant="secondary">Lihat paket</Button>
  </div>

  <div class="mt-12 grid gap-4 sm:grid-cols-3">
    <Card title="Menu selalu rapi">
      <p class="text-sm text-slate-600">Ubah harga atau stok sekali, tampil langsung di website.</p>
    </Card>
    <Card title="Pesanan tercatat">
      <p class="text-sm text-slate-600">Pesanan masuk ke dashboard, statusnya bisa diperbarui.</p>
    </Card>
    <Card title="Aktif otomatis">
      <p class="text-sm text-slate-600">Pembayaran tervalidasi di server sebelum tenant diaktifkan.</p>
    </Card>
  </div>
</main>
