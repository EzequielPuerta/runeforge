<script lang="ts" module>
  // Module-scoped so every IconRenderer instance shares one fetch/cache per
  // URL instead of re-requesting the same SVG file.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const cache = new Map<string, Promise<string | null>>();

  async function loadSvg(url: string): Promise<string | null> {
    let pending = cache.get(url);
    if (!pending) {
      pending = fetch(url)
        .then((res) => (res.ok ? res.text() : null))
        .catch(() => null);
      cache.set(url, pending);
    }
    const svg = await pending;
    if (svg === null) cache.delete(url);
    return svg;
  }

  /** Stamps `class`/width/height onto the fetched markup's root `<svg>` tag
   * so Tailwind sizing and `currentColor` theming apply the same way they
   * would to a hand-written inline SVG. */
  function styleSvg(svg: string, className: string, size: string): string {
    return svg.replace(
      '<svg',
      `<svg class="${className}" width="${size}" height="${size}"`
    );
  }
</script>

<script lang="ts">
  import { getIconAssetsPath } from '$lib/icons/context.js';

  let {
    name,
    basePath,
    size = '1em',
    class: className = '',
  }: {
    name: string;
    /** Overrides the `setIconAssetsPath` context value for this instance. */
    basePath?: string;
    size?: string | number;
    class?: string;
  } = $props();

  const resolvedBasePath = $derived(basePath ?? getIconAssetsPath());
  const dimension = $derived(typeof size === 'number' ? `${size}px` : size);
  const src = $derived(name ? `${resolvedBasePath}/${name}` : null);

  let markup = $state<string | null>(null);

  $effect(() => {
    if (!src) {
      markup = null;
      return;
    }
    let cancelled = false;
    loadSvg(src).then((svg) => {
      if (!cancelled) markup = svg;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if markup}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html styleSvg(markup, className, dimension)}
{:else}
  <span class={className} title={name}></span>
{/if}
