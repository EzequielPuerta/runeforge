<script lang="ts" generics="T extends object">
  import SortHeader from '$lib/components/table/SortHeader.svelte';
  import ColumnFilter from '$lib/components/table/ColumnFilter.svelte';
  import { isSortable, isFilterable } from '$lib/components/table/utils.js';
  import type { DistinctEntry } from '$lib/types/table.js';
  import type { ColumnDefinition } from '$lib/types/crud.js';
  import type { SortState, FilterState } from '$lib/components/table/state.svelte.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    columns,
    selectable,
    allChecked,
    someChecked,
    onToggleAll,
    sort,
    filter,
    distinctValues,
    hasRowActions = false,
    actionsLabel = strings.actions,
    reorderActive = false,
    onchange,
  }: {
    columns: ColumnDefinition<T>[];
    selectable: boolean;
    allChecked: boolean;
    someChecked: boolean;
    onToggleAll: () => void;
    sort: SortState;
    filter: FilterState;
    distinctValues: Record<string, DistinctEntry<T>[]>;
    hasRowActions?: boolean;
    actionsLabel?: string;
    reorderActive?: boolean;
    onchange?: () => void;
  } = $props();

  function sortBy(col: ColumnDefinition<T>) {
    if (reorderActive || !isSortable(col)) return;
    sort.cycle(col.attribute);
    onchange?.();
  }
</script>

<thead class="bg-base-200">
  <tr>
    {#if reorderActive}
      <th class="w-10"></th>
    {/if}
    {#if selectable}
      <th>
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onchange={onToggleAll}
        />
      </th>
    {/if}
    {#each columns as col (col.attribute)}
      {@const title = (col.title ?? col.attribute).replace(/_/g, ' ')}
      <th>
        <div class="flex items-center gap-1">
          <SortHeader
            {title}
            sortable={isSortable(col) && !reorderActive}
            direction={reorderActive ? null : sort.directionFor(col.attribute)}
            onsort={() => sortBy(col)}
          />
          {#if isFilterable(col) && !reorderActive}
            <ColumnFilter
              column={col}
              entries={distinctValues[col.attribute] ?? []}
              {filter}
              {onchange}
            />
          {/if}
        </div>
      </th>
    {/each}
    {#if hasRowActions}
      <th class="text-right">{actionsLabel}</th>
    {/if}
  </tr>
</thead>
