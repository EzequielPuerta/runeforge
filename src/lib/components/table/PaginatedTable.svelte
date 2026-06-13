<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { SvelteSet } from 'svelte/reactivity';
  import TableBody from '$lib/components/table/TableBody.svelte';
  import Paginator from '$lib/components/table/Paginator.svelte';
  import TableHeader from '$lib/components/table/TableHeader.svelte';
  import { SortState, FilterState } from '$lib/components/table/state.svelte.js';
  import { distinctEntries } from '$lib/components/table/utils.js';
  import type { IndexedRow } from '$lib/types/table.js';
  import type { Snippet } from 'svelte';
  import type { ColumnDefinition } from '$lib/types/crud.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    data = [] as T[],
    columns = [] as ColumnDefinition<T>[],
    pageSize = 10,
    selectable = true,
    selected = $bindable(new SvelteSet<number>()),
    rowActions = undefined as Snippet<[T]> | undefined,
    actionsLabel = strings.actions,
  }: {
    data?: T[];
    columns?: ColumnDefinition<T>[];
    pageSize?: number;
    selectable?: boolean;
    selected?: SvelteSet<number>;
    rowActions?: Snippet<[T]>;
    actionsLabel?: string;
  } = $props();

  const sort = new SortState();
  const filter = new FilterState();

  let currentPage = $state(1);

  const distinctValues = $derived(distinctEntries(data, columns));

  const indexed = $derived(data.map((row, index): IndexedRow<T> => ({ row, index })));
  const filtered = $derived(indexed.filter(({ row }) => filter.matches(row, columns)));
  const sorted = $derived(sort.apply(filtered, columns));

  const totalPages = $derived(Math.ceil(sorted.length / pageSize));
  const pageStart = $derived((currentPage - 1) * pageSize);
  const pageData = $derived(sorted.slice(pageStart, pageStart + pageSize));
  const allChecked = $derived(pageData.length > 0 && pageData.every((e) => selected.has(e.index)));
  const someChecked = $derived(pageData.some((e) => selected.has(e.index)));

  $effect(() => {
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  });

  function resetPage() {
    currentPage = 1;
  }

  function toggleAll() {
    if (allChecked) pageData.forEach((e) => selected.delete(e.index));
    else pageData.forEach((e) => selected.add(e.index));
  }

  function toggleItem(index: number) {
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
  }

  const colCount = $derived(columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0));
</script>

<div class="flex flex-col gap-6">
  <div class="min-w-0 overflow-x-auto rounded-box border border-base-content/10">
    <table class="table table-zebra table-xs w-full text-xs sm:table-md sm:text-base">
      <TableHeader
        {columns}
        {selectable}
        {allChecked}
        {someChecked}
        onToggleAll={toggleAll}
        {sort}
        {filter}
        {distinctValues}
        hasRowActions={!!rowActions}
        {actionsLabel}
        onchange={resetPage}
      />
      <TableBody
        {columns}
        rows={pageData}
        {selectable}
        {selected}
        onToggle={toggleItem}
        {colCount}
        {rowActions}
      />
    </table>
  </div>

  <Paginator
    bind:page={currentPage}
    {totalPages}
    {pageStart}
    {pageSize}
    total={sorted.length}
  />
</div>
