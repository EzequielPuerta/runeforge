import { describe, it, expect } from 'vitest';
import { emptyRecord, seedField, defaultItemLabel } from '$lib/components/crud/utils/embedded.js';
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
