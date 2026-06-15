<script lang="ts">
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import type { BreadcrumbItem } from '$lib/types/breadcrumb.js';

  let {
    items = [],
    admin = false,
    homeHref,
  }: {
    items?: BreadcrumbItem[];
    admin?: boolean;
    homeHref?: string;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);

  const home: BreadcrumbItem = $derived({
    label: 'Inicio',
    icon: icons.home,
    link: { href: homeHref ?? (admin ? '/admin' : '/') },
  });

  const allItems = $derived([home, ...items]);
</script>

<div class="breadcrumbs text-sm">
  <ul>
    {#each allItems as item, i (i)}
      <li>
        {#if item.link !== undefined}
          <a class="inline-flex items-center gap-2" {...item.link}>
            {#if item.icon}
              {@const ItemIcon = item.icon}
              <ItemIcon class="size-4" />
            {/if}
            <span>{item.label}</span>
          </a>
        {:else}
          <span class="inline-flex items-center gap-2">
            {#if item.icon}
              {@const ItemIcon = item.icon}
              <ItemIcon class="size-4" />
            {/if}
            <span>{item.label}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  /*
   * DaisyUI breadcrumbs use @layer rules that Tailwind v4 doesn't propagate
   * from node_modules. These unlayered rules override that gap.
   */
  :global(.breadcrumbs > ul),
  :global(.breadcrumbs > ol),
  :global(.breadcrumbs > menu) {
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow-x: auto;
  }

  :global(.breadcrumbs > ul > li),
  :global(.breadcrumbs > ol > li),
  :global(.breadcrumbs > menu > li) {
    display: flex;
    align-items: center;
  }

  :global(.breadcrumbs > ul > li + li::before),
  :global(.breadcrumbs > ol > li + li::before),
  :global(.breadcrumbs > menu > li + li::before) {
    content: '';
    display: block;
    opacity: 0.4;
    border-top: 1px solid;
    border-right: 1px solid;
    width: 0.375rem;
    height: 0.375rem;
    margin-inline: 0.5rem 0.75rem;
    rotate: 45deg;
  }
</style>
