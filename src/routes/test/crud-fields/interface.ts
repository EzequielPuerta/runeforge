import { deserialize } from '$app/forms';
import { AttributeType, formatBoolean, type InterfaceMetadata } from '$lib/index.js';
import type { IOwner } from './store.js';

export interface IAdjustment {
	kind: string;
	amount: number;
}

export interface IWidget {
	_id: string;
	name: string;
	code: string;
	unlimited: boolean;
	quantity: number;
	notes: string;
	owner: string;
	adjustments: IAdjustment[];
}

export const widgetMeta = {
	name: {
		label: 'Name',
		type: AttributeType.text,
		placeholder: 'Widget name',
		required: true
	},
	code: {
		label: 'Code',
		type: AttributeType.text,
		placeholder: 'ABC123',
		required: true,
		pattern: '^[A-Z0-9]{3,8}$',
		groupedAs: 'Identification'
	},
	unlimited: {
		label: 'Unlimited quantity',
		type: AttributeType.boolean,
		default: false,
		formatter: formatBoolean(),
		groupedAs: 'Quantity'
	},
	quantity: {
		label: 'Quantity',
		type: AttributeType.number,
		default: 1,
		min: 1,
		max: 100,
		integer: true,
		disabled: (record) => !!record.unlimited,
		groupedAs: 'Quantity'
	},
	notes: {
		label: 'Notes',
		type: AttributeType.textarea,
		placeholder: 'Extra notes...',
		minLength: 3,
		maxLength: 200
	},
	owner: {
		label: 'Owner',
		type: AttributeType.select,
		placeholder: 'Choose an owner',
		// Prefetched slice, used both as the initial dropdown content and as
		// the in-memory fallback for anything the load already knows about.
		options: (data: { owners?: IOwner[] }) =>
			(data.owners ?? []).map((o) => ({ value: o.id, label: o.name })),
		// Anything typed goes to the server instead of filtering `options` in
		// memory, so owners outside the prefetched slice are still reachable.
		search: async (query: string) => {
			const fd = new FormData();
			fd.set('query', query);
			const res = await fetch('?/searchOwners', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type !== 'success') return [];
			const owners = (result.data as { owners?: IOwner[] } | undefined)?.owners ?? [];
			return owners.map((o) => ({ value: o.id, label: o.name }));
		}
	},
	adjustments: {
		label: 'Adjustments',
		type: AttributeType.embedded,
		// Arrays of objects have no sensible plain-text table cell, so this
		// mirrors how real usages. Keep embedded fields out of the list and
		// only show them in forms.
		excludedFromList: true,
		fields: {
			kind: {
				label: 'Kind',
				type: AttributeType.select,
				required: true,
				options: [
					{ value: 'bonus', label: 'Bonus' },
					{ value: 'penalty', label: 'Penalty' }
				]
			},
			amount: {
				label: 'Amount',
				type: AttributeType.number,
				required: true,
				min: 0
			}
		},
		itemLabel: (item) => `${item.kind === 'bonus' ? 'Bonus' : 'Penalty'}: ${item.amount}`
	}
} satisfies InterfaceMetadata<IWidget>;
