<script lang="ts">
  type Props = {
    class?: string;
  };

  let { class: className = '' }: Props = $props();
</script>

<div class="animate-pulse rounded-lg bg-slate-200 {className}" aria-hidden="true"></div>
