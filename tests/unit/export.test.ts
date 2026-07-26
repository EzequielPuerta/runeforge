import { describe, it, expect } from 'vitest';
import { buildTable } from '$lib/components/table/export.js';
import type { ColumnDefinition, FieldDefinition } from '$lib/types/crud.js';

describe('buildTable', () => {
	it('behaves exactly as before when there are no embedded columns', () => {
		type Row = { name: string; age: number };
		const rows: Row[] = [
			{ name: 'Alice', age: 30 },
			{ name: 'Bob', age: 40 }
		];
		const columns = [
			{ attribute: 'name', title: 'Name' },
			{ attribute: 'age', title: 'Age' }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns)).toEqual({
			headers: ['Name', 'Age'],
			body: [
				['Alice', '30'],
				['Bob', '40']
			]
		});
	});

	it('expands an embedded column into one row per item and one sub-column per field', () => {
		type Email = { email: string; is_active: boolean };
		type Row = { legal_name: string; emails: Email[] };

		const emailFields: FieldDefinition[] = [
			{ attribute: 'email', title: 'Email' },
			{ attribute: 'is_active', title: 'Vigente', type: 'boolean' }
		];

		const rows: Row[] = [
			{
				legal_name: 'Acme SA',
				emails: [
					{ email: 'a@acme.com', is_active: true },
					{ email: 'b@acme.com', is_active: false }
				]
			}
		];
		const columns = [
			{ attribute: 'legal_name', title: 'Razón social' },
			{ attribute: 'emails', title: 'Emails vinculados', type: 'embedded', fields: emailFields }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns)).toEqual({
			headers: ['Razón social', 'Emails vinculados - Email', 'Emails vinculados - Vigente'],
			body: [
				['Acme SA', 'a@acme.com', 'true'],
				['Acme SA', 'b@acme.com', 'false']
			]
		});
	});

	it('still emits one row, with blank embedded sub-columns, when the array is empty', () => {
		type Row = { legal_name: string; emails: { email: string }[] };
		const emailFields: FieldDefinition[] = [{ attribute: 'email', title: 'Email' }];
		const rows: Row[] = [{ legal_name: 'Sin emails SA', emails: [] }];
		const columns = [
			{ attribute: 'legal_name', title: 'Razón social' },
			{ attribute: 'emails', title: 'Emails', type: 'embedded', fields: emailFields }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns)).toEqual({
			headers: ['Razón social', 'Emails - Email'],
			body: [['Sin emails SA', '']]
		});
	});

	it('resolves a select sub-field to its option label', () => {
		type Row = { name: string; tags: { kind: string }[] };
		const tagFields: FieldDefinition[] = [
			{
				attribute: 'kind',
				title: 'Kind',
				type: 'select',
				options: [{ value: 'bonus', label: 'Bonus' }]
			}
		];
		const rows: Row[] = [{ name: 'Widget', tags: [{ kind: 'bonus' }] }];
		const columns = [
			{ attribute: 'name', title: 'Name' },
			{ attribute: 'tags', title: 'Tags', type: 'embedded', fields: tagFields }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns).body).toEqual([['Widget', 'Bonus']]);
	});

	it('aligns rows by index across multiple embedded columns instead of cross-joining them', () => {
		type Row = {
			name: string;
			emails: { email: string }[];
			phones: { number: string }[];
		};
		const emailFields: FieldDefinition[] = [{ attribute: 'email', title: 'Email' }];
		const phoneFields: FieldDefinition[] = [{ attribute: 'number', title: 'Number' }];
		const rows: Row[] = [
			{
				name: 'Acme SA',
				emails: [{ email: 'a@acme.com' }, { email: 'b@acme.com' }],
				phones: [{ number: '111' }]
			}
		];
		const columns = [
			{ attribute: 'name', title: 'Name' },
			{ attribute: 'emails', title: 'Emails', type: 'embedded', fields: emailFields },
			{ attribute: 'phones', title: 'Phones', type: 'embedded', fields: phoneFields }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns).body).toEqual([
			['Acme SA', 'a@acme.com', '111'],
			['Acme SA', 'b@acme.com', '']
		]);
	});

	it('treats an embedded column with no fields as a regular column', () => {
		type Row = { name: string; tags: unknown[] };
		const rows: Row[] = [{ name: 'Widget', tags: [] }];
		const columns = [
			{ attribute: 'name', title: 'Name' },
			{ attribute: 'tags', title: 'Tags', type: 'embedded' }
		] as ColumnDefinition<Row>[];

		expect(buildTable(rows, columns)).toEqual({
			headers: ['Name', 'Tags'],
			body: [['Widget', '']]
		});
	});
});
