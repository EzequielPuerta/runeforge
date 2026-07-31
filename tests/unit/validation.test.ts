import { describe, it, expect } from 'vitest';
import { validateAll } from '$lib/components/crud/utils/validation.js';
import { en } from '$lib/i18n/en.js';
import type { FieldDefinition } from '$lib/types/crud.js';

function formData(entries: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.set(k, v);
	return fd;
}

describe('validateAll', () => {
	it('flags a required field that is missing', () => {
		const fields: FieldDefinition[] = [{ attribute: 'name', required: true }];
		const errors = validateAll(fields, formData({}), en);
		expect(errors.name).toBe('name is required');
	});

	it('resolves a function `required` against the other submitted fields', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'formula' },
			{
				attribute: 'quantity',
				required: (record) => record.formula !== 'benchmark'
			}
		];

		const benchmarkErrors = validateAll(fields, formData({ formula: 'benchmark' }), en);
		expect(benchmarkErrors.quantity).toBeUndefined();

		const maxErrors = validateAll(fields, formData({ formula: 'max' }), en);
		expect(maxErrors.quantity).toBe('quantity is required');
	});

	it('does not validate further rules on an empty, non-required field', () => {
		const fields: FieldDefinition[] = [{ attribute: 'age', type: 'number', min: 1 }];
		const errors = validateAll(fields, formData({}), en);
		expect(errors.age).toBeUndefined();
	});

	it('flags a non-numeric value for a number field', () => {
		const fields: FieldDefinition[] = [{ attribute: 'age', type: 'number' }];
		const errors = validateAll(fields, formData({ age: 'abc' }), en);
		expect(errors.age).toBe('age must be a number');
	});

	it('flags a non-integer value when integer is required', () => {
		const fields: FieldDefinition[] = [{ attribute: 'age', type: 'number', integer: true }];
		const errors = validateAll(fields, formData({ age: '1.5' }), en);
		expect(errors.age).toBe('age must be a whole number');
	});

	it('flags a number below min', () => {
		const fields: FieldDefinition[] = [{ attribute: 'age', type: 'number', min: 18 }];
		const errors = validateAll(fields, formData({ age: '10' }), en);
		expect(errors.age).toBe('age must be greater than or equal to 18');
	});

	it('flags a number above max', () => {
		const fields: FieldDefinition[] = [{ attribute: 'age', type: 'number', max: 24 }];
		const errors = validateAll(fields, formData({ age: '25' }), en);
		expect(errors.age).toBe('age must be less than or equal to 24');
	});

	it('accepts a number within min/max and integer', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'age', type: 'number', min: 1, max: 24, integer: true }
		];
		const errors = validateAll(fields, formData({ age: '12' }), en);
		expect(errors.age).toBeUndefined();
	});

	it('flags a text value shorter than minLength', () => {
		const fields: FieldDefinition[] = [{ attribute: 'bio', minLength: 5 }];
		const errors = validateAll(fields, formData({ bio: 'hi' }), en);
		expect(errors.bio).toBe('bio must be at least 5 characters');
	});

	it('flags a text value longer than maxLength', () => {
		const fields: FieldDefinition[] = [{ attribute: 'bio', maxLength: 3 }];
		const errors = validateAll(fields, formData({ bio: 'hello' }), en);
		expect(errors.bio).toBe('bio must be at most 3 characters');
	});

	it('flags a text value that does not match pattern', () => {
		const fields: FieldDefinition[] = [{ attribute: 'code', pattern: '^[A-Z0-9]{3,8}$' }];
		const errors = validateAll(fields, formData({ code: 'lower' }), en);
		expect(errors.code).toBe('code has an invalid format');
	});

	it('accepts a text value matching pattern', () => {
		const fields: FieldDefinition[] = [{ attribute: 'code', pattern: '^[A-Z0-9]{3,8}$' }];
		const errors = validateAll(fields, formData({ code: 'ABC123' }), en);
		expect(errors.code).toBeUndefined();
	});

	it('flags a required embedded field with no items', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'subcriterios', type: 'embedded', required: true }
		];
		const errors = validateAll(fields, formData({ subcriterios: '[]' }), en);
		expect(errors.subcriterios).toBe('subcriterios is required');
	});

	it('treats a missing/invalid embedded value as empty for the required check', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'subcriterios', type: 'embedded', required: true }
		];
		expect(validateAll(fields, formData({}), en).subcriterios).toBe('subcriterios is required');
		expect(validateAll(fields, formData({ subcriterios: 'not json' }), en).subcriterios).toBe(
			'subcriterios is required'
		);
	});

	it('accepts a required embedded field with at least one item', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'subcriterios', type: 'embedded', required: true }
		];
		const errors = validateAll(
			fields,
			formData({ subcriterios: JSON.stringify([{ formula: 'max', quantity: 3 }]) }),
			en
		);
		expect(errors.subcriterios).toBeUndefined();
	});

	it('does not require an embedded field that is not marked required', () => {
		const fields: FieldDefinition[] = [{ attribute: 'subcriterios', type: 'embedded' }];
		const errors = validateAll(fields, formData({ subcriterios: '[]' }), en);
		expect(errors.subcriterios).toBeUndefined();
	});

	it('skips a required field entirely when hidden is true', () => {
		const fields: FieldDefinition[] = [{ attribute: 'name', required: true, hidden: true }];
		const errors = validateAll(fields, formData({}), en);
		expect(errors.name).toBeUndefined();
	});

	it('resolves a function `hidden` against the other submitted fields', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'type' },
			{
				attribute: 'explicitEmails',
				required: true,
				hidden: (record) => record.type !== 'EXPLICIT'
			}
		];

		const dynamicErrors = validateAll(fields, formData({ type: 'DYNAMIC' }), en);
		expect(dynamicErrors.explicitEmails).toBeUndefined();

		const explicitErrors = validateAll(fields, formData({ type: 'EXPLICIT' }), en);
		expect(explicitErrors.explicitEmails).toBe('explicitEmails is required');
	});

	it('flags a required multiselect/tree field with no items', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'categories', type: 'tree', required: true },
			{ attribute: 'tags', type: 'multiselect', required: true }
		];
		const errors = validateAll(fields, formData({ categories: '[]', tags: '[]' }), en);
		expect(errors.categories).toBe('categories is required');
		expect(errors.tags).toBe('tags is required');
	});

	it('accepts a required multiselect/tree field with at least one item', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'categories', type: 'tree', required: true },
			{ attribute: 'tags', type: 'multiselect', required: true }
		];
		const errors = validateAll(
			fields,
			formData({ categories: JSON.stringify(['1']), tags: JSON.stringify(['a']) }),
			en
		);
		expect(errors.categories).toBeUndefined();
		expect(errors.tags).toBeUndefined();
	});

	it('treats a missing/invalid multiselect value as empty for the required check', () => {
		const fields: FieldDefinition[] = [{ attribute: 'tags', type: 'multiselect', required: true }];
		expect(validateAll(fields, formData({}), en).tags).toBe('tags is required');
		expect(validateAll(fields, formData({ tags: 'not json' }), en).tags).toBe('tags is required');
	});

	it('validates multiple fields independently', () => {
		const fields: FieldDefinition[] = [
			{ attribute: 'name', required: true },
			{ attribute: 'age', type: 'number', max: 24 }
		];
		const errors = validateAll(fields, formData({ age: '30' }), en);
		expect(errors.name).toBe('name is required');
		expect(errors.age).toBe('age must be less than or equal to 24');
	});
});
