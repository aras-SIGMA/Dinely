<script lang="ts">
  type MascotVariant = 'avatar' | 'waving' | 'thinking' | 'happy';
  type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

  type Props = {
    variant?: MascotVariant;
    size?: MascotSize;
    class?: string;
    animated?: boolean;
    title?: string;
  };

  let {
    variant = 'avatar',
    size = 'md',
    class: className = '',
    animated = false,
    title = 'Linka — Maskot Resmi Dinely'
  }: Props = $props();

  const uid = Math.random().toString(36).slice(2, 8);

  const sizeClasses: Record<MascotSize, string> = {
    xs: 'size-6',     // 24px
    sm: 'size-8',     // 32px
    md: 'size-10',    // 40px
    lg: 'size-16',    // 64px
    xl: 'size-24',    // 96px
    '2xl': 'size-32', // 128px
    custom: ''
  };
</script>

<div
  class="relative inline-flex items-center justify-center shrink-0 select-none {sizeClasses[size]} {className}"
  role="img"
  aria-label={title}
>
  <svg
    viewBox="0 0 120 120"
    class="w-full h-full overflow-visible drop-shadow-xs"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Gradient Tubuh Utama Linka -->
      <linearGradient id="linkaShellGrad-{uid}" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FB923C" />
        <stop offset="45%" stop-color="#F97316" />
        <stop offset="100%" stop-color="#EA580C" />
      </linearGradient>

      <!-- Gradient Highlight Perut / Celemek -->
      <linearGradient id="linkaBellyGrad-{uid}" x1="60" y1="65" x2="60" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFBEB" />
        <stop offset="100%" stop-color="#FEF3C7" />
      </linearGradient>

      <!-- Gradient Topi Koki -->
      <linearGradient id="linkaHatGrad-{uid}" x1="60" y1="10" x2="60" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#F1F5F9" />
      </linearGradient>

      <!-- Shadow Halus -->
      <radialGradient id="linkaShadow-{uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0F172A" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Bayangan Dasar (Ground Shadow) -->
    <ellipse cx="60" cy="112" rx="36" ry="6" fill="url(#linkaShadow-{uid})" />

    <!-- ==================== KAKI-KAKI KEPITING (LEGS) ==================== -->
    <g class="crab-legs" stroke="#C2410C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Kaki Kiri -->
      <path d="M30 82 Q18 85 14 96" />
      <path d="M34 88 Q24 94 22 104" />
      <path d="M40 92 Q32 102 32 108" />

      <!-- Kaki Kanan -->
      <path d="M90 82 Q102 85 106 96" />
      <path d="M86 88 Q96 94 98 104" />
      <path d="M80 92 Q88 102 88 108" />
    </g>

    <!-- ==================== CAPIT / PINCERS ==================== -->
    {#if variant === 'waving'}
      <!-- Capit Kiri (Istirahat Santai) -->
      <g class="claw-left">
        <path d="M34 70 Q16 68 18 50 Q22 38 32 44 Q28 56 38 62 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M22 46 Q12 44 14 34 Q24 34 26 42 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
      </g>

      <!-- Capit Kanan (Melambai Tinggi Ceria) -->
      <g class="claw-right {animated ? 'animate-wave-claw origin-[86px_68px]' : ''}">
        <path d="M86 68 Q104 60 102 40 Q98 28 88 34 Q92 46 82 54 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <!-- Pincer Thumb -->
        <path d="M96 34 Q106 28 104 18 Q94 20 92 28 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
        <!-- Motion lines melambai -->
        <path d="M110 24 Q114 30 110 36" stroke="#FB923C" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M115 20 Q120 28 116 38" stroke="#FB923C" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </g>
    {:else if variant === 'thinking'}
      <!-- Capit Kiri (Pegang Pipi/Dagu Berpikir) -->
      <g class="claw-left">
        <path d="M36 74 Q24 74 24 58 Q28 48 38 52 Q34 62 42 66 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M28 50 Q20 46 24 38 Q32 40 32 48 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
      </g>

      <!-- Capit Kanan (Mengetuk Dagu) -->
      <g class="claw-right">
        <path d="M84 72 Q96 70 94 56 Q88 46 78 52 Q82 60 74 65 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M88 48 Q94 40 88 34 Q82 38 82 46 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
        <!-- Balon Pikiran Mini -->
        <circle cx="102" cy="34" r="3" fill="#E2E8F0" />
        <circle cx="109" cy="24" r="5" fill="#E2E8F0" />
        <circle cx="112" cy="12" r="7" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
        <text x="112" y="15" font-size="8" font-weight="bold" fill="#F97316" text-anchor="middle">?</text>
      </g>
    {:else if variant === 'happy'}
      <!-- Capit Kiri (Mengangkat Sukses) -->
      <g class="claw-left {animated ? 'animate-bounce-subtle' : ''}">
        <path d="M34 66 Q16 54 22 36 Q30 26 38 34 Q32 46 42 54 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M24 32 Q16 24 24 16 Q32 20 30 28 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
        <!-- Bintang Sparkle Kiri -->
        <path d="M12 22 L14 26 L18 28 L14 30 L12 34 L10 30 L6 28 L10 26 Z" fill="#FBBF24" />
      </g>

      <!-- Capit Kanan (Mengangkat Sukses) -->
      <g class="claw-right {animated ? 'animate-bounce-subtle' : ''}">
        <path d="M86 66 Q104 54 98 36 Q90 26 82 34 Q88 46 78 54 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M96 32 Q104 24 96 16 Q88 20 90 28 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
        <!-- Bintang Sparkle Kanan -->
        <path d="M108 22 L110 26 L114 28 L110 30 L108 34 L106 30 L102 28 L106 26 Z" fill="#FBBF24" />
      </g>
    {:else}
      <!-- AVATAR / DEFAULT: Capit Imut Merangkul di Sisi Badan -->
      <g class="claw-left">
        <path d="M32 70 Q16 66 18 52 Q22 42 30 46 Q26 56 36 62 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M22 48 Q14 44 16 36 Q24 38 24 44 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
      </g>
      <g class="claw-right">
        <path d="M88 70 Q104 66 102 52 Q98 42 90 46 Q94 56 84 62 Z" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />
        <path d="M98 48 Q106 44 104 36 Q96 38 96 44 Z" fill="#F97316" stroke="#C2410C" stroke-width="2" />
      </g>
    {/if}

    <!-- ==================== BADAN KEPITING (CARAPACE) ==================== -->
    <ellipse cx="60" cy="74" rx="34" ry="26" fill="url(#linkaShellGrad-{uid})" stroke="#C2410C" stroke-width="2.5" />

    <!-- Sorotan Cahaya Halus di Tempurung Atas -->
    <path d="M38 60 Q60 52 82 60" stroke="#FDBA74" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8" />

    <!-- ==================== CELEMEK KOKI PUTIH (CHEF APRON) ==================== -->
    <g class="chef-apron">
      <!-- Tali Leher Celemek -->
      <path d="M48 64 Q60 58 72 64" fill="none" stroke="#E2E8F0" stroke-width="2" />
      <!-- Badan Celemek -->
      <path
        d="M48 66 L72 66 Q76 80 70 94 Q60 97 50 94 Q44 80 48 66 Z"
        fill="url(#linkaBellyGrad-{uid})"
        stroke="#E2E8F0"
        stroke-width="1.5"
      />
      <!-- Logo Dinely Mini di Celemek (Piring / Garpu Petir) -->
      <g transform="translate(60, 80) scale(0.65)">
        <circle cx="0" cy="0" r="8" fill="#F97316" />
        <!-- Simbol R/Garpu Putih -->
        <path d="M-3 -4 L3 -4 M0 -4 L0 4 M-3 4 L3 4" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
      </g>
    </g>

    <!-- ==================== MATA CHIBI (BIG KAWAII EYES) ==================== -->
    {#if variant === 'happy'}
      <!-- Mata Melengkung Bahagia ^ ^ -->
      <path d="M44 65 Q50 58 56 65" fill="none" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" />
      <path d="M64 65 Q70 58 76 65" fill="none" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" />
    {:else if variant === 'thinking'}
      <!-- Mata Melirik ke Atas Berpikir -->
      <g class="eye-left">
        <ellipse cx="50" cy="62" rx="6.5" ry="7.5" fill="#0F172A" />
        <circle cx="51" cy="59" r="2.8" fill="#FFFFFF" />
        <circle cx="47.5" cy="64" r="1.2" fill="#FFFFFF" />
      </g>
      <g class="eye-right">
        <ellipse cx="70" cy="62" rx="6.5" ry="7.5" fill="#0F172A" />
        <circle cx="71" cy="59" r="2.8" fill="#FFFFFF" />
        <circle cx="67.5" cy="64" r="1.2" fill="#FFFFFF" />
      </g>
    {:else}
      <!-- Mata Normal Ramah Berbinar -->
      <g class="eye-left">
        <ellipse cx="49" cy="63" rx="6.5" ry="7.5" fill="#0F172A" />
        <circle cx="47.5" cy="60.5" r="2.8" fill="#FFFFFF" />
        <circle cx="51.5" cy="65.5" r="1.3" fill="#FFFFFF" />
      </g>
      <g class="eye-right">
        <ellipse cx="71" cy="63" rx="6.5" ry="7.5" fill="#0F172A" />
        <circle cx="69.5" cy="60.5" r="2.8" fill="#FFFFFF" />
        <circle cx="73.5" cy="65.5" r="1.3" fill="#FFFFFF" />
      </g>
    {/if}

    <!-- Rona Pipi Merah Muda (Blush) -->
    <ellipse cx="38" cy="70" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.8" />
    <ellipse cx="82" cy="70" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.8" />

    <!-- ==================== MULUT SENYUM (SWEET SMILE) ==================== -->
    {#if variant === 'happy'}
      <!-- Senyum Terbuka Ceria -->
      <path d="M53 71 Q60 80 67 71 Z" fill="#9A3412" stroke="#9A3412" stroke-width="1.5" />
      <path d="M56 74 Q60 77 64 74" fill="#FDA4AF" />
    {:else if variant === 'thinking'}
      <!-- Senyum Mungil 'o' -->
      <ellipse cx="60" cy="72" rx="2.5" ry="3" fill="#9A3412" />
    {:else}
      <!-- Senyum Lengkung Ramah -->
      <path d="M54 70 Q60 76 66 70" fill="none" stroke="#9A3412" stroke-width="2.5" stroke-linecap="round" />
    {/if}

    <!-- ==================== TOPI KOKI & ANTENA DIGITAL LINK ==================== -->
    <g class="chef-hat-group">
      <!-- Bayangan Lipatan Topi -->
      <path
        d="M40 46 C36 34 46 22 54 26 C57 18 68 18 72 25 C80 20 88 32 84 46 Z"
        fill="url(#linkaHatGrad-{uid})"
        stroke="#CBD5E1"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Lipatan Detail Topi -->
      <path d="M52 28 Q53 40 50 46" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <path d="M68 28 Q67 40 70 46" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <path d="M60 22 Q60 36 60 46" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="round" fill="none" />

      <!-- Ban Kepala Topi Koki (Headband) -->
      <rect x="42" y="44" width="36" height="7" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" />
      <!-- List Oranye di Ban Topi -->
      <rect x="46" y="46.5" width="28" height="2" rx="1" fill="#F97316" />

      <!-- ==================== ANTENA DIGITAL LINK (WIFI SIGNAL) ==================== -->
      <g class="linka-antenna">
        <!-- Tangkai Antena -->
        <line x1="60" y1="22" x2="60" y2="10" stroke="#64748B" stroke-width="2" stroke-linecap="round" />
        <!-- Node Bola Pemancar Hijau Emerald (Online Active) -->
        <circle cx="60" cy="8" r="4.5" fill="#10B981" stroke="#059669" stroke-width="1.5" />
        <!-- Titik Kilap Antena -->
        <circle cx="58.5" cy="6.5" r="1.5" fill="#A7F3D0" />

        <!-- Gelombang Sinyal Digital WiFi (Dinely Connection) -->
        <path
          d="M52 5 Q60 -1 68 5"
          fill="none"
          stroke="#10B981"
          stroke-width="1.8"
          stroke-linecap="round"
          class={animated ? 'animate-pulse' : ''}
          opacity="0.85"
        />
        <path
          d="M48 1 Q60 -7 72 1"
          fill="none"
          stroke="#10B981"
          stroke-width="1.5"
          stroke-linecap="round"
          class={animated ? 'animate-pulse' : ''}
          opacity="0.5"
        />
      </g>
    </g>
  </svg>
</div>

<style>
  @keyframes waveClaw {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(18deg);
    }
  }

  @keyframes bounceSubtle {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  .animate-wave-claw {
    animation: waveClaw 1.2s ease-in-out infinite;
  }

  .animate-bounce-subtle {
    animation: bounceSubtle 1.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-wave-claw,
    .animate-bounce-subtle {
      animation: none !important;
    }
  }
</style>
