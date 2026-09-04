import { describe, it, expect } from 'vitest';
import { computeReorderChanges } from '$lib/components/crud/utils/reorder.js';

type Row = { id: string; order: number };

describe('computeReorderChanges', () => {
	it('returns nothing when rows are already in sequential order', () => {
		const rows: Row[] = [
			{ id: 'a', order: 0 },
			{ id: 'b', order: 1 },
			{ id: 'c', order: 2 },
		];
		expect(computeReorderChanges(rows, 'order')).toEqual([]);
	});

	it('returns only the rows whose position moved, updated to their new index', () => {
		// 'b' and 'a' swapped places; 'c' already sits at the position matching
		// its stored `order` (2), so it's excluded from the result.
		const rows: Row[] = [
			{ id: 'b', order: 1 },
			{ id: 'a', order: 0 },
			{ id: 'c', order: 2 },
		];
		expect(computeReorderChanges(rows, 'order')).toEqual([
			{ id: 'b', order: 0 },
			{ id: 'a', order: 1 },
		]);
	});

	it('does not mutate the input rows', () => {
		const rows: Row[] = [
			{ id: 'b', order: 1 },
			{ id: 'a', order: 0 },
		];
		computeReorderChanges(rows, 'order');
		expect(rows).toEqual([
			{ id: 'b', order: 1 },
			{ id: 'a', order: 0 },
		]);
	});

	it('treats a missing/non-numeric attribute as changed for every row', () => {
		const rows = [{ id: 'a' }, { id: 'b' }] as unknown as Row[];
		const changed = computeReorderChanges(rows, 'order');
		expect(changed).toEqual([
			{ id: 'a', order: 0 },
			{ id: 'b', order: 1 },
		]);
	});
});
