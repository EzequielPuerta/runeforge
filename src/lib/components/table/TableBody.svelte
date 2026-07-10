<script lang="ts" generics="T extends object">
  import type { Snippet } from 'svelte';
  import type { SvelteSet } from 'svelte/reactivity';
  import type { ColumnDefinition } from '$lib/types/crud.js';
  import type { IndexedRow } from '$lib/types/table.js';

  let {
    columns,
    rows,
    selectable,
    selected,
    onToggle,
    colCount,
    rowActions,
  }: {
    columns: ColumnDefinition<T>[];
    rows: IndexedRow<T>[];
    selectable: boolean;
    selected: SvelteSet<number>;
    onToggle: (index: number) => void;
    colCount: number;
    rowActions?: Snippet<[T]>;
  } = $props();
</script>

<tbody data-testid="paginated-table-body">
  {#if rows.length === 0}
    <tr>
      <td colspan={colCount} class="py-10 text-center text-base-content/50">
        Sin registros
      </td>
    </tr>
  {:else}
    {#each rows as { row, index } (index)}
      <tr
        class="hover"
        class:cursor-pointer={selectable}
        onclick={selectable ? () => onToggle(index) : undefined}
      >
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
