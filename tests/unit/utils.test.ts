import { describe, it, expect } from 'vitest';
import {
	compare,
	cellRenderedText,
	isSortable,
	isFilterable,
	distinctEntries,
	moveIndexedRow,
	moveIndexedRows,
	resolveReorderComparator,
} from '$lib/components/table/utils.js';
import type { ColumnDefinition } from '$lib/types/crud.js';
import type { IndexedRow } from '$lib/types/table.js';

describe('compare', () => {
	it('returns 0 for two nulls', () => expect(compare(null, null)).toBe(0));
	it('sorts null before non-null', () => {
		expect(compare(null, 1)).toBeLessThan(0);
		expect(compare(1, null)).toBeGreaterThan(0);
	});
	it('compares numbers', () => {
		expect(compare(1, 2)).toBeLessThan(0);
		expect(compare(2, 1)).toBeGreaterThan(0);
		expect(compare(5, 5)).toBe(0);
	});
	it('compares strings with numeric locale collation', () => {
		expect(compare('b', 'a')).toBeGreaterThan(0);
		expect(compare('10', '9')).toBeGreaterThan(0);
	});
});

describe('isSortable / isFilterable', () => {
	it('defaults to true when property is absent', () => {
		const col = { attribute: 'name' } as ColumnDefinition<{ name: string }>;
		expect(isSortable(col)).toBe(true);
		expect(isFilterable(col)).toBe(true);
	});
	it('respects explicit false', () => {
		const col = {
			attribute: 'name',
			sortable: false,
			filterable: false,
		} as ColumnDefinition<{ name: string }>;
		expect(isSortable(col)).toBe(false);
		expect(isFilterable(col)).toBe(false);
	});
});

describe('cellRenderedText', () => {
	it('returns the string value of a field', () => {
		const row = { name: 'Alice' };
		const col = { attribute: 'name' } as ColumnDefinition<typeof row>;
		expect(cellRenderedText(row, col)).toBe('Alice');
	});
	it('coerces numbers to strings', () => {
		const row = { age: 30 };
		const col = { attribute: 'age' } as ColumnDefinition<typeof row>;
		expect(cellRenderedText(row, col)).toBe('30');
	});
	it('returns empty string for null/undefined', () => {
		const row = { name: null as unknown as string };
		const col = { attribute: 'name' } as ColumnDefinition<typeof row>;
		expect(cellRenderedText(row, col)).toBe('');
	});
	it('applies formatter and strips HTML tags', () => {
		const row = { active: true };
		const col = {
			attribute: 'active',
			formatter: (v: unknown) => `<b>${v ? 'Sí' : 'No'}</b>`,
		} as unknown as ColumnDefinition<typeof row>;
		expect(cellRenderedText(row, col)).toBe('Sí');
	});
});

describe('distinctEntries', () => {
	type Row = { name: string; city: string };
	const data: Row[] = [
		{ name: 'Charlie', city: 'Rosario' },
		{ name: 'Alice', city: 'Buenos Aires' },
		{ name: 'Alice', city: 'Córdoba' },
		{ name: 'Bob', city: 'Buenos Aires' },
	];

	it('deduplicates and sorts entries per column', () => {
		const cols = [{ attribute: 'name' }] as ColumnDefinition<Row>[];
		const result = distinctEntries(data, cols);
		expect(result['name'].map((e) => e.key)).toEqual(['Alice', 'Bob', 'Charlie']);
	});

	it('keeps the first row seen for each distinct key', () => {
		const cols = [{ attribute: 'name' }] as ColumnDefinition<Row>[];
		const result = distinctEntries(data, cols);
		const alice = result['name'].find((e) => e.key === 'Alice');
		expect(alice?.row.city).toBe('Buenos Aires');
	});

	it('skips non-filterable columns', () => {
		const cols = [
			{ attribute: 'name', filterable: false },
		] as ColumnDefinition<Row>[];
		const result = distinctEntries(data, cols);
		expect(result['name']).toBeUndefined();
	});
});

describe('moveIndexedRow', () => {
	type Row = { name: string };
	const rows: IndexedRow<Row>[] = [
		{ row: { name: 'a' }, index: 0 },
		{ row: { name: 'b' }, index: 1 },
		{ row: { name: 'c' }, index: 2 },
		{ row: { name: 'd' }, index: 3 },
	];

	it('moves an item forward', () => {
		const result = moveIndexedRow(rows, 0, 2);
		expect(result.map((e) => e.row.name)).toEqual(['b', 'c', 'a', 'd']);
	});

	it('moves an item backward', () => {
		const result = moveIndexedRow(rows, 3, 1);
		expect(result.map((e) => e.row.name)).toEqual(['a', 'd', 'b', 'c']);
	});

	it('preserves each row\'s original `index` (position in the source data), not just its content', () => {
		const result = moveIndexedRow(rows, 0, 2);
		expect(result.map((e) => e.index)).toEqual([1, 2, 0, 3]);
	});

	it('returns the same array reference for a no-op move', () => {
		expect(moveIndexedRow(rows, 2, 2)).toBe(rows);
	});

	it('does not mutate the input array', () => {
		const copy = [...rows];
		moveIndexedRow(rows, 0, 3);
		expect(rows).toEqual(copy);
	});

	it('is a no-op for out-of-range indices', () => {
		expect(moveIndexedRow(rows, -1, 2)).toBe(rows);
		expect(moveIndexedRow(rows, 0, 4)).toBe(rows);
	});
});

describe('moveIndexedRows', () => {
	type Row = { name: string };
	const rows: IndexedRow<Row>[] = [
		{ row: { name: 'a' }, index: 0 },
		{ row: { name: 'b' }, index: 1 },
		{ row: { name: 'c' }, index: 2 },
		{ row: { name: 'd' }, index: 3 },
		{ row: { name: 'e' }, index: 4 },
	];

	it('agrees with moveIndexedRow for a single index', () => {
		expect(moveIndexedRows(rows, [0], 2).map((e) => e.row.name)).toEqual(
			moveIndexedRow(rows, 0, 2).map((e) => e.row.name),
		);
	});

	it('moves a selected group together, preserving their relative order', () => {
		// 'a' and 'c' selected, dragged to land at index 3 of the result.
		const result = moveIndexedRows(rows, [0, 2], 3);
		expect(result.map((e) => e.row.name)).toEqual(['b', 'd', 'e', 'a', 'c']);
	});

	it('ignores duplicate and out-of-range indices in `fromIndices`', () => {
		const result = moveIndexedRows(rows, [0, 0, -1, 99], 1);
		expect(result.map((e) => e.row.name)).toEqual(['b', 'a', 'c', 'd', 'e']);
	});

	it('is a no-op when every index is out of range', () => {
		expect(moveIndexedRows(rows, [-1, 99], 1)).toBe(rows);
	});

	it('clamps an out-of-range `toIndex` to the end', () => {
		const result = moveIndexedRows(rows, [0], 99);
		expect(result.map((e) => e.row.name)).toEqual(['b', 'c', 'd', 'e', 'a']);
	});
});

describe('resolveReorderComparator', () => {
	type Row = { name: string; order: number };

	it('defaults to ascending by `attribute` when no `compare` is given', () => {
		const cmp = resolveReorderComparator<Row>({ attribute: 'order' });
		const rows: Row[] = [
			{ name: 'c', order: 2 },
			{ name: 'a', order: 0 },
			{ name: 'b', order: 1 },
		];
		expect([...rows].sort(cmp).map((r) => r.name)).toEqual(['a', 'b', 'c']);
	});

	it('uses `compare` as-is when given, for composite orders', () => {
		type CompositeRow = { name: string; group: number; order: number };
		const cmp = resolveReorderComparator<CompositeRow>({
			attribute: 'order',
			compare: (a, b) => a.group - b.group || a.order - b.order,
		});
		const rows: CompositeRow[] = [
			{ name: 'B0', group: 1, order: 0 },
			{ name: 'A1', group: 0, order: 1 },
			{ name: 'A0', group: 0, order: 0 },
		];
		expect([...rows].sort(cmp).map((r) => r.name)).toEqual(['A0', 'A1', 'B0']);
	});
});
