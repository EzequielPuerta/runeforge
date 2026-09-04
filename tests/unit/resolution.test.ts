import { describe, it, expect } from 'vitest';
import {
	resolveOptions,
	resolveDefault,
	resolveFormatter,
	truncateFormatter,
	inferType,
	buildFieldDefinitions
} from '$lib/components/crud/utils/resolution.js';
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

describe('resolveDefault', () => {
	it('returns undefined when default is absent', () => {
		const m: AttributeMetadata = {};
		expect(resolveDefault(m, null)).toBeUndefined();
	});
	it('returns the value directly when default is a plain value', () => {
		const m: AttributeMetadata = { default: 5 };
		expect(resolveDefault(m, null)).toBe(5);
	});
	it('calls the function with data and returns its result', () => {
		const m: AttributeMetadata = {
			default: (data: { countries: { id: number; name: string }[] }) =>
				data.countries.find((c) => c.name === 'Argentina')?.id
		};
		const data = {
			countries: [
				{ id: 1, name: 'Uruguay' },
				{ id: 2, name: 'Argentina' }
			]
		};
		expect(resolveDefault(m, data)).toBe(2);
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

describe('truncateFormatter', () => {
	it('leaves strings at or below max length unchanged', () => {
		const fmt = truncateFormatter(undefined, 5);
		expect(fmt('abc', {})).toBe('abc');
		expect(fmt('abcde', {})).toBe('abcde');
	});

	it('truncates with an ellipsis when over max length', () => {
		const fmt = truncateFormatter(undefined, 5);
		expect(fmt('abcdefgh', {})).toBe('abcde…');
	});

	it('falls back to String(value) when there is no underlying formatter, like TableBody does', () => {
		const fmt = truncateFormatter<Record<string, unknown>, unknown>(undefined, 10);
		expect(fmt(null, {})).toBe('');
		expect(fmt(42, {})).toBe('42');
	});

	it("wraps the underlying formatter's output instead of the raw value", () => {
		const inner = (v: unknown) => `Sí: ${String(v)}`;
		const fmt = truncateFormatter(inner, 5);
		expect(fmt('x', {})).toBe('Sí: x');
		expect(fmt('long-value', {})).toBe('Sí: l…');
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

describe('buildFieldDefinitions', () => {
	const excluded = new Set(['_id']);

	it('maps groupedAs/min/max/integer/minLength/maxLength/pattern through', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			quantity: {
				label: 'Quantity',
				type: 'number',
				groupedAs: 'Stock',
				min: 1,
				max: 24,
				integer: true
			},
			code: { label: 'Code', minLength: 3, maxLength: 8, pattern: '^[A-Z]+$' }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields).toEqual([
			expect.objectContaining({
				attribute: 'quantity',
				groupedAs: 'Stock',
				min: 1,
				max: 24,
				integer: true
			}),
			expect.objectContaining({
				attribute: 'code',
				minLength: 3,
				maxLength: 8,
				pattern: '^[A-Z]+$'
			})
		]);
	});

	it('filters out fields excluded via the given flag, and the excluded set', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			_id: { label: 'ID' },
			name: { label: 'Name' },
			internal: { label: 'Internal', excludedFromCreate: true }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields.map((f) => f.attribute)).toEqual(['name']);
	});

	it('respects a different excludedFlag per view', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			name: { label: 'Name', excludedFromRead: true }
		};

		expect(buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded)).toHaveLength(1);
		expect(buildFieldDefinitions(meta, undefined, 'excludedFromRead', excluded)).toHaveLength(0);
	});

	it('also accepts excludedFromList, used when building embedded sub-columns for the list/export view', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			email: { label: 'Email' },
			internal: { label: 'Internal', excludedFromList: true }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromList', excluded);

		expect(fields.map((f) => f.attribute)).toEqual(['email']);
	});

	it('resolves disabled/dependentOptions/seed/default like the create/read/update blocks did', () => {
		const disabled = (record: Record<string, unknown>) => !!record.locked;
		const meta: Partial<Record<string, AttributeMetadata>> = {
			amount: { label: 'Amount', disabled, default: 5 }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields[0].disabled).toBe(disabled);
		expect(fields[0].default).toBe(5);
	});

	it('builds nested sub-field definitions and passes itemLabel through for embedded fields', () => {
		const itemLabel = (item: Record<string, unknown>) => `${item.formula} -> ${item.quantity}`;
		const meta: Partial<Record<string, AttributeMetadata>> = {
			subcriterios: {
				label: 'Subcriterios',
				type: 'embedded',
				fields: {
					formula: { label: 'Formula', type: 'select', required: true },
					quantity: { label: 'Quantity', type: 'number', required: true, min: 1 }
				},
				itemLabel
			}
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields).toHaveLength(1);
		expect(fields[0].itemLabel).toBe(itemLabel);
		expect(fields[0].fields).toEqual([
			expect.objectContaining({ attribute: 'formula', type: 'select', required: true }),
			expect.objectContaining({ attribute: 'quantity', type: 'number', required: true, min: 1 })
		]);
	});

	it('leaves fields/itemLabel undefined for non-embedded fields', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			name: { label: 'Name' }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields[0].fields).toBeUndefined();
		expect(fields[0].itemLabel).toBeUndefined();
	});

	it('resolves hidden as either a plain boolean or a function, like disabled', () => {
		const hidden = (record: Record<string, unknown>) => record.type !== 'DYNAMIC';
		const meta: Partial<Record<string, AttributeMetadata>> = {
			categories: { label: 'Categories', hidden },
			explicitEmails: { label: 'Emails', hidden: true }
		};

		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);

		expect(fields[0].hidden).toBe(hidden);
		expect(fields[1].hidden).toBe(true);
	});

	it('leaves hidden undefined when not set', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = { name: { label: 'Name' } };
		const fields = buildFieldDefinitions(meta, undefined, 'excludedFromCreate', excluded);
		expect(fields[0].hidden).toBeUndefined();
	});

	it('resolves formatter against the passed-in data, like the list columns do', () => {
		const inner = (v: unknown) => String(v);
		const meta: Partial<Record<string, AttributeMetadata>> = {
			agency: { label: 'Agency', formatter: () => inner }
		};

		const fields = buildFieldDefinitions(meta, 'anything', 'excludedFromRead', excluded);

		expect(fields[0].formatter).toBe(inner);
	});

	it('resolves a function default against the passed-in data', () => {
		const meta: Partial<Record<string, AttributeMetadata>> = {
			country: {
				label: 'Country',
				default: (data: { countries: { id: number; name: string }[] }) =>
					data.countries.find((c) => c.name === 'Argentina')?.id
			}
		};
		const data = { countries: [{ id: 7, name: 'Argentina' }] };

		const fields = buildFieldDefinitions(meta, data, 'excludedFromCreate', excluded);

		expect(fields[0].default).toBe(7);
	});
});
