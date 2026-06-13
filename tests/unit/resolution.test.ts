import { describe, it, expect } from 'vitest';
import { resolveOptions, resolveFormatter, inferType } from '$lib/components/crud/utils/resolution.js';
import type { AttributeMetadata } from '$lib/types/attribute.js';

describe('resolveOptions', () => {
	it('returns undefined when options is absent', () => {
		const m: AttributeMetadata = {};
		expect(resolveOptions(m, null)).toBeUndefined();
	});
	it('returns the array directly when options is a static array', () => {
		const opts = [{ value: 'a', label: 'A' }];
		const m: AttributeMetadata = { options: opts };
		expect(resolveOptions(m, null)).toBe(opts);
	});
	it('calls the function with data and returns its result', () => {
		const opts = [{ value: 'x', label: 'X' }];
		const m: AttributeMetadata = { options: () => opts };
		const data = { list: ['x'] };
		expect(resolveOptions(m, data)).toEqual(opts);
	});
});

describe('resolveFormatter', () => {
	it('returns undefined when formatter is absent', () => {
		const m: AttributeMetadata = {};
		expect(resolveFormatter(m, null)).toBeUndefined();
	});
	it('calls the formatter with data and returns its result', () => {
		const inner = (v: unknown) => String(v);
		const m: AttributeMetadata = { formatter: () => inner };
		const result = resolveFormatter(m, 'anything');
		expect(result).toBe(inner);
	});
});

describe('inferType', () => {
	it('returns "boolean" for boolean values', () => {
		expect(inferType('active', true)).toBe('boolean');
		expect(inferType('active', false)).toBe('boolean');
	});
	it('returns "number" for numeric values', () => {
		expect(inferType('age', 42)).toBe('number');
	});
	it('returns "email" for keys containing "email"', () => {
		expect(inferType('email', '')).toBe('email');
		expect(inferType('user_email', '')).toBe('email');
	});
	it('returns "password" for keys containing "password" or "hash"', () => {
		expect(inferType('password', '')).toBe('password');
		expect(inferType('password_hash', '')).toBe('password');
		expect(inferType('hash', '')).toBe('password');
	});
	it('returns "textarea" for content-like key names', () => {
		expect(inferType('description', '')).toBe('textarea');
		expect(inferType('bio', '')).toBe('textarea');
		expect(inferType('notes', '')).toBe('textarea');
		expect(inferType('content', '')).toBe('textarea');
	});
	it('returns "text" as the default', () => {
		expect(inferType('name', '')).toBe('text');
		expect(inferType('city', '')).toBe('text');
	});
});
