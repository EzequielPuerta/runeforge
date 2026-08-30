<script lang="ts">
  import type { FullAutoFill } from 'svelte/elements';
  import Label from '$lib/components/form/Label.svelte';
  import Button from '$lib/components/form/Button.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';

  let {
    name,
    id,
    value = $bindable(''),
    autocomplete,
    required = true,
    placeholder = '',
    invalid = false,
    labelClass,
    inputClass,
    buttonClass,
  }: {
    name?: string;
    id?: string;
    value?: string;
    autocomplete?: FullAutoFill;
    required?: boolean;
    placeholder?: string;
    invalid?: boolean;
    labelClass?: string;
    inputClass?: string;
    buttonClass?: string;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
  let visible = $state(false);
</script>

<Label
  class={[
    'input input-bordered w-full',
    { 'input-error': invalid },
    labelClass
  ]}
>
  <input
    {name}
    {id}
    {required}
    {placeholder}
    bind:value
    {autocomplete}
    type={visible ? 'text' : 'password'}
    class={['grow', inputClass]}
  />
  <Button
    btn={false}
    class={['cursor-pointer opacity-60 hover:opacity-100', buttonClass].filter(Boolean).join(' ')}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    aria-pressed={visible}
    onclick={() => (visible = !visible)}
  >
    {#if visible}
      {@const HideIcon = icons.passwordHide}
      <HideIcon class="size-4" />
    {:else}
      {@const ShowIcon = icons.passwordShow}
      <ShowIcon class="size-4" />
    {/if}
  </Button>
</Label>
