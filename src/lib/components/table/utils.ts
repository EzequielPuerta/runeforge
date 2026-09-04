import type { ColumnDefinition } from '$lib/types/crud.js';
import type { DistinctEntry, IndexedRow } from '$lib/types/table.js';

export function cellRenderedText<T extends object>(row: T, col: ColumnDefinition<T>): string {
  const value = (row as Record<string, unknown>)[col.attribute];
  if (col.formatter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return col.formatter(value as any, row).replace(/<[^>]*>/g, '').trim();
  }
  return value == null ? '' : String(value);
}

export function isSortable<T extends object>(col: ColumnDefinition<T>): boolean {
  return col.sortable !== false;
}

export function isFilterable<T extends object>(col: ColumnDefinition<T>): boolean {
  return col.filterable !== false;
}

export function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function distinctEntries<T extends object>(
  data: T[],
  columns: ColumnDefinition<T>[],
): Record<string, DistinctEntry<T>[]> {
  const result: Record<string, DistinctEntry<T>[]> = {};
  for (const col of columns) {
    if (!isFilterable(col)) continue;
    const seen: Record<string, true> = {};
    const list: DistinctEntry<T>[] = [];
    for (const row of data) {
      const key = cellRenderedText(row, col);
      if (seen[key]) continue;
      seen[key] = true;
      list.push({ key, row });
    }
    list.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    result[col.attribute] = list;
  }
  return result;
}

/** Returns a copy of `rows` with the item at `from` moved to `to` — pure
 * array surgery, handy for building custom reorder UIs on `PaginatedTable`.
 * Out-of-range indices are a no-op. */
export function moveIndexedRow<T extends object>(
  rows: IndexedRow<T>[],
  from: number,
  to: number,
): IndexedRow<T>[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Generalizes `moveIndexedRow` to moving a *set* of items (SortableJS's
 * `multiDrag`) to `toIndex` in one go, preserving their relative order.
 * `toIndex` is a position in the *result* array, same convention as
 * `moveIndexedRow`'s `to` (and SortableJS's own `newIndex`) — not an index
 * into the pre-move array. Duplicate/out-of-range `fromIndices` are ignored;
 * an empty valid set is a no-op. */
export function moveIndexedRows<T extends object>(
  rows: IndexedRow<T>[],
  fromIndices: number[],
  toIndex: number,
): IndexedRow<T>[] {
  const validFrom = [...new Set(fromIndices)]
    .filter((i) => i >= 0 && i < rows.length)
    .sort((a, b) => a - b);
  if (validFrom.length === 0) return rows;
  const fromSet = new Set(validFrom);
  const moved = validFrom.map((i) => rows[i]);
  const remaining = rows.filter((_, i) => !fromSet.has(i));
  const insertAt = Math.min(remaining.length, Math.max(0, toIndex));
  const next = [...remaining];
  next.splice(insertAt, 0, ...moved);
  return next;
}

/** Resolves the comparator establishing reorder mode's row order: `compare`
 * when given (composite orders — a related record's order first, then this
 * row's own `attribute`), otherwise plain ascending by `attribute`. */
export function resolveReorderComparator<T extends object>(reorder: {
  attribute: keyof T & string;
  compare?: (a: T, b: T) => number;
}): (a: T, b: T) => number {
  if (reorder.compare) return reorder.compare;
  const { attribute } = reorder;
  return (a, b) =>
    compare((a as Record<string, unknown>)[attribute], (b as Record<string, unknown>)[attribute]);
}
