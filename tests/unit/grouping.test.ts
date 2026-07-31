import { describe, it, expect } from 'vitest';
import { groupFields } from '$lib/components/crud/utils/grouping.js';
import type { FieldDefinition } from '$lib/types/crud.js';

function field(attribute: string, groupedAs?: string, row?: string): FieldDefinition {
	return { attribute, groupedAs, row };
}

describe('groupFields', () => {
	it('returns one single-field group per field when none are grouped', () => {
		const fields = [field('name'), field('email')];
		const groups = groupFields(fields);
		expect(groups).toEqual([{ rows: [[fields[0]]] }, { rows: [[fields[1]]] }]);
	});

	it('collects fields sharing the same groupedAs into one titled group', () => {
		const fields = [field('lineBenchmark', 'Line'), field('lineFacet', 'Line')];
		const groups = groupFields(fields);
		expect(groups).toEqual([{ title: 'Line', rows: [[fields[0]], [fields[1]]] }]);
	});

	it('places a grouped bucket at the position of its first occurrence', () => {
		const a = field('a');
		const g1 = field('g1', 'Group');
		const b = field('b');
		const g2 = field('g2', 'Group');
		const groups = groupFields([a, g1, b, g2]);
		expect(groups).toEqual([
			{ rows: [[a]] },
			{ title: 'Group', rows: [[g1], [g2]] },
			{ rows: [[b]] }
		]);
	});

	it('keeps separate groups for different groupedAs titles, preserving order', () => {
		const fields = [field('a', 'One'), field('b', 'Two'), field('c', 'One')];
		const groups = groupFields(fields);
		expect(groups).toEqual([
			{ title: 'One', rows: [[fields[0]], [fields[2]]] },
			{ title: 'Two', rows: [[fields[1]]] }
		]);
	});

	it('returns an empty array for an empty field list', () => {
		expect(groupFields([])).toEqual([]);
	});

	it('collects ungrouped fields sharing the same row into one anonymous group', () => {
		const from = field('from', undefined, 'dates');
		const to = field('to', undefined, 'dates');
		const groups = groupFields([from, to]);
		expect(groups).toEqual([{ rows: [[from, to]] }]);
	});

	it('keeps ungrouped fields with different row values in separate groups', () => {
		const a = field('a', undefined, 'x');
		const b = field('b', undefined, 'y');
		const groups = groupFields([a, b]);
		expect(groups).toEqual([{ rows: [[a]] }, { rows: [[b]] }]);
	});

	it('buckets fields sharing both groupedAs and row into the same row within that group', () => {
		const min = field('min', 'Range', 'bounds');
		const max = field('max', 'Range', 'bounds');
		const label = field('label', 'Range');
		const groups = groupFields([min, max, label]);
		expect(groups).toEqual([{ title: 'Range', rows: [[min, max], [label]] }]);
	});

	it('does not merge a row across two different groupedAs groups', () => {
		const a = field('a', 'One', 'shared');
		const b = field('b', 'Two', 'shared');
		const groups = groupFields([a, b]);
		expect(groups).toEqual([
			{ title: 'One', rows: [[a]] },
			{ title: 'Two', rows: [[b]] }
		]);
	});
});
