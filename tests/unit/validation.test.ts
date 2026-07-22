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
