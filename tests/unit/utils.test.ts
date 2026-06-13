import { describe, it, expect } from 'vitest';
import {
	compare,
	cellRenderedText,
	isSortable,
	isFilterable,
	distinctEntries,
} from '$lib/components/table/utils.js';
import type { ColumnDefinition } from '$lib/types/crud.js';

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
