<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  interface Props {
    class?: string;
    'aria-label'?: string;
    onActiveChange?: (active: boolean) => void;
    children: Snippet;
  }

  let { class: className = '', 'aria-label': ariaLabel = '5 Langkah Story Scroll', onActiveChange, children }: Props = $props();

  let containerEl = $state<HTMLElement | null>(null);

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!containerEl || prefersReducedMotion) return;

    const sections = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-flow-section]'));
    if (sections.length === 0) return;

    const triggers: ScrollTrigger[] = [];

    // Trigger for hiding navbar while inside StoryScroll deck
    if (onActiveChange) {
      const activeTrigger = ScrollTrigger.create({
        trigger: containerEl,
        start: 'top 80px',
        end: 'bottom 80px',
        onEnter: () => onActiveChange(true),
        onLeave: () => onActiveChange(false),
        onEnterBack: () => onActiveChange(true),
        onLeaveBack: () => onActiveChange(false),
      });
      triggers.push(activeTrigger);
    }

    sections.forEach((section, i) => {
      gsap.set(section, { zIndex: i + 1 });

      const inner = section.querySelector<HTMLElement>('.flow-art-container');
      if (!inner) return;

      if (i > 0) {
        gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' });
        const tween = gsap.to(inner, {
          rotation: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 25%',
            scrub: true,
          },
        });
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }

      if (i < sections.length - 1) {
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
          })
        );
      }
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
    };
  });
</script>

<div
  bind:this={containerEl}
  aria-label={ariaLabel}
  class="w-full overflow-x-hidden {className}"
>
  {@render children()}
</div>
