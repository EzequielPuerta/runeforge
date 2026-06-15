<script lang="ts">
  import { getIconSet } from '$lib/icons/context.js';

  let {
    name,
    size = '1em',
    class: className = '',
  }: {
    name: string;
    size?: string | number;
    class?: string;
  } = $props();

  const icons = $derived(getIconSet());
  const IconComponent = $derived(icons?.getByName?.(name) ?? null);
</script>

{#if IconComponent}
  <IconComponent {size} class={className} />
{:else}
  <span class={className} title={name}></span>
{/if}
