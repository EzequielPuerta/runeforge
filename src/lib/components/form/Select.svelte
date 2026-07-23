<script lang="ts">
  import { getStrings } from '$lib/i18n/context.js';
  import type { SearchResolver } from '$lib/types/attribute.js';

  const strings = getStrings();

  let {
    name,
    value = $bindable(''),
    options = [],
    search: searchFn,
    searchDebounceMs = 300,
    placeholder = strings.selectPlaceholder,
    error = '',
    disabled = false,
  }: {
    name?: string;
    value?: string;
    options?: { value: string; label: string }[];
    search?: SearchResolver;
    searchDebounceMs?: number;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
  } = $props();

  const popId = $props.id();
  const anchorName = `--select-anchor-${popId}`;

  let query = $state('');
  let popoverEl: HTMLElement | undefined = $state();

  // Options resolved by `searchFn` for the current query; null while no
  // server search has run yet (e.g. box just opened, query still empty).
  let remoteResults = $state<{ value: string; label: string }[] | null>(null);
  let searching = $state(false);
  // Label of whatever was last picked from `remoteResults`, kept around so the
  // closed-state button can still show it even though it isn't in `options`.
  let pickedLabel = $state<string | null>(null);

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

  const selectedLabel = $derived(
    value === ''
      ? placeholder
      : (options.find((o) => o.value === value)?.label ?? pickedLabel ?? placeholder)
  );

  function pick(option: { value: string; label: string }) {
    value = option.value;
    pickedLabel = option.label;
    query = '';
    popoverEl?.hidePopover();
  }

  function clear() {
    value = '';
    pickedLabel = null;
    query = '';
    popoverEl?.hidePopover();
  }

  // Catches dismissal paths that don't go through pick()/clear() (outside
  // click, Escape), so a stale search doesn't linger for next time it opens.
  function onToggle(e: Event) {
    if ((e as ToggleEvent).newState === 'closed') query = '';
  }
</script>

<div class="relative w-full">
  {#if name}
    <input type="hidden" {name} {value} />
  {/if}

  <button
    type="button"
    class="select select-bordered w-full text-left font-normal"
    class:select-error={!!error}
    class:opacity-40={!value}
    {disabled}
    popovertarget={popId}
    style="anchor-name:{anchorName}"
  >
    {selectedLabel}
  </button>

  <div
    popover="auto"
    id={popId}
    bind:this={popoverEl}
    style="position-anchor:{anchorName}; width:anchor-size(width);"
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
        <li>
          <button
            type="button"
            class="w-full rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
            class:bg-primary={value === option.value}
            class:text-primary-content={value === option.value}
            onclick={() => pick(option)}
          >
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
