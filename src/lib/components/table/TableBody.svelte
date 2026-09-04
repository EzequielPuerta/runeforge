<script lang="ts" generics="T extends object">
  import type { Snippet } from 'svelte';
  import type { SvelteSet } from 'svelte/reactivity';
  import type { ColumnDefinition } from '$lib/types/crud.js';
  import type { IndexedRow, ReorderOptions } from '$lib/types/table.js';
  import { sortableRows, type SortEndIndices } from '$lib/components/table/sortable.js';
  import { moveIndexedRows } from '$lib/components/table/utils.js';
  import Button from '$lib/components/form/Button.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    columns,
    rows,
    selectable,
    selected,
    onToggle,
    colCount,
    rowActions,
    reorder,
    visibleRange,
    onDragStart,
    onReorder,
  }: {
    columns: ColumnDefinition<T>[];
    rows: IndexedRow<T>[];
    selectable: boolean;
    selected: SvelteSet<number>;
    onToggle: (index: number) => void;
    colCount: number;
    rowActions?: Snippet<[T]>;
    reorder?: ReorderOptions<T>;
    /** Reorder mode only: positions within `rows` (not the `index` field)
     * that are actually on screen — the rest render `hidden` so they stay in
     * the DOM (and reachable by SortableJS) across a page flip mid-drag. */
    visibleRange?: { start: number; end: number };
    onDragStart?: () => void;
    /** Fires once a drag settles, with the complete row list in its new
     * order — computed from SortableJS's own before/after indices, correct
     * uniformly for a single-row drag and a `multiDrag` group move alike. */
    onReorder?: (rows: IndexedRow<T>[]) => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);

  let tbodyEl: HTMLElement | undefined = $state();

  function handleDragEnd(indices: SortEndIndices) {
    const fromIndices =
      indices.oldIndicies.length > 0 ? indices.oldIndicies : [indices.oldIndex ?? -1];
    const toIndex =
      indices.newIndicies.length > 0 ? Math.min(...indices.newIndicies) : (indices.newIndex ?? -1);
    onReorder?.(moveIndexedRows(rows, fromIndices, toIndex));
  }

  // Mirrors the checkbox selection into SortableJS's own MultiDrag selection
  // registry, so a `multiDrag` drag moves whatever's currently checked
  // instead of relying on the plugin's own click/modifier-key selection UX.
  $effect(() => {
    const utils = reorder?.multiDrag ? reorder.sortable.utils : undefined;
    if (!utils || !tbodyEl) return;
    for (const { index } of rows) {
      const el = tbodyEl.querySelector(`[data-row-key="${index}"]`);
      if (!(el instanceof HTMLElement)) continue;
      if (selected.has(index)) utils.select(el);
      else utils.deselect(el);
    }
  });
</script>

<tbody
  data-testid="paginated-table-body"
  bind:this={tbodyEl}
  use:sortableRows={{
    enabled: !!reorder,
    sortable: reorder?.sortable,
    multiDrag: reorder?.multiDrag,
    onStart: () => onDragStart?.(),
    onEnd: handleDragEnd,
  }}
>
  {#if rows.length === 0}
    <tr>
      <td colspan={colCount} class="py-10 text-center text-base-content/50">
        Sin registros
      </td>
    </tr>
  {:else}
    {#each rows as { row, index }, position (index)}
      {@const isHidden = !!visibleRange && (position < visibleRange.start || position >= visibleRange.end)}
      <tr
        class="hover"
        class:group={!!reorder}
        class:cursor-pointer={selectable}
        data-row-key={index}
        style:display={isHidden ? 'none' : null}
        onclick={selectable ? () => onToggle(index) : undefined}
      >
        {#if reorder}
          {@const GripIcon = reorder.icon ?? icons.grip}
          <td class="w-10 border-l-4 border-base-content/10 p-0 group-hover:border-primary/50">
            <Button
              type="button"
              btn={false}
              data-reorder-handle
              class="flex h-full w-full cursor-grab items-center justify-center py-2 text-base-content/40 active:cursor-grabbing"
              title={strings.reorder}
              aria-label={strings.reorder}
              onclick={(e) => e.stopPropagation()}
            >
              {#if GripIcon}
                <GripIcon class="size-4" />
              {/if}
            </Button>
          </td>
        {/if}
        {#if selectable}
          <td>
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={selected.has(index)}
              onchange={() => onToggle(index)}
              onclick={(e) => e.stopPropagation()}
            />
          </td>
        {/if}
        {#each columns as col (col.attribute)}
          <td>
            {#if col.component}
              {@const Cell = col.component}
              <Cell value={row[col.attribute]} row={row} />
            {:else if col.formatter}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html col.formatter(row[col.attribute], row)}
            {:else}
              {String(row[col.attribute] ?? '')}
            {/if}
          </td>
        {/each}
        {#if rowActions}
          <td class="text-right">{@render rowActions(row)}</td>
        {/if}
      </tr>
    {/each}
  {/if}
</tbody>
