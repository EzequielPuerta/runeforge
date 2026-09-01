import { describe, it, expect } from 'vitest';
import {
	emptyRecord,
	seedField,
	seedRecord,
	defaultItemLabel,
	formatEmbeddedFieldValue
} from '$lib/components/crud/utils/embedded.js';
import type { FieldDefinition } from '$lib/types/crud.js';

describe('seedField', () => {
	it('coerces booleans to a real boolean', () => {
		expect(seedField({ attribute: 'active', type: 'boolean' }, undefined)).toBe(false);
		expect(seedField({ attribute: 'active', type: 'boolean' }, true)).toBe(true);
	});

	it('defaults files to null', () => {
		expect(seedField({ attribute: 'avatar', type: 'file' }, undefined)).toBeNull();
		expect(seedField({ attribute: 'avatar', type: 'file' }, 'url')).toBe('url');
	});

	it('defaults embedded values to an empty array unless already an array', () => {
		expect(seedField({ attribute: 'items', type: 'embedded' }, undefined)).toEqual([]);
		expect(seedField({ attribute: 'items', type: 'embedded' }, [{ a: 1 }])).toEqual([{ a: 1 }]);
	});

	it('stringifies everything else', () => {
		expect(seedField({ attribute: 'quantity', type: 'number' }, 5)).toBe('5');
		expect(seedField({ attribute: 'name', type: 'text' }, undefined)).toBe('');
	});

	it('defaults multiselect/tree values to an empty array, stringifying each element like a scalar select', () => {
		// Values are matched against SelectOption.value (always a string) inside
		// MultiSelect/Tree — a stored array of raw numeric ids (as JSON round-trips
		// them) must come out stringified, or `Set.has`/`Array.includes` never match.
		expect(seedField({ attribute: 'tags', type: 'multiselect' }, undefined)).toEqual([]);
		expect(seedField({ attribute: 'tags', type: 'multiselect' }, [1, 2])).toEqual(['1', '2']);
		expect(seedField({ attribute: 'categories', type: 'tree' }, [3])).toEqual(['3']);
		expect(seedField({ attribute: 'categories', type: 'tree' }, ['already-a-string'])).toEqual([
			'already-a-string'
		]);
	});
});

describe('emptyRecord', () => {
	it('defaults booleans to false, honoring a truthy default', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'active', type: 'boolean' },
			{ attribute: 'verified', type: 'boolean', default: true }
		];
		expect(emptyRecord(fields)).toEqual({ active: false, verified: true });
	});

	it('defaults files to null', () => {
		const fields: FieldDefinition[] = [{ attribute: 'avatar', type: 'file' }];
		expect(emptyRecord(fields)).toEqual({ avatar: null });
	});

	it('defaults embedded fields to an empty array, honoring an array default', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'subcriterios', type: 'embedded' },
			{ attribute: 'tags', type: 'embedded', default: [{ label: 'x' }] }
		];
		expect(emptyRecord(fields)).toEqual({ subcriterios: [], tags: [{ label: 'x' }] });
	});

	it('stringifies everything else, honoring a default', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'name', type: 'text' },
			{ attribute: 'quantity', type: 'number', default: 5 }
		];
		expect(emptyRecord(fields)).toEqual({ name: '', quantity: '5' });
	});
});

describe('seedRecord', () => {
	it('normalizes each field from the source object like emptyRecord does for defaults', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'active', type: 'boolean' },
			{ attribute: 'quantity', type: 'number' },
			{ attribute: 'tags', type: 'multiselect' }
		];
		expect(seedRecord(fields, { active: true, quantity: 5, tags: [1, 2] })).toEqual({
			active: true,
			quantity: '5',
			tags: ['1', '2']
		});
	});

	it("prefers a field's seed resolver over the source's raw value", () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'label', type: 'text', seed: (src) => `${src.name}!` }
		];
		expect(seedRecord(fields, { name: 'foo', label: 'ignored' })).toEqual({
			name: 'foo',
			label: 'foo!'
		});
	});

	it('keeps source keys that have no matching field, e.g. the id', () => {
		expect(seedRecord([{ attribute: 'name', type: 'text' }], { id: '123', name: 'foo' })).toEqual({
			id: '123',
			name: 'foo'
		});
	});
});

describe('defaultItemLabel', () => {
	const fields: FieldDefinition[] = [
		{
			attribute: 'formula',
			type: 'select',
			options: [
				{ value: 'max', label: 'Máximo' },
				{ value: 'min', label: 'Mínimo' }
			]
		},
		{ attribute: 'quantity', type: 'number' }
	];

	it("joins each sub-field's resolved display value", () => {
		expect(defaultItemLabel(fields, { formula: 'max', quantity: 3 })).toBe('Máximo · 3');
	});

	it('falls back to the raw value when a select value has no matching option', () => {
		expect(defaultItemLabel(fields, { formula: 'unknown', quantity: 1 })).toBe('unknown · 1');
	});

	it('skips null/empty sub-field values', () => {
		expect(defaultItemLabel(fields, { formula: 'max', quantity: '' })).toBe('Máximo');
	});

	it('includes the field label only when a boolean sub-field is true', () => {
		const boolFields: FieldDefinition[] = [
			{ attribute: 'urgent', type: 'boolean', title: 'Urgent' }
		];
		expect(defaultItemLabel(boolFields, { urgent: true })).toBe('Urgent');
		expect(defaultItemLabel(boolFields, { urgent: false })).toBe('');
	});
});

describe('formatEmbeddedFieldValue', () => {
	it('returns an empty string for null/undefined/empty values', () => {
		const f: FieldDefinition = { attribute: 'email' };
		expect(formatEmbeddedFieldValue(f, null)).toBe('');
		expect(formatEmbeddedFieldValue(f, undefined)).toBe('');
		expect(formatEmbeddedFieldValue(f, '')).toBe('');
	});

	it('resolves a select value to its option label', () => {
		const f: FieldDefinition = {
			attribute: 'formula',
			type: 'select',
			options: [
				{ value: 'max', label: 'Máximo' },
				{ value: 'min', label: 'Mínimo' }
			]
		};
		expect(formatEmbeddedFieldValue(f, 'max')).toBe('Máximo');
	});

	it('falls back to the raw value when a select value has no matching option', () => {
		const f: FieldDefinition = { attribute: 'formula', type: 'select', options: [] };
		expect(formatEmbeddedFieldValue(f, 'unknown')).toBe('unknown');
	});

	it('stringifies booleans and numbers as-is, unlike defaultItemLabel', () => {
		expect(formatEmbeddedFieldValue({ attribute: 'active', type: 'boolean' }, true)).toBe('true');
		expect(formatEmbeddedFieldValue({ attribute: 'active', type: 'boolean' }, false)).toBe('false');
		expect(formatEmbeddedFieldValue({ attribute: 'quantity', type: 'number' }, 3)).toBe('3');
	});
});
