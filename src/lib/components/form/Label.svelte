<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import Required from '$lib/components/form/Required.svelte';

  let {
    text,
    for: labelFor,
    capitalize = false,
    required = false,
    ariaLabel,
    class: additionalClass,
    children,
  }: {
    text?: string;
    for?: string;
    capitalize?: boolean;
    required?: boolean;
    ariaLabel?: string;
    class?: ClassValue;
    children?: Snippet;
  } = $props();

  const derivedAriaLabel = $derived(ariaLabel ?? text);
  const labelClasses = 'text-sm font-medium text-base-content/60';
  const derivedClasses = $derived(additionalClass ?? labelClasses);
</script>

<label
  class={[derivedClasses, capitalize && 'capitalize']}
  for={labelFor}
  aria-label={derivedAriaLabel}
>
  {#if text}{text}{/if}
  {#if required}<Required />{/if}
  {#if children}{@render children()}{/if}
</label>
