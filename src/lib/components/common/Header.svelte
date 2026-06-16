<script lang="ts">
  import type { Snippet } from 'svelte';
  import Breadcrumbs from '$lib/components/navigation/Breadcrumbs.svelte';
  import type { BreadcrumbItem } from '$lib/types/breadcrumb.js';

  let {
    title,
    breadcrumbs = [],
    buttons,
  }: {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    buttons?: Snippet;
  } = $props();
</script>

<div class="header-root flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div class="flex flex-col gap-1 flex-1">
    <h1>{title}</h1>
    <Breadcrumbs items={breadcrumbs} />
  </div>

  {#if buttons}
    <div class="flex shrink-0 items-center gap-2 sm:pt-1">
      {@render buttons()}
    </div>
  {/if}
</div>

<style>
  h1 {
    font-size: var(--runeforge-crud-title-size, 1.875rem);
  }

  .header-root {
    width: 100%;
    max-width: var(--runeforge-crud-max-width);
    margin-inline: auto;
  }
</style>
