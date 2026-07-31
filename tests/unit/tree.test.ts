import { describe, it, expect } from 'vitest';
import { buildChildrenByParent, collectDescendantIds } from '$lib/components/crud/utils/tree.js';
import type { SelectOption } from '$lib/types/attribute.js';

const options: SelectOption[] = [
	{ value: '1', label: 'Root A', parentValue: null },
	{ value: '2', label: 'Root B' },
	{ value: '3', label: 'Child of A', parentValue: '1' },
	{ value: '4', label: 'Grandchild of A', parentValue: '3' },
	{ value: '5', label: 'Another child of A', parentValue: '1' }
];

describe('buildChildrenByParent', () => {
	it('groups options under their parentValue, treating missing/null as root', () => {
		const map = buildChildrenByParent(options);

		expect(map.get(null)?.map((o) => o.value)).toEqual(['1', '2']);
		expect(map.get('1')?.map((o) => o.value)).toEqual(['3', '5']);
		expect(map.get('3')?.map((o) => o.value)).toEqual(['4']);
		expect(map.get('4')).toBeUndefined();
	});

	it('returns an empty map for an empty option list', () => {
		expect(buildChildrenByParent([]).size).toBe(0);
	});
});

describe('collectDescendantIds', () => {
	it('collects all nested descendants, not just direct children', () => {
		const map = buildChildrenByParent(options);
		expect(collectDescendantIds('1', map).sort()).toEqual(['3', '4', '5']);
	});

	it('returns an empty array for a leaf node', () => {
		const map = buildChildrenByParent(options);
		expect(collectDescendantIds('4', map)).toEqual([]);
	});

	it('returns an empty array for a value not present in the map', () => {
		const map = buildChildrenByParent(options);
		expect(collectDescendantIds('999', map)).toEqual([]);
	});
});
