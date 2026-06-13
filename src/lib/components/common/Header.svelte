<script lang="ts">
  import type { Snippet } from 'svelte';
  import Breadcrumbs from '$lib/components/navigation/Breadcrumbs.svelte';
  import type { BreadcrumbItem } from '$lib/types/breadcrumb.js';

  let {
    title,
    breadcrumbs = [],
    buttons,
    admin = false,
  }: {
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    buttons?: Snippet;
    admin?: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div class="flex flex-col gap-1">
    <h1>{title}</h1>
    <Breadcrumbs items={breadcrumbs} {admin} />
  </div>

  {#if buttons}
    <div class="flex items-center gap-2 pt-1">
      {@render buttons()}
    </div>
  {/if}
</div>
