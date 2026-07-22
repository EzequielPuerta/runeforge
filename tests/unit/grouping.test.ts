import { describe, it, expect } from 'vitest';
import { groupFields } from '$lib/components/crud/utils/grouping.js';
import type { FieldDefinition } from '$lib/types/crud.js';

function field(attribute: string, groupedAs?: string): FieldDefinition {
	return { attribute, groupedAs };
}

describe('groupFields', () => {
	it('returns one single-field group per field when none are grouped', () => {
		const fields = [field('name'), field('email')];
		const groups = groupFields(fields);
		expect(groups).toEqual([{ fields: [fields[0]] }, { fields: [fields[1]] }]);
	});

	it('collects fields sharing the same groupedAs into one titled group', () => {
		const fields = [field('lineBenchmark', 'Line'), field('lineFacet', 'Line')];
		const groups = groupFields(fields);
		expect(groups).toEqual([{ title: 'Line', fields }]);
	});

	it('places a grouped bucket at the position of its first occurrence', () => {
		const a = field('a');
		const g1 = field('g1', 'Group');
		const b = field('b');
		const g2 = field('g2', 'Group');
		const groups = groupFields([a, g1, b, g2]);
		expect(groups).toEqual([
			{ fields: [a] },
			{ title: 'Group', fields: [g1, g2] },
			{ fields: [b] }
		]);
	});

	it('keeps separate groups for different groupedAs titles, preserving order', () => {
		const fields = [field('a', 'One'), field('b', 'Two'), field('c', 'One')];
		const groups = groupFields(fields);
		expect(groups).toEqual([
			{ title: 'One', fields: [fields[0], fields[2]] },
			{ title: 'Two', fields: [fields[1]] }
		]);
	});

	it('returns an empty array for an empty field list', () => {
		expect(groupFields([])).toEqual([]);
	});
});
