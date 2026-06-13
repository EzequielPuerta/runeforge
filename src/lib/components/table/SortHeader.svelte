<script lang="ts">
  import Button from '$lib/components/form/Button.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import type { SortDirection } from '$lib/types/table.js';

  let {
    title,
    sortable = true,
    direction = null,
    onsort,
  }: {
    title: string;
    sortable?: boolean;
    direction?: SortDirection | null;
    onsort?: () => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
</script>

{#if sortable}
  <Button
    btn={false}
    class="flex cursor-pointer items-center gap-1 capitalize hover:text-primary"
    onclick={onsort}
    title="Ordenar"
  >
    <span>{title}</span>
    {#if direction === 'desc'}
      {@const Icon = icons.sortDesc}
      <Icon class="size-3" />
    {:else if direction === 'asc'}
      {@const Icon = icons.sortAsc}
      <Icon class="size-3" />
    {:else}
      {@const Icon = icons.sortNone}
      <Icon class="size-3 opacity-30" />
    {/if}
  </Button>
{:else}
  <span class="capitalize">{title}</span>
{/if}
