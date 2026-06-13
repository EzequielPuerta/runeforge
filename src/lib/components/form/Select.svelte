<script lang="ts">
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    name,
    value = $bindable(''),
    options = [],
    placeholder = strings.selectPlaceholder,
    error = '',
    disabled = false,
  }: {
    name?: string;
    value?: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
  } = $props();

  let open = $state(false);
  let search = $state('');
  let container: HTMLDivElement;

  const filtered = $derived(
    search.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options
  );

  const selectedLabel = $derived(
    options.find((o) => o.value === value)?.label ?? placeholder
  );

  function toggle() {
    if (disabled) return;
    open = !open;
    if (!open) search = '';
  }

  function pick(val: string) {
    value = val;
    open = false;
    search = '';
  }

  function onWindowClick(e: MouseEvent) {
    if (open && !container.contains(e.target as Node)) {
      open = false;
      search = '';
    }
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class="relative w-full" bind:this={container}>
  {#if name}
    <input type="hidden" {name} {value} />
  {/if}

  <button
    type="button"
    class="select select-bordered w-full text-left font-normal"
    class:select-error={!!error}
    class:opacity-40={!value}
    {disabled}
    onclick={toggle}
  >
    {selectedLabel}
  </button>

  {#if open}
    <div class="absolute z-50 mt-1 w-full rounded-box border border-base-content/10 bg-base-100 shadow-lg">
      <div class="p-2">
        <input
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder={strings.selectSearch}
          bind:value={search}
          autocomplete="off"
        />
      </div>
      <ul class="max-h-48 overflow-y-auto p-1">
        <li>
          <button
            type="button"
            class="w-full rounded-btn px-3 py-2 text-left text-sm text-base-content/40 hover:bg-base-200"
            onclick={() => pick('')}
          >
            {placeholder}
          </button>
        </li>
        {#each filtered as option (option.value)}
          <li>
            <button
              type="button"
              class="w-full rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
              class:bg-primary={value === option.value}
              class:text-primary-content={value === option.value}
              onclick={() => pick(option.value)}
            >
              {option.label}
            </button>
          </li>
        {/each}
        {#if filtered.length === 0}
          <li class="px-3 py-2 text-sm text-base-content/40">{strings.selectNoResults}</li>
        {/if}
      </ul>
    </div>
  {/if}
</div>
