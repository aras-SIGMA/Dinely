<script lang="ts">
  // LoginMotionIllustration.svelte
  // Premium animated vector illustration for Login (Cafe & Dining Workspace theme)
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
    aria-label="Ilustrasi suasana santai operasional resto dan pemesanan meja"
  >
    <defs>
      <!-- Gradients -->
      <linearGradient id="login-shadow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="50%" stop-color="#000000" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </linearGradient>

      <linearGradient id="cloche-metal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="40%" stop-color="#F1F5F9" />
        <stop offset="100%" stop-color="#CBD5E1" />
      </linearGradient>

      <linearGradient id="cloche-base" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E2E8F0" />
        <stop offset="50%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#CBD5E1" />
      </linearGradient>

      <linearGradient id="laptop-screen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E293B" />
      </linearGradient>

      <linearGradient id="brand-badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#FFF7ED" />
      </linearGradient>

      <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.22" />
      </filter>
    </defs>

    <!-- 1. BASE FLOOR SHADOW -->
    <ellipse cx="270" cy="385" rx="220" ry="16" fill="url(#login-shadow-grad)" />

    <!-- 2. BACKGROUND FOLIAGE (PLANT WITH GENTLE SWAY) -->
    <g class="sway-plant origin-[470px_380px]">
      <!-- Plant Pot -->
      <path d="M455 350 L485 350 L478 385 L462 385 Z" fill="#E2E8F0" />
      <ellipse cx="470" cy="350" rx="15" ry="4" fill="#CBD5E1" />
      <!-- Leaves -->
      <path d="M470 350 Q485 310 510 320 Q485 335 470 350 Z" fill="#10B981" />
      <path d="M470 348 Q495 285 480 270 Q465 295 470 348 Z" fill="#059669" />
      <path d="M470 350 Q445 305 440 325 Q455 335 470 350 Z" fill="#34D399" />
    </g>

    <!-- 3. RESTAURANT TABLE -->
    <!-- Table Stand & Leg -->
    <rect x="264" y="275" width="12" height="105" rx="6" fill="#475569" />
    <ellipse cx="270" cy="380" rx="42" ry="7" fill="#334155" />
    <!-- Table Surface -->
    <ellipse cx="270" cy="275" rx="145" ry="15" fill="#CBD5E1" />
    <path d="M125 275 C125 283, 415 283, 415 275 L415 269 C415 261, 125 261, 125 269 Z" fill="#F8FAFC" />
    <ellipse cx="270" cy="269" rx="145" ry="14" fill="#FFFFFF" />

    <!-- 4. LEFT CHARACTER (CUSTOMER / GUEST ORDERING) -->
    <g transform="translate(60, 160)">
      <!-- Chair Left -->
      <path d="M70 120 L70 215 M110 120 L110 215" stroke="#64748B" stroke-width="4" stroke-linecap="round" />
      <rect x="55" y="115" width="65" height="10" rx="5" fill="#334155" />
      <!-- Legs & Pants (Dark Navy) -->
      <path d="M85 125 L85 190 L115 190 L115 220" stroke="#1E293B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="122" cy="223" rx="12" ry="5" fill="#0F172A" />
      <!-- Torso / Orange Shirt -->
      <path d="M70 55 C70 45, 105 45, 110 55 L118 125 L75 125 Z" fill="#F97316" />
      <!-- Left Arm & Hand with Phone -->
      <path d="M75 58 Q95 85 125 80" stroke="#FDBA74" stroke-width="9" stroke-linecap="round" fill="none" />
      <rect x="125" y="72" width="16" height="10" rx="2" fill="#0F172A" transform="rotate(15 125 72)" />
      <!-- Head & Hair -->
      <ellipse cx="92" cy="28" rx="14" ry="16" fill="#FDBA74" />
      <path d="M80 25 C75 10, 100 5, 105 18 C108 24, 100 32, 95 32 Z" fill="#1E293B" />
      <!-- Facial profile -->
      <circle cx="98" cy="27" r="1.5" fill="#0F172A" />
    </g>

    <!-- 5. RIGHT CHARACTER (CAFE OWNER / MANAGER WITH LAPTOP) -->
    <g transform="translate(320, 145)">
      <!-- Chair Right -->
      <path d="M45 135 L45 230 M85 135 L85 230" stroke="#64748B" stroke-width="4" stroke-linecap="round" />
      <rect x="35" y="130" width="65" height="10" rx="5" fill="#334155" />
      <!-- Legs & Pants -->
      <path d="M60 140 L60 205 L30 205 L30 238" stroke="#1E293B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <ellipse cx="25" cy="241" rx="12" ry="5" fill="#0F172A" />
      <!-- Torso / Dark Teal Shirt -->
      <path d="M42 70 C42 60, 80 60, 85 70 L80 140 L45 140 Z" fill="#0F766E" />
      <!-- Arms Typing on Laptop -->
      <path d="M75 75 Q40 95 10 102" stroke="#FDBA74" stroke-width="8" stroke-linecap="round" fill="none" />
      <!-- Head & Hair -->
      <ellipse cx="60" cy="42" rx="14" ry="16" fill="#FDBA74" />
      <path d="M45 38 C42 20, 75 15, 78 30 C80 42, 65 48, 55 48 Z" fill="#7C2D12" />
      <!-- Glasses / Specs -->
      <rect x="48" y="40" width="8" height="5" rx="1.5" stroke="#1E293B" stroke-width="1.5" fill="none" />
    </g>

    <!-- 6. TABLE ITEMS: LAPTOP & STEAMING COFFEE & TUDUNG SAJI -->
    <!-- Laptop -->
    <g transform="translate(290, 222)">
      <!-- Open Laptop Screen -->
      <path d="M5 40 L28 4 L72 4 L55 40 Z" fill="url(#laptop-screen)" />
      <!-- Screen Display: Dashboard Mini Graph & Orders -->
      <path d="M12 36 L30 8 L66 8 L51 36 Z" fill="#1E293B" />
      <line x1="28" y1="28" x2="48" y2="28" stroke="#F97316" stroke-width="3" stroke-linecap="round" />
      <line x1="32" y1="20" x2="56" y2="20" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" />
      <!-- Laptop Base -->
      <path d="M0 40 L60 40 L65 45 L5 45 Z" fill="#E2E8F0" />
    </g>

    <!-- Steaming Coffee Cup -->
    <g transform="translate(245, 245)">
      <rect x="0" y="4" width="16" height="15" rx="3" fill="#F97316" />
      <path d="M16 8 Q21 8 21 12 Q21 16 16 16" stroke="#F97316" stroke-width="2.5" fill="none" />
      <!-- Animated Coffee Steam -->
      <path d="M5 0 Q7 -8 4 -15 Q2 -20 6 -26" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8" class="steam-wave" />
      <path d="M11 -2 Q14 -10 10 -17 Q8 -22 12 -28" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" class="steam-wave delay-300" />
    </g>

    <!-- 7. CENTERPIECE: TUDUNG SAJI (CLOCHE) WITH RISING AROMA STEAM -->
    <g transform="translate(190, 218)">
      <!-- Cloche Plate Base -->
      <ellipse cx="38" cy="46" rx="42" ry="7" fill="url(#cloche-base)" />
      <ellipse cx="38" cy="45" rx="44" ry="4" stroke="#CBD5E1" stroke-width="1.5" fill="none" />
      <!-- Dome Cover -->
      <path d="M0 44 C0 22, 17 8, 38 8 C59 8, 76 22, 76 44 Z" fill="url(#cloche-metal)" />
      <!-- Specular Highlight Curve -->
      <path d="M14 40 C14 24, 25 15, 38 14" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.85" />
      <!-- Top Handle Knob -->
      <circle cx="38" cy="5" r="5" fill="#E2E8F0" />
      <circle cx="38" cy="5" r="3.5" fill="#F8FAFC" />

      <!-- Animated Aroma Steam from Dish -->
      <path d="M38 0 Q45 -12 36 -24 Q30 -34 40 -44" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85" class="steam-wave" />
      <path d="M28 -2 Q20 -14 30 -26 Q38 -36 32 -48" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.6" class="steam-wave delay-500" />
    </g>

    <!-- 8. FLOATING ORDER PILL BADGE (QRIS LUNAS - MEJA 04) -->
    <g class="float-badge" transform="translate(295, 60)" filter="url(#badge-glow)">
      <!-- Pill Container -->
      <rect x="0" y="0" width="175" height="58" rx="18" fill="url(#brand-badge-grad)" stroke="#FFFFFF" stroke-width="2.5" />
      <!-- Top edge specular shine -->
      <line x1="16" y1="2" x2="159" y2="2" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.9" />

      <!-- Live Pulsing Green Dot -->
      <circle cx="22" cy="22" r="5" fill="#10B981" class="pulse-dot" />
      <circle cx="22" cy="22" r="9" stroke="#10B981" stroke-width="1.5" fill="none" opacity="0.5" class="pulse-ring" />

      <!-- Text: Table info -->
      <text x="36" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#0F172A" letter-spacing="0.5">MEJA 04 • BARU</text>

      <!-- Badge Pill: QRIS Lunas -->
      <rect x="110" y="12" width="54" height="20" rx="10" fill="#DCFCE7" stroke="#86EFAC" stroke-width="1" />
      <text x="137" y="26" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#15803D" text-anchor="middle">QRIS Lunas</text>

      <!-- Subtext: Total Amount -->
      <text x="22" y="44" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#64748B">Total Masuk:</text>
      <text x="90" y="44" font-family="monospace, monospace" font-size="11" font-weight="900" fill="#EA580C">Rp 39.000</text>
    </g>

    <!-- 9. FLOATING MINI ACCENTS (SPARKLES & ORDER BELL) -->
    <g class="float-slow" transform="translate(130, 90)">
      <circle cx="0" cy="0" r="14" fill="#FFFFFF" fill-opacity="0.9" filter="url(#badge-glow)" />
      <!-- Mini Food Icon (Fork & Knife / Bell) -->
      <path d="M-4 -5 L-4 5 M-6 -5 L-2 -5 M4 -5 Q6 -1 4 5" stroke="#F97316" stroke-width="2" stroke-linecap="round" fill="none" />
    </g>

    <!-- Small Sparkles -->
    <g transform="translate(485, 140)" class="pulse-sparkle">
      <path d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8 Z" fill="#FEF08A" />
    </g>
    <g transform="translate(180, 50)" class="pulse-sparkle delay-700">
      <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#FFFFFF" opacity="0.9" />
    </g>
  </svg>
</div>

<style>
  /* 1. Rising Steam Wave Animation */
  @keyframes steamRise {
    0% {
      transform: translateY(0) scaleX(1);
      opacity: 0.1;
    }
    40% {
      opacity: 0.85;
    }
    100% {
      transform: translateY(-28px) scaleX(1.3);
      opacity: 0;
    }
  }

  .steam-wave {
    animation: steamRise 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    transform-origin: center bottom;
  }

  /* 2. Floating Bobbing Animation for Order Card */
  @keyframes floatBob {
    0%, 100% {
      transform: translate(295px, 60px);
    }
    50% {
      transform: translate(295px, 50px);
    }
  }

  .float-badge {
    animation: floatBob 4s ease-in-out infinite;
  }

  @keyframes floatSlow {
    0%, 100% {
      transform: translate(130px, 90px);
    }
    50% {
      transform: translate(130px, 82px);
    }
  }

  .float-slow {
    animation: floatSlow 5s ease-in-out infinite;
  }

  /* 3. Gentle Breeze Sway for Plant */
  @keyframes sway {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(3.5deg);
    }
  }

  .sway-plant {
    animation: sway 5.5s ease-in-out infinite;
  }

  /* 4. Pulse Rings & Sparkles */
  @keyframes pulseRing {
    0% {
      r: 6px;
      opacity: 0.9;
    }
    100% {
      r: 12px;
      opacity: 0;
    }
  }

  .pulse-ring {
    animation: pulseRing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes pulseDot {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  .pulse-dot {
    animation: pulseDot 2s ease-in-out infinite;
    transform-origin: 22px 22px;
  }

  @keyframes sparklePulse {
    0%, 100% {
      transform: scale(0.7) rotate(0deg);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.15) rotate(45deg);
      opacity: 1;
    }
  }

  .pulse-sparkle {
    animation: sparklePulse 3s ease-in-out infinite;
    transform-origin: center;
  }

  .delay-300 {
    animation-delay: 0.8s;
  }

  .delay-500 {
    animation-delay: 1.4s;
  }

  .delay-700 {
    animation-delay: 1.8s;
  }
</style>
