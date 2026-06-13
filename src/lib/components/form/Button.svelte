<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    type = 'button',
    disabled = false,
    btn = true,
    variant,
    class: additionalClass,
    children,
    ...rest
  }: {
    btn?: boolean;
    variant?: string;
    children?: Snippet;
  } & HTMLButtonAttributes = $props();
</script>

<button
  {type}
  class={[btn && 'btn', variant && `btn-${variant}`, additionalClass]}
  {disabled}
  {...rest}
>
  {#if children}{@render children()}{/if}
</button>
