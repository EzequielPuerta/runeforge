<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { SvelteSet } from 'svelte/reactivity';
  import TableBody from '$lib/components/table/TableBody.svelte';
  import Paginator from '$lib/components/table/Paginator.svelte';
  import TableHeader from '$lib/components/table/TableHeader.svelte';
  import { SortState, FilterState, snapshotFilter } from '$lib/components/table/state.svelte.js';
  import { distinctEntries, isFilterable } from '$lib/components/table/utils.js';
  import type {
    FilterSnapshot,
    IndexedRow,
    ServerPagination,
    SortDirection,
    TableQuery,
  } from '$lib/types/table.js';
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
    pagination = undefined as ServerPagination | undefined,
    initialSort = undefined as { column: string; direction: SortDirection } | undefined,
    initialFilters = undefined as Partial<FilterSnapshot> | undefined,
    onPaginationChange = undefined as ((query: TableQuery) => void) | undefined,
  }: {
    data?: T[];
    columns?: ColumnDefinition<T>[];
    pageSize?: number;
    selectable?: boolean;
    selected?: SvelteSet<number>;
    rowActions?: Snippet<[T]>;
    actionsLabel?: string;
    /** When provided, the table trusts `data` is already the requested page and
     * defers pagination/sort/filter to `onPaginationChange` instead of computing
     * them locally. Omit for the original fully-client-side behavior. */
    pagination?: ServerPagination;
    initialSort?: { column: string; direction: SortDirection };
    initialFilters?: Partial<FilterSnapshot>;
    onPaginationChange?: (query: TableQuery) => void;
  } = $props();

  // Intentional one-time hydration of local state from the initial prop
  // values (not a live binding) — `svelte-check`'s state_referenced_locally
  // warning is a false positive here.
  const sort = new SortState(initialSort ?? null);
  const filter = new FilterState(initialFilters ?? null);

  let currentPage = $state(pagination?.page ?? 1);
  let lastKnownPage = pagination?.page ?? 1;

  const distinctValues = $derived(
    pagination
      ? Object.fromEntries(
          columns
            .filter((c) => isFilterable(c) && c.type === 'boolean')
            .map((c) => [
              c.attribute,
              [
                { key: 'true', row: {} as T },
                { key: 'false', row: {} as T },
              ],
            ]),
        )
      : distinctEntries(data, columns)
  );

  const indexed = $derived(data.map((row, index): IndexedRow<T> => ({ row, index })));
  const filtered = $derived(pagination ? indexed : indexed.filter(({ row }) => filter.matches(row, columns)));
  const sorted = $derived(pagination ? filtered : sort.apply(filtered, columns));

  const effectivePageSize = $derived(pagination?.pageSize ?? pageSize);
  const totalPages = $derived(pagination?.totalPages ?? Math.ceil(sorted.length / effectivePageSize));
  const displayPage = $derived(pagination?.page ?? currentPage);
  const pageStart = $derived((displayPage - 1) * effectivePageSize);
  const pageData = $derived(pagination ? sorted : sorted.slice(pageStart, pageStart + effectivePageSize));
  const totalCount = $derived(pagination?.total ?? sorted.length);
  const allChecked = $derived(pageData.length > 0 && pageData.every((e) => selected.has(e.index)));
  const someChecked = $derived(pageData.some((e) => selected.has(e.index)));

  // Client mode only: server mode's totalPages is externally owned, clamping
  // here would fight with URL-driven navigation while a page reload is pending.
  $effect(() => {
    if (!pagination && currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  });

  // Server mode: external (URL/reload) page changes -> sync local state.
  $effect(() => {
    if (pagination && pagination.page !== lastKnownPage) {
      currentPage = pagination.page;
      lastKnownPage = pagination.page;
    }
  });

  // Server mode: local (Paginator click) page changes -> notify caller.
  $effect(() => {
    if (pagination && currentPage !== lastKnownPage) {
      lastKnownPage = currentPage;
      onPaginationChange?.(currentQuery(currentPage));
    }
  });

  function currentQuery(page: number): TableQuery {
    return {
      page,
      ordering: sort.column ? (sort.direction === 'asc' ? sort.column : `-${sort.column}`) : null,
      filters: snapshotFilter(filter),
    };
  }

  function handleHeaderChange() {
    currentPage = 1;
    if (!pagination) return;
    lastKnownPage = 1;
    onPaginationChange?.(currentQuery(1));
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
        onchange={handleHeaderChange}
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
    pageSize={effectivePageSize}
    total={totalCount}
  />
</div>
