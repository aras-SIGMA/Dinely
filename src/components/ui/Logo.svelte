<script lang="ts">
  type Props = {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showTagline?: boolean;
    iconOnly?: boolean;
    class?: string;
    theme?: 'light' | 'dark';
  };

  let {
    size = 'md',
    showTagline = false,
    iconOnly = false,
    class: className = '',
    theme = 'light'
  }: Props = $props();

  // Dimensi tinggi sesuai aturan brand guide (Navbar/header: 36-44px)
  const heights = {
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-10',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16'
  };

  const iconSizes = {
    sm: 'size-7 sm:size-8',
    md: 'size-9 sm:size-10',
    lg: 'size-11 sm:size-12',
    xl: 'size-16 sm:size-20'
  };

  const logoSrc = $derived.by(() => {
    if (iconOnly) return '/restolink-icon.svg';
    if (showTagline) {
      return theme === 'dark'
        ? '/restolink-logo-tagline-dark.svg'
        : '/restolink-logo-tagline.svg';
    }
    return theme === 'dark' ? '/restolink-logo-dark.svg' : '/restolink-logo.svg';
  });
</script>

<div class="inline-flex items-center shrink-0 {className}">
  <img
    src={logoSrc}
    alt="RestoLink"
    class="w-auto select-none object-contain {iconOnly ? iconSizes[size] : heights[size]}"
    draggable="false"
  />
</div>
