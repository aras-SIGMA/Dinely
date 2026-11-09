<script lang="ts">
  // RegisterMotionIllustration.svelte
  // Premium animated vector illustration for Register (The Digital Menu Checklist theme)

  interface Props {
    subdomain?: string;
  }

  let { subdomain = 'nama-resto' }: Props = $props();
</script>

<div class="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] select-none pointer-events-none">
  <!-- Subtle ambient glow backdrop -->
  <div class="absolute -inset-4 rounded-full bg-white/20 blur-2xl opacity-60" aria-hidden="true"></div>

  <svg
    viewBox="0 0 540 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-auto relative z-10 drop-shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
    role="img"
    aria-label="Ilustrasi persiapan menu digital dan aktivasi toko instan"
  >
    <defs>
      <!-- Gradients -->
      <linearGradient id="reg-shadow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="50%" stop-color="#000000" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </linearGradient>

      <linearGradient id="board-bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#F8FAFC" />
      </linearGradient>

      <linearGradient id="board-clip" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="50%" stop-color="#475569" />
        <stop offset="100%" stop-color="#1E293B" />
      </linearGradient>

      <linearGradient id="subdomain-badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#F0FDF4" />
      </linearGradient>

      <filter id="reg-badge-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.2" />
      </filter>
    </defs>

    <!-- 1. BASE FLOOR SHADOW -->
    <ellipse cx="270" cy="385" rx="220" ry="16" fill="url(#reg-shadow-grad)" />

    <!-- 2. DECORATIVE BACKGROUND PLANT (RIGHT SIDE) -->
    <g class="sway-plant origin-[460px_385px]">
      <!-- Clay Pot -->
      <path d="M445 350 L475 350 L468 385 L452 385 Z" fill="#E2E8F0" />
      <ellipse cx="460" cy="350" rx="15" ry="4" fill="#CBD5E1" />
      <!-- Lush Leaves -->
      <path d="M460 350 Q485 305 515 315 Q490 330 460 350 Z" fill="#10B981" />
      <path d="M460 348 Q475 275 450 260 Q440 290 460 348 Z" fill="#059669" />
      <path d="M460 350 Q430 305 425 325 Q445 335 460 350 Z" fill="#34D399" />
    </g>

    <!-- 3. GIANT MENU CHECKLIST CLIPBOARD -->
    <g transform="translate(145, 65)">
      <!-- Board Backplate / Drop Shadow -->
      <rect x="0" y="20" width="225" height="295" rx="20" fill="#E2E8F0" />
      <rect x="-3" y="17" width="225" height="295" rx="20" fill="url(#board-bg)" stroke="#FFFFFF" stroke-width="2" />

      <!-- Top Metallic Clip -->
      <rect x="70" y="8" width="80" height="24" rx="6" fill="url(#board-clip)" />
      <rect x="90" y="2" width="40" height="8" rx="4" fill="#94A3B8" />
      <circle cx="110" cy="20" r="3" fill="#E2E8F0" />

      <!-- Board Header Title -->
      <g transform="translate(20, 52)">
        <rect x="0" y="0" width="30" height="6" rx="3" fill="#F97316" />
        <rect x="36" y="0" width="85" height="6" rx="3" fill="#CBD5E1" />
        <line x1="0" y1="16" x2="185" y2="16" stroke="#E2E8F0" stroke-width="1.5" />
      </g>

      <!-- CHECKLIST ITEM 1: Website Menu Digital -->
      <g transform="translate(20, 85)" class="checklist-item-1">
        <!-- Checkbox Circle -->
        <circle cx="12" cy="12" r="11" fill="#DCFCE7" stroke="#10B981" stroke-width="2" />
        <path d="M7 12 L10.5 15.5 L17 9" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="check-mark" />
        <!-- Text Lines -->
        <text x="32" y="12" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1E293B">Menu Instan</text>
        <text x="32" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="500" fill="#64748B">Aktif otomatis via web</text>
      </g>

      <!-- CHECKLIST ITEM 2: QR Meja Mandiri -->
      <g transform="translate(20, 135)" class="checklist-item-2">
        <!-- Checkbox Circle -->
        <circle cx="12" cy="12" r="11" fill="#DCFCE7" stroke="#10B981" stroke-width="2" />
        <path d="M7 12 L10.5 15.5 L17 9" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="check-mark" />
        <!-- Text Lines -->
        <text x="32" y="12" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1E293B">QR Meja Mandiri</text>
        <text x="32" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="500" fill="#64748B">Pelanggan pesan mandiri</text>
      </g>

      <!-- CHECKLIST ITEM 3: Rekap Keuangan 0% Komisi -->
      <g transform="translate(20, 185)" class="checklist-item-3">
        <!-- Checkbox Circle -->
        <circle cx="12" cy="12" r="11" fill="#DCFCE7" stroke="#10B981" stroke-width="2" />
        <path d="M7 12 L10.5 15.5 L17 9" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="check-mark" />
        <!-- Text Lines -->
        <text x="32" y="12" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1E293B">0% Biaya Komisi</text>
        <text x="32" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="500" fill="#64748B">Hasil transaksi 100% milik resto</text>
      </g>

      <!-- Bottom Progress Bar on Board -->
      <g transform="translate(20, 248)">
        <rect x="0" y="0" width="185" height="7" rx="3.5" fill="#E2E8F0" />
        <rect x="0" y="0" width="165" height="7" rx="3.5" fill="#10B981" class="progress-bar-fill" />
        <text x="185" y="20" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#10B981" text-anchor="end">Siap Go-Digital 100%</text>
      </g>
    </g>

    <!-- 4. CHARACTER (RESTAURATEUR SITTING HAPPILY BESIDE BOARD) -->
    <!-- Matching LottieFiles row 2 col 2 style -->
    <g transform="translate(45, 175)">
      <!-- Seated Legs & Pants -->
      <path d="M35 110 Q50 155 75 165 L115 165 L115 190" stroke="#1E293B" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M25 115 Q35 160 55 175 L85 182" stroke="#0F172A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8" />
      <!-- Shoes -->
      <ellipse cx="120" cy="193" rx="13" ry="6" fill="#F97316" />
      <ellipse cx="90" cy="186" rx="11" ry="5" fill="#EA580C" />

      <!-- Torso / Red-Orange Modern Sweater -->
      <path d="M25 45 C25 35, 65 32, 70 42 L65 115 L22 110 Z" fill="#E11D48" />

      <!-- Arm Pointing happily toward checklist -->
      <path d="M60 48 Q95 65 118 52" stroke="#FDBA74" stroke-width="8" stroke-linecap="round" fill="none" />
      <!-- Stylus / Digital Pen -->
      <line x1="114" y1="56" x2="128" y2="44" stroke="#F97316" stroke-width="3" stroke-linecap="round" />

      <!-- Left Arm resting on knee -->
      <path d="M25 48 Q10 85 45 105" stroke="#FDBA74" stroke-width="8" stroke-linecap="round" fill="none" />

      <!-- Head & Happy Hair -->
      <ellipse cx="48" cy="22" rx="13" ry="15" fill="#FDBA74" />
      <path d="M35 18 C30 5, 58 0, 62 14 C65 24, 52 30, 42 28 Z" fill="#1E293B" />
      <!-- Profile Eye -->
      <circle cx="53" cy="22" r="1.5" fill="#0F172A" />
      <!-- Cheerful Smile -->
      <path d="M50 27 Q54 30 57 27" stroke="#9F1239" stroke-width="1.2" stroke-linecap="round" fill="none" />
    </g>

    <!-- 5. FLOATING LIVE SUBDOMAIN URL PILL BADGE -->
    <g class="float-reg-badge" transform="translate(245, 30)" filter="url(#reg-badge-glow)">
      <!-- Outer Pill -->
      <rect x="0" y="0" width="205" height="48" rx="16" fill="url(#subdomain-badge-grad)" stroke="#FFFFFF" stroke-width="2" />
      <!-- Top edge shine -->
      <line x1="14" y1="2" x2="191" y2="2" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.9" />

      <!-- Green Padlock Icon -->
      <rect x="14" y="14" width="20" height="20" rx="6" fill="#DCFCE7" />
      <svg x="18" y="18" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>

      <!-- URL Text -->
      <text x="42" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#059669">https://</text>
      <text x="76" y="24" font-family="monospace, monospace" font-size="10.5" font-weight="800" fill="#EA580C">
        {subdomain.length > 12 ? subdomain.slice(0, 11) + '…' : subdomain || 'nama-resto'}
      </text>
      <text x="42" y="36" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#64748B">.restolink.site • Online</text>

      <!-- Live Online Dot -->
      <circle cx="188" cy="24" r="4" fill="#10B981" class="pulse-reg-dot" />
    </g>

    <!-- 6. FLOATING SPARKLE STARS & ACCENTS -->
    <g transform="translate(100, 70)" class="pulse-sparkle">
      <path d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7 Z" fill="#FEF08A" />
    </g>
    <g transform="translate(400, 290)" class="pulse-sparkle delay-500">
      <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#FFFFFF" opacity="0.9" />
    </g>
    <g transform="translate(480, 80)" class="pulse-sparkle delay-700">
      <path d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8 Z" fill="#FDE047" />
    </g>
  </svg>
</div>

<style>
  /* 1. Floating Animation for Subdomain URL Badge */
  @keyframes floatBadge {
    0%, 100% {
      transform: translate(245px, 30px);
    }
    50% {
      transform: translate(245px, 20px);
    }
  }

  .float-reg-badge {
    animation: floatBadge 4.5s ease-in-out infinite;
  }

  /* 2. Checkmark Pop Animation */
  @keyframes checkPop {
    0% {
      transform: scale(0.6);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.15);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .check-mark {
    animation: checkPop 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
    transform-origin: center;
  }

  .checklist-item-2 .check-mark {
    animation-delay: 0.6s;
  }

  .checklist-item-3 .check-mark {
    animation-delay: 1.2s;
  }

  /* 3. Gentle Sway for Plant */
  @keyframes sway {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }

  .sway-plant {
    animation: sway 5.5s ease-in-out infinite;
  }

  /* 4. Pulsing Dots & Sparkles */
  @keyframes pulseDot {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.25);
    }
  }

  .pulse-reg-dot {
    animation: pulseDot 2s ease-in-out infinite;
    transform-origin: 188px 24px;
  }

  @keyframes sparklePulse {
    0%, 100% {
      transform: scale(0.7) rotate(0deg);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.2) rotate(45deg);
      opacity: 1;
    }
  }

  .pulse-sparkle {
    animation: sparklePulse 3s ease-in-out infinite;
    transform-origin: center;
  }

  .delay-500 {
    animation-delay: 1.2s;
  }

  .delay-700 {
    animation-delay: 1.8s;
  }
</style>
