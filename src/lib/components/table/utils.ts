import type { ColumnDefinition } from '$lib/types/crud.js';
import type { DistinctEntry } from '$lib/types/table.js';

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
