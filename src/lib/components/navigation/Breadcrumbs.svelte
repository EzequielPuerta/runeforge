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
