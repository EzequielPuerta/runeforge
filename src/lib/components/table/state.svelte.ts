import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { ColumnDefinition } from '$lib/types/crud.js';
import { cellRenderedText, compare, isFilterable } from '$lib/components/table/utils.js';
import type { FilterSnapshot, IndexedRow, SortDirection } from '$lib/types/table.js';

export class SortState {
  column = $state<string | null>(null);
  direction = $state<SortDirection | null>(null);

  constructor(initial?: { column: string | null; direction: SortDirection | null } | null) {
    if (initial?.column) {
      this.column = initial.column;
      this.direction = initial.direction ?? 'desc';
    }
  }

  directionFor(attribute: string): SortDirection | null {
    return this.column === attribute ? this.direction : null;
  }

  cycle(attribute: string) {
    if (this.column !== attribute) {
      this.column = attribute;
      this.direction = 'desc';
    } else if (this.direction === 'desc') {
      this.direction = 'asc';
    } else {
      this.column = null;
      this.direction = null;
    }
  }

  apply<T extends object>(rows: IndexedRow<T>[], columns: ColumnDefinition<T>[]): IndexedRow<T>[] {
    const attribute = this.column;
    const direction = this.direction;
    if (!attribute || !direction) return rows;
    const col = columns.find((c) => c.attribute === attribute);
    const factor = direction === 'asc' ? 1 : -1;
    if (col?.formatter) {
      return [...rows].sort((a, b) =>
        factor * cellRenderedText(a.row, col).localeCompare(
          cellRenderedText(b.row, col), undefined, { numeric: true }
        ),
      );
    }
    return [...rows].sort((a, b) =>
      factor * compare(
        (a.row as Record<string, unknown>)[attribute],
        (b.row as Record<string, unknown>)[attribute],
      ),
    );
  }
}

export class FilterState {
  text = new SvelteMap<string, string>();
  values = new SvelteMap<string, SvelteSet<string>>();
  dateRanges = new SvelteMap<string, { from: string; to: string }>();

  constructor(initial?: Partial<FilterSnapshot> | null) {
    for (const [k, v] of Object.entries(initial?.text ?? {})) this.text.set(k, v);
    for (const [k, v] of Object.entries(initial?.values ?? {})) {
      this.values.set(k, new SvelteSet(v));
    }
    for (const [k, v] of Object.entries(initial?.dateRanges ?? {})) this.dateRanges.set(k, v);
  }

  textFor(attribute: string): string {
    return this.text.get(attribute) ?? '';
  }

  dateRangeFor(attribute: string): { from: string; to: string } {
    return this.dateRanges.get(attribute) ?? { from: '', to: '' };
  }

  hasActive(attribute: string): boolean {
    return (this.text.get(attribute)?.length ?? 0) > 0
      || (this.values.get(attribute)?.size ?? 0) > 0
      || !!(this.dateRanges.get(attribute)?.from || this.dateRanges.get(attribute)?.to);
  }

  isChecked(attribute: string, value: string): boolean {
    return this.values.get(attribute)?.has(value) ?? false;
  }

  setText(attribute: string, value: string) {
    if (value) this.text.set(attribute, value);
    else this.text.delete(attribute);
  }

  toggleValue(attribute: string, value: string) {
    let set = this.values.get(attribute);
    if (!set) {
      set = new SvelteSet<string>();
      this.values.set(attribute, set);
    }
    if (set.has(value)) set.delete(value);
    else set.add(value);
  }

  setDateRange(attribute: string, from: string, to: string) {
    if (from || to) this.dateRanges.set(attribute, { from, to });
    else this.dateRanges.delete(attribute);
  }

  clear(attribute: string) {
    this.text.delete(attribute);
    this.values.get(attribute)?.clear();
    this.dateRanges.delete(attribute);
  }

  matches<T extends object>(row: T, columns: ColumnDefinition<T>[]): boolean {
    return columns.every((col) => {
      if (!isFilterable(col)) return true;

      if (col.type === 'datetime') {
        const range = this.dateRanges.get(col.attribute);
        if (range?.from || range?.to) {
          const raw = (row as Record<string, unknown>)[col.attribute];
          const ts = raw ? new Date(raw as string | Date).getTime() : NaN;
          if (isNaN(ts)) return false;
          if (range.from && ts < new Date(range.from).getTime()) return false;
          if (range.to && ts > new Date(range.to + 'T23:59:59.999').getTime()) return false;
        }
        return true;
      }

      const cell = cellRenderedText(row, col);
      const text = this.text.get(col.attribute);
      if (text && !cell.toLowerCase().includes(text.toLowerCase())) return false;
      const selected = this.values.get(col.attribute);
      if (selected && selected.size > 0 && !selected.has(cell)) return false;
      return true;
    });
  }
}

export function snapshotFilter(filter: FilterState): FilterSnapshot {
  return {
    text: Object.fromEntries(filter.text),
    values: Object.fromEntries(
      [...filter.values].map(([k, set]) => [k, [...set]]),
    ),
    dateRanges: Object.fromEntries(filter.dateRanges),
  };
}
