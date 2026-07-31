<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { getStrings } from '$lib/i18n/context.js';
  import type { SearchResolver, SelectOption } from '$lib/types/attribute.js';

  const strings = getStrings();

  let {
    name,
    value = $bindable([]),
    options = [],
    search: searchFn,
    searchDebounceMs = 300,
    placeholder = strings.selectPlaceholder,
    error = '',
    disabled = false,
  }: {
    name?: string;
    value?: string[];
    options?: SelectOption[];
    search?: SearchResolver;
    searchDebounceMs?: number;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
  } = $props();

  const popId = $props.id();
  const anchorName = `--multiselect-anchor-${popId}`;

  let query = $state('');
  let popoverEl: HTMLElement | undefined = $state();

  let remoteResults = $state<SelectOption[] | null>(null);
  let searching = $state(false);
  const pickedLabels = new SvelteMap<string, string>();

  let searchToken = 0;
  $effect(() => {
    if (!searchFn) return;
    const q = query.trim();
    if (!q) {
      remoteResults = null;
      searching = false;
      return;
    }
    const token = ++searchToken;
    searching = true;
    const timer = setTimeout(() => {
      searchFn(q).then((results) => {
        if (token !== searchToken) return; // stale response, a newer query took over
        remoteResults = results;
        searching = false;
      });
    }, searchDebounceMs);
    return () => clearTimeout(timer);
  });

  const filtered = $derived(
    searchFn
      ? (remoteResults ?? options)
      : query.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options
  );

  const selectedLabels = $derived(
    value.map((v) => options.find((o) => o.value === v)?.label ?? pickedLabels.get(v) ?? v)
  );
  const buttonLabel = $derived(value.length === 0 ? placeholder : strings.selectedCount(value.length));

  function toggle(option: SelectOption) {
    if (value.includes(option.value)) {
      value = value.filter((v) => v !== option.value);
    } else {
      value = [...value, option.value];
      pickedLabels.set(option.value, option.label);
    }
  }

  function clear() {
    value = [];
    pickedLabels.clear();
    query = '';
  }

  function onToggle(e: Event) {
    if ((e as ToggleEvent).newState === 'closed') query = '';
  }
</script>

<div class="relative w-full">
  {#if name}
    <input type="hidden" {name} value={JSON.stringify(value)} />
  {/if}

  <button
    type="button"
    class="select select-bordered w-full text-left font-normal"
    class:select-error={!!error}
    class:opacity-40={value.length === 0}
    {disabled}
    popovertarget={popId}
    style="anchor-name:{anchorName}"
    title={selectedLabels.join(', ')}
  >
    {buttonLabel}
  </button>

  <div
    popover="auto"
    id={popId}
    bind:this={popoverEl}
    style="position-anchor:{anchorName}; width:anchor-size(width); position-try-fallbacks:flip-block;"
    class="dropdown mt-1 rounded-box border border-base-content/10 bg-base-100 shadow-lg"
    ontoggle={onToggle}
  >
    <div class="p-2">
      <input
        type="text"
        class="input input-bordered input-sm w-full"
        placeholder={strings.selectSearch}
        bind:value={query}
        autocomplete="off"
      />
    </div>
    <ul class="max-h-48 overflow-y-auto p-1">
      <li>
        <button
          type="button"
          class="w-full rounded-btn px-3 py-2 text-left text-sm text-base-content/40 hover:bg-base-200"
          onclick={clear}
        >
          {placeholder}
        </button>
      </li>
      {#if searching}
        <li class="px-3 py-2 text-sm text-base-content/40">{strings.selectSearching}</li>
      {/if}
      {#each filtered as option (option.value)}
        {@const checked = value.includes(option.value)}
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
            class:bg-primary={checked}
            class:text-primary-content={checked}
            onclick={() => toggle(option)}
          >
            <input type="checkbox" class="checkbox checkbox-sm" {checked} tabindex="-1" readonly />
            {option.label}
          </button>
        </li>
      {/each}
      {#if !searching && filtered.length === 0}
        <li class="px-3 py-2 text-sm text-base-content/40">{strings.selectNoResults}</li>
      {/if}
    </ul>
  </div>
</div>
