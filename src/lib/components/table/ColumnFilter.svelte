<script lang="ts" generics="T extends object">
  import { onMount } from 'svelte';
  import Label from '$lib/components/form/Label.svelte';
  import Button from '$lib/components/form/Button.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  onMount(() => {
    import('cally');
  });
  import type { DistinctEntry } from '$lib/types/table.js';
  import type { FilterState } from '$lib/components/table/state.svelte.js';
  import type { ColumnDefinition } from '$lib/types/crud.js';

  let {
    column,
    entries = [],
    filter,
    maxCheckboxValues = 20,
    onchange,
  }: {
    column: ColumnDefinition<T>;
    entries?: DistinctEntry<T>[];
    filter: FilterState;
    maxCheckboxValues?: number;
    onchange?: () => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
  const popId = $derived(`filter-pop-${column.attribute}`);
  const anchor = $derived(`--filter-anchor-${column.attribute}`);
  const isDatetime = $derived(column.type === 'datetime');

  const dateRange = $derived(filter.dateRangeFor(column.attribute));
  const calendarValue = $derived(
    dateRange.from || dateRange.to ? `${dateRange.from}/${dateRange.to}` : ''
  );

  let calendarEl: HTMLElement | undefined = $state();

  $effect(() => {
    if (!calendarEl) return;
    function handler() {
      const value = (calendarEl as HTMLElement & { value: string }).value ?? '';
      const [from = '', to = ''] = value.split('/');
      filter.setDateRange(column.attribute, from, to);
      onchange?.();
    }
    calendarEl.addEventListener('change', handler);
    return () => calendarEl?.removeEventListener('change', handler);
  });

  let debounceTimer: ReturnType<typeof setTimeout>;
  function setText(value: string) {
    filter.setText(column.attribute, value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onchange?.(), 300);
  }
  function toggle(value: string) {
    filter.toggleValue(column.attribute, value);
    onchange?.();
  }
  function clear() {
    filter.clear(column.attribute);
    onchange?.();
  }
</script>

<Button
  variant="ghost"
  class={[
    'btn-xs btn-square',
    filter.hasActive(column.attribute) && 'text-primary'
  ]}
  popovertarget={popId}
  style="anchor-name:{anchor}"
  aria-label={strings.filterColumn(column.title ?? column.attribute)}
  title={strings.filter}
>
  {#if filter.hasActive(column.attribute)}
    {@const Icon = icons.filterActive}
    <Icon class="size-3.5" />
  {:else}
    {@const Icon = icons.filter}
    <Icon class="size-3.5" />
  {/if}
</Button>

<div
  popover="auto"
  id={popId}
  style="position-anchor:{anchor}; position-try-fallbacks:flip-block;"
  class="dropdown dropdown-end rounded-box border border-base-content/10 bg-base-100 p-3 shadow-lg"
  class:w-56={!isDatetime}
>
  {#if isDatetime}
    <calendar-range
      class="cally bg-base-100"
      value={calendarValue}
      bind:this={calendarEl}
    >
      <svg aria-label={strings.previous} class="fill-current size-4" {...{"slot": "previous"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
      <svg aria-label={strings.next} class="fill-current size-4" {...{"slot": "next"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
      <calendar-month></calendar-month>
    </calendar-range>
    {#if dateRange.from || dateRange.to}
      <p class="mt-2 text-center text-xs text-base-content/60">
        {dateRange.from || '…'} → {dateRange.to || '…'}
      </p>
    {/if}
    {#if filter.hasActive(column.attribute)}
      <Button variant="ghost" class="btn-sm mt-2 w-full" onclick={clear}>
        {strings.clearFilter}
      </Button>
    {/if}
  {:else}
    <div class="relative">
      <input
        type="text"
        class={['input input-bordered input-sm w-full', filter.hasActive(column.attribute) && 'pr-7']}
        placeholder={strings.filterPlaceholder}
        value={filter.textFor(column.attribute)}
        oninput={(e) => setText(e.currentTarget.value)}
      />
      {#if filter.hasActive(column.attribute)}
        {@const Icon = icons.clear}
        <Button
          variant="ghost"
          class="btn-xs btn-square btn-circle absolute top-1/2 right-1 -translate-y-1/2"
          aria-label={strings.clearFilter}
          title={strings.clearFilter}
          onclick={clear}
        >
          <Icon class="size-3" />
        </Button>
      {/if}
    </div>

    {#if entries.length > 0 && entries.length < maxCheckboxValues}
      <div class="mt-2 flex max-h-60 flex-col gap-1 overflow-y-auto">
        {#each entries as entry (entry.key)}
          <Label class="flex cursor-pointer items-center gap-2 text-sm font-normal normal-case">
            <input
              type="checkbox"
              class="checkbox checkbox-xs shrink-0"
              checked={filter.isChecked(column.attribute, entry.key)}
              onchange={() => toggle(entry.key)}
            />
            <span class="truncate">
              {entry.key === '' ? strings.emptyValue : entry.key}
            </span>
          </Label>
        {/each}
      </div>
    {/if}
  {/if}
</div>
