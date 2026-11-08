<script lang="ts">
  import MotionFooter from '@/components/ui/MotionFooter.svelte';
  import ChatbotWidget from './ChatbotWidget.svelte';

  type Props = {
    showCta?: boolean;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaButtonText?: string;
    ctaButtonHref?: string;
  };

  let {
    showCta = true,
    ctaTitle = 'Siap Modernisasi UMKM Anda?',
    ctaSubtitle = 'Platform penyedia layanan pemesanan QR, manajemen dapur, dan kasir terpadu #1 di Indonesia.',
    ctaButtonText = 'Mulai Sekarang',
    ctaButtonHref = '/daftar'
  }: Props = $props();
</script>

<MotionFooter
  heading={showCta ? ctaTitle : 'RestoLink Indonesia'}
  subtitle={showCta ? ctaSubtitle : 'Digital Menu & Kitchen OS untuk seluruh UMKM Kuliner Indonesia.'}
  primaryCtaText={ctaButtonText}
  primaryCtaHref={ctaButtonHref}
  secondaryCtaText="Hubungi Tim Kami"
  secondaryCtaHref="/hubungi-kami"
  giantText="RESTOLINK"
  copyrightText="© 2026 RestoLink. Hak Cipta Dilindungi."
  authorName="Kepiting Purba — SMK Taruna Bhakti"
/>

<!-- AI Chatbot Floating Widget (FE-17) -->
<ChatbotWidget />
