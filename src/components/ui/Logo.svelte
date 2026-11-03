<script lang="ts">
  type Props = {
    size?: 'sm' | 'md' | 'lg';
    showTagline?: boolean;
    iconOnly?: boolean;
    class?: string;
  };

  let {
    size = 'md',
    showTagline = false,
    iconOnly = false,
    class: className = ''
  }: Props = $props();

  const iconSizes = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-11'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
</script>

<div class="inline-flex items-center gap-2.5 {className}">
  <!-- Monogram R Squircle Icon -->
  <div
    class="flex {iconSizes[size]} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm shadow-brand-600/20"
    aria-hidden="true"
  >
    <!-- Centered & Balanced SVG R Monogram -->
    <svg
      viewBox="0 0 60 60"
      class="size-3/5 text-white"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        transform="translate(-1.5, -0.25)"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M19 17C19 15.8954 19.8954 15 21 15H33C39.0751 15 44 19.9249 44 26C44 30.686 41.0708 34.6888 36.9427 36.2574L42.5298 43.7069C43.0854 44.4477 42.5566 45.5 41.6318 45.5H36.3682C35.7925 45.5 35.2505 45.2045 34.9351 44.7214L29.25 36H26V44C26 44.8284 25.3284 45.5 24.5 45.5C23.6716 45.5 23 44.8284 23 44V17H21C20.1716 17 19.5 16.3284 19 15.5C18.5 14.5 19 17 19 17ZM26 21V30H33C35.2091 30 37 28.2091 37 26C37 23.7909 35.2091 22 33 22H26Z"
        fill="currentColor"
      />
    </svg>
  </div>

  {#if !iconOnly}
    <div class="flex flex-col">
      <span class="font-extrabold tracking-tight leading-none text-slate-900 {textSizes[size]}">
        Resto<span class="text-brand-600">Link</span>
      </span>
      {#if showTagline}
        <span class="text-[9px] font-bold tracking-widest uppercase text-slate-500 mt-1">
          Digital Menu & Order
        </span>
      {/if}
    </div>
  {/if}
</div>
