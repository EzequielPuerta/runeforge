import { describe, it, expect } from 'vitest';
import {
	buildChildrenByParent,
	buildTreeSearchState,
	collectDescendantIds
} from '$lib/components/crud/utils/tree.js';
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

describe('buildTreeSearchState', () => {
	const map = buildChildrenByParent(options);

	it('returns null for a blank or whitespace-only query (no filtering)', () => {
		expect(buildTreeSearchState('', map)).toBeNull();
		expect(buildTreeSearchState('   ', map)).toBeNull();
	});

	it('matches by label, case-insensitively', () => {
		const state = buildTreeSearchState('root a', map);
		expect(state?.visible.has('1')).toBe(true);
		expect(state?.visible.has('2')).toBe(false);
	});

	it('keeps ancestors of a deep match visible and marks them force-expanded', () => {
		const state = buildTreeSearchState('grandchild', map);

		// '4' (the match) and its ancestors '1' and '3' stay visible so the
		// path to the result is reachable; '2' and '5' are unrelated and drop.
		expect(state?.visible).toEqual(new Set(['1', '3', '4']));
		// '1' and '3' need forcing open since the match is in their subtree,
		// not on the node itself; '4' has no children below it to reveal.
		expect(state?.forceExpanded).toEqual(new Set(['1', '3']));
	});

	it('does not force-expand a node whose own label matches but has no matching descendant', () => {
		const state = buildTreeSearchState('another child', map);

		// Only '5' ("Another child of A") matches; '1' is pulled in as its
		// ancestor and must be forced open, but '5' itself has no children to
		// reveal, so it stays out of forceExpanded.
		expect(state?.visible).toEqual(new Set(['1', '5']));
		expect(state?.forceExpanded).toEqual(new Set(['1']));
	});

	it('returns empty sets when nothing matches', () => {
		const state = buildTreeSearchState('no such label', map);
		expect(state?.visible.size).toBe(0);
		expect(state?.forceExpanded.size).toBe(0);
	});
});
